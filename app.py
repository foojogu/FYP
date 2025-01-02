from flask import Flask, request, jsonify
from flask_cors import CORS
import openai
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# Initialize OpenAI client
openai.api_key = os.getenv('OPENAI_API_KEY')

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
