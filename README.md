# AI Code Learning Platform

An interactive platform for learning to code with AI-powered feedback and guidance.

## Features

- Interactive code editor with syntax highlighting
- AI-powered code review and feedback
- Structured learning paths and lessons
- Modern, responsive UI

## System Design

### Use Case Diagram

```mermaid
graph TD
    subgraph User Actions
        A[Student] --> B[Register Account]
        A --> C[Login]
        A --> D[View Lessons]
        A --> E[Write Code]
        A --> F[Request Code Review]
        A --> G[View Feedback]
        A --> H[Track Progress]
        A --> I[Logout]
    end

    subgraph System Actions
        B --> J[Verify Email]
        E --> K[Save Code]
        F --> L[Generate AI Feedback]
        H --> M[Update Progress]
    end

    subgraph Admin Actions
        N[Admin] --> O[Manage Lessons]
        N --> P[Monitor Usage]
        N --> Q[Manage Users]
    end
```

### Class Diagram

```mermaid
classDiagram
    class User {
        +String uid
        +String email
        +String displayName
        +Boolean emailVerified
        +register()
        +login()
        +logout()
        +requestPasswordReset()
    }

    class Lesson {
        +String id
        +String title
        +String description
        +String difficulty
        +String content
        +getLessonContent()
        +updateProgress()
    }

    class CodeReview {
        +String userId
        +String code
        +String feedback
        +DateTime timestamp
        +requestReview()
        +saveFeedback()
    }

    class Progress {
        +String userId
        +String lessonId
        +String status
        +Number score
        +updateProgress()
        +getProgress()
    }

    class Authentication {
        +verifyToken()
        +generateToken()
        +validateSession()
    }

    User "1" -- "*" Progress
    User "1" -- "*" CodeReview
    Lesson "1" -- "*" Progress
    Authentication -- User
```

## Setup

1. Create a virtual environment and activate it:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create a `.env` file in the root directory and add your OpenAI API key:
```
OPENAI_API_KEY=your_api_key_here
```

4. Run the application:
```bash
python app.py
```

5. Open your browser and navigate to `http://localhost:5000`

## Technology Stack

- Backend: Flask (Python)
- Frontend: HTML, CSS (Tailwind CSS), JavaScript
- Code Editor: CodeMirror
- AI Integration: OpenAI GPT-3.5
- Authentication: Firebase
- Database: Firestore

## Security Features

- Email verification required for new accounts
- Secure session management with cookies
- Protected API endpoints with JWT authentication
- Input validation and sanitization
- CSRF protection

## Project Structure

```
.
├── app.py              # Main Flask application
├── requirements.txt    # Python dependencies
├── .env               # Environment variables
├── static/
│   ├── auth.js        # Authentication logic
│   ├── script.js      # Main application logic
│   ├── style.css      # Custom styles
│   ├── index.html     # Main application page
│   ├── login.html     # Login page
│   └── register.html  # Registration page
└── README.md          # Project documentation
