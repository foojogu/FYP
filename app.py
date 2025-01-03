from flask import Flask, request, jsonify, url_for
from flask_cors import CORS
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from flask_mail import Mail, Message
import openai
import os
from dotenv import load_dotenv
from models import db, User
from itsdangerous import URLSafeTimedSerializer
from datetime import datetime, timedelta
import secrets

load_dotenv()

app = Flask(__name__, static_folder='static')
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///app.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Email configuration
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')

CORS(app)
db.init_app(app)
mail = Mail(app)
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

# Initialize OpenAI client
openai.api_key = os.getenv('OPENAI_API_KEY')

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

def send_verification_email(user):
    serializer = URLSafeTimedSerializer(app.config['SECRET_KEY'])
    token = serializer.dumps(user.email, salt='email-verification')
    user.verification_token = token
    db.session.commit()
    
    verification_url = url_for('verify_email', token=token, _external=True)
    msg = Message('Verify Your Email',
                 sender=app.config['MAIL_USERNAME'],
                 recipients=[user.email])
    msg.body = f'Please click the following link to verify your email: {verification_url}'
    mail.send(msg)

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already registered'}), 400
    
    user = User(
        email=data['email'],
        name=data['name']
    )
    user.set_password(data['password'])
    db.session.add(user)
    db.session.commit()
    
    send_verification_email(user)
    return jsonify({'message': 'Registration successful. Please check your email for verification.'})

@app.route('/api/verify-email/<token>')
def verify_email(token):
    try:
        serializer = URLSafeTimedSerializer(app.config['SECRET_KEY'])
        email = serializer.loads(token, salt='email-verification', max_age=86400)
        user = User.query.filter_by(email=email).first()
        if user and user.verification_token == token:
            user.is_verified = True
            user.verification_token = None
            db.session.commit()
            return jsonify({'message': 'Email verified successfully'})
    except:
        return jsonify({'error': 'Invalid or expired verification link'}), 400

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter_by(email=data['email']).first()
    
    if user and user.check_password(data['password']):
        if not user.is_verified:
            return jsonify({'error': 'Please verify your email first'}), 401
        login_user(user)
        return jsonify({'message': 'Login successful'})
    
    return jsonify({'error': 'Invalid email or password'}), 401

@app.route('/api/forgot-password', methods=['POST'])
def forgot_password():
    data = request.json
    user = User.query.filter_by(email=data['email']).first()
    
    if user:
        token = secrets.token_urlsafe(32)
        user.reset_token = token
        user.reset_token_expiry = datetime.utcnow() + timedelta(hours=24)
        db.session.commit()
        
        reset_url = url_for('reset_password', token=token, _external=True)
        msg = Message('Reset Your Password',
                     sender=app.config['MAIL_USERNAME'],
                     recipients=[user.email])
        msg.body = f'Click the following link to reset your password: {reset_url}'
        mail.send(msg)
        
    return jsonify({'message': 'If your email is registered, you will receive password reset instructions'})

@app.route('/api/reset-password/<token>', methods=['POST'])
def reset_password(token):
    user = User.query.filter_by(reset_token=token).first()
    
    if not user or user.reset_token_expiry < datetime.utcnow():
        return jsonify({'error': 'Invalid or expired reset token'}), 400
    
    data = request.json
    user.set_password(data['password'])
    user.reset_token = None
    user.reset_token_expiry = None
    db.session.commit()
    
    return jsonify({'message': 'Password reset successful'})

@app.route('/api/lessons', methods=['GET'])
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
