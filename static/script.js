// Initialize CodeMirror
const editor = CodeMirror.fromTextArea(document.getElementById('code-editor'), {
    mode: 'python',
    theme: 'monokai',
    lineNumbers: true,
    autoCloseBrackets: true,
    indentUnit: 4,
    tabSize: 4,
    lineWrapping: true
});

// Helper function to get the authentication token
async function getAuthToken() {
    const user = firebase.auth().currentUser;
    if (!user) {
        window.location.href = '/login';
        return null;
    }
    return await user.getIdToken(); // Get the current token without forcing refresh
}

// Load lessons
async function loadLessons() {
    try {
        const token = await getAuthToken();
        if (!token) return;

        const response = await fetch('/api/lessons', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                window.location.href = '/login';
                return;
            }
            throw new Error('Failed to load lessons');
        }

        const lessons = await response.json();
        const lessonsList = document.getElementById('lessons-list');
        lessonsList.innerHTML = ''; // Clear existing lessons
        
        lessons.forEach(lesson => {
            const lessonCard = document.createElement('div');
            lessonCard.className = 'lesson-card bg-gray-50 p-4 rounded shadow-sm hover:shadow-md cursor-pointer';
            lessonCard.innerHTML = `
                <h3 class="font-bold text-lg">${lesson.title}</h3>
                <p class="text-gray-600">${lesson.description}</p>
                <span class="inline-block mt-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    ${lesson.difficulty}
                </span>
            `;
            lessonsList.appendChild(lessonCard);
        });
    } catch (error) {
        console.error('Error loading lessons:', error);
    }
}

// Handle AI code review
const reviewButton = document.getElementById('review-button');
if (reviewButton) {
    reviewButton.addEventListener('click', async () => {
        const code = editor.getValue();
        const feedbackDiv = document.getElementById('feedback');
        
        try {
            const token = await getAuthToken();
            if (!token) return;

            const response = await fetch('/api/ai/code-review', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ code })
            });
            
            if (!response.ok) {
                if (response.status === 401) {
                    window.location.href = '/login';
                    return;
                }
                throw new Error('Failed to get code review');
            }

            const data = await response.json();
            feedbackDiv.textContent = data.feedback;
            feedbackDiv.classList.remove('hidden');
        } catch (error) {
            console.error('Error getting code review:', error);
            feedbackDiv.textContent = 'Error getting code review. Please try again.';
            feedbackDiv.classList.remove('hidden');
        }
    });
}

// Load lessons when the page loads
document.addEventListener('DOMContentLoaded', () => {
    firebase.auth().onAuthStateChanged((user) => {
        if (user && user.emailVerified) {
            loadLessons();
        }
    });
});
