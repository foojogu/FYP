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

// Load lessons
async function loadLessons() {
    try {
        const response = await fetch('http://localhost:5000/api/lessons');
        const lessons = await response.json();
        const lessonsList = document.getElementById('lessons-list');
        
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
document.getElementById('review-button').addEventListener('click', async () => {
    const code = editor.getValue();
    const feedbackDiv = document.getElementById('feedback');
    
    try {
        const response = await fetch('http://localhost:5000/api/ai/code-review', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ code })
        });
        
        const data = await response.json();
        feedbackDiv.textContent = data.feedback;
        feedbackDiv.classList.remove('hidden');
    } catch (error) {
        console.error('Error getting code review:', error);
        feedbackDiv.textContent = 'Error getting AI feedback. Please try again.';
        feedbackDiv.classList.remove('hidden');
    }
});

// Load lessons when the page loads
loadLessons();
