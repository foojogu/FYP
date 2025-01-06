from flask import Flask, render_template, request, jsonify, send_from_directory, redirect, url_for, make_response, session
from flask_cors import CORS
import openai
import os
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, auth
from functools import wraps

load_dotenv()

app = Flask(__name__, static_url_path='', static_folder='static')
app.secret_key = os.urandom(24)  # Add secret key for sessions
CORS(app)

# Initialize Firebase Admin SDK
cred = credentials.Certificate('firebase-credentials.json')
firebase_admin.initialize_app(cred)

# Initialize OpenAI client
openai.api_key = os.getenv('OPENAI_API_KEY')

def set_auth_cookie(response, token):
    response.set_cookie(
        'authToken',
        value=token,
        max_age=7 * 24 * 60 * 60,  # 7 days
        httponly=True,
        secure=False,  # Set to True in production with HTTPS
        samesite='Lax',
        path='/'
    )
    return response

def verify_firebase_token(request):
    print("Verifying token...")
    # First check Authorization header
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        id_token = auth_header.split('Bearer ')[1]
        print("Using token from Authorization header")
    else:
        # If no Authorization header, check cookie
        id_token = request.cookies.get('authToken')
        if not id_token:
            print("No token found in cookie or header")
            return None
        print("Using token from cookie")
    
    try:
        # Verify the token
        print(f"Verifying token: {id_token[:10]}...")
        decoded_token = auth.verify_id_token(id_token)
        print("Token verified successfully")
        
        # Get the user and check email verification
        user = auth.get_user(decoded_token['uid'])
        if not user.email_verified:
            print("User email not verified")
            return None
            
        print("Token verification complete")
        return decoded_token
    except Exception as e:
        print(f"Token verification error: {str(e)}")
        return None

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        print(f"Checking auth for path: {request.path}")
        # Skip authentication for login-related pages and static assets
        if request.path in ['/login', '/register', '/forgot-password'] or \
           request.path.startswith('/static/'):
            print("Skipping auth for public path")
            return f(*args, **kwargs)

        # Check for auth token in cookie
        auth_token = request.cookies.get('authToken')
        if not auth_token:
            print("No auth token in cookie")
            return redirect(url_for('login'))

        try:
            # Verify the token
            print("Verifying auth token...")
            decoded_token = auth.verify_id_token(auth_token)
            print("Token verified")
            
            # Get the user and check email verification
            user = auth.get_user(decoded_token['uid'])
            if not user.email_verified:
                print("User email not verified")
                return redirect(url_for('login'))
                
            # Add user info to request
            request.user = decoded_token
            print("Auth successful")
            return f(*args, **kwargs)
        except Exception as e:
            print(f"Auth error in decorator: {str(e)}")
            return redirect(url_for('login'))
    return decorated_function

# Serve static files
@app.route('/')
@login_required
def index():
    print("Serving index.html")
    return send_from_directory('static', 'index.html')

@app.route('/login')
def login():
    print("Serving login.html")
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
        response = make_response(jsonify({
            'authenticated': True,
            'user': {
                'uid': user_data['uid'],
                'email': user_data.get('email', ''),
                'name': user_data.get('name', '')
            }
        }))
        # Set cookie on successful verification
        set_auth_cookie(response, request.cookies.get('authToken'))
        return response
    return jsonify({'authenticated': False}), 401

@app.route('/api/lessons', methods=['GET'])
@login_required
def get_lessons():
    print("Getting lessons")
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
    print("Code review request")
    data = request.json
    code = data.get('code', '')
    
    try:
        print("Sending code review request to OpenAI")
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful coding tutor. Review the following code and provide constructive feedback."},
                {"role": "user", "content": f"Please review this code:\n{code}"}
            ]
        )
        
        print("Received response from OpenAI")
        feedback = response.choices[0].message.content
        return jsonify({"feedback": feedback})
    except Exception as e:
        print(f"Error in code review: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
