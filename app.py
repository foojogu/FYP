from flask import Flask, render_template, request, jsonify, send_from_directory, redirect, url_for
from flask_cors import CORS
import openai
import os
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, auth
from functools import wraps

load_dotenv()

app = Flask(__name__, static_url_path='', static_folder='static')
CORS(app)

# Initialize Firebase Admin SDK
cred = credentials.Certificate('firebase-credentials.json')
firebase_admin.initialize_app(cred)

# Initialize OpenAI client
openai.api_key = os.getenv('OPENAI_API_KEY')

def verify_firebase_token(request):
    # First check Authorization header
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        id_token = auth_header.split('Bearer ')[1]
    else:
        # If no Authorization header, check cookie
        id_token = request.cookies.get('authToken')
        if not id_token:
            return None
    
    try:
        decoded_token = auth.verify_id_token(id_token)
        # Get the user and check email verification
        user = auth.get_user(decoded_token['uid'])
        if not user.email_verified:
            return None
        return decoded_token
    except Exception as e:
        print(f"Token verification error: {str(e)}")
        return None

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Skip authentication for login-related pages and static assets
        if request.path in ['/login', '/register', '/forgot-password'] or \
           request.path.startswith('/static/'):
            return f(*args, **kwargs)

        # Check for auth token in cookie
        auth_token = request.cookies.get('authToken')
        if not auth_token:
            return redirect(url_for('login'))

        try:
            # Verify the token
            decoded_token = auth.verify_id_token(auth_token)
            # Get the user and check email verification
            user = auth.get_user(decoded_token['uid'])
            if not user.email_verified:
                return redirect(url_for('login'))
            # Add user info to request
            request.user = decoded_token
            return f(*args, **kwargs)
        except Exception as e:
            print(f"Auth error in decorator: {str(e)}")
            return redirect(url_for('login'))
    return decorated_function

# Serve static files
@app.route('/')
@login_required
def index():
    return send_from_directory('static', 'index.html')

@app.route('/login')
def login():
    return send_from_directory('static', 'login.html')

@app.route('/register')
def register():
    return send_from_directory('static', 'register.html')

@app.route('/forgot-password')
def forgot_password():
    return send_from_directory('static', 'forgot-password.html')

# API routes
@app.route('/api/verify-session', methods=['POST'])
def verify_session():
    user_data = verify_firebase_token(request)
    if user_data:
        return jsonify({
            'authenticated': True,
            'user': {
                'uid': user_data['uid'],
                'email': user_data.get('email', ''),
                'name': user_data.get('name', '')
            }
        })
    return jsonify({'authenticated': False}), 401

@app.route('/api/lessons', methods=['GET'])
@login_required
def get_lessons():
    lessons = [
        {
            'id': 1,
            'title': 'Introduction to Python',
            'description': 'Learn the basics of Python programming',
            'difficulty': 'Beginner'
        },
        {
            'id': 2,
            'title': 'Web Development Fundamentals',
            'description': 'HTML, CSS, and JavaScript basics',
            'difficulty': 'Beginner'
        }
    ]
    return jsonify(lessons)

@app.route('/api/ai/code-review', methods=['POST'])
@login_required
def code_review():
    data = request.json
    code = data.get('code', '')
    
    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful coding tutor. Review the following code and provide constructive feedback."},
                {"role": "user", "content": f"Please review this code:\n{code}"}
            ]
        )
        
        feedback = response.choices[0].message.content
        return jsonify({"feedback": feedback})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
