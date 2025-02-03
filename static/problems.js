let editor;
let currentProblem = null;

// Initialize CodeMirror editor
function initializeCodeEditor() {
    editor = CodeMirror.fromTextArea(document.getElementById('code-editor'), {
        mode: 'python',
        theme: 'monokai',
        lineNumbers: true,
        autoCloseBrackets: true,
        indentUnit: 4,
        tabSize: 4,
        indentWithTabs: false,
        lineWrapping: true
    });
}

// Fetch and display all problems
async function loadProblems() {
    try {
        const response = await fetch('/api/problems');
        const problems = await response.json();
        const problemsList = document.getElementById('problems-list');
        const userProgress = await fetch('/api/progress').then(res => res.json());

        // Create a map of problem status
        const progressMap = new Map(userProgress.map(p => [p.problem_id, p.status]));

        problemsList.innerHTML = problems.map(problem => {
            const status = progressMap.get(problem.id) || 'Not Started';
            const statusColor = {
                'Not Started': 'gray',
                'Attempted': 'yellow',
                'Solved': 'green'
            }[status];

            return `
                <tr class="hover:bg-gray-50 cursor-pointer" onclick="loadProblem(${problem.id})">
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-${statusColor}-100 text-${statusColor}-800">
                            ${status}
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">${problem.title}</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${problem.difficulty === 'Easy' ? 'bg-green-100 text-green-800' : 
                              problem.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-red-100 text-red-800'}">
                            ${problem.difficulty}
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">${problem.category}</td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading problems:', error);
    }
}

// Load and display a specific problem
async function loadProblem(problemId) {
    try {
        const response = await fetch(`/api/problems/${problemId}`);
        currentProblem = await response.json();

        // Switch to problem detail view
        document.getElementById('problems-list-view').classList.add('hidden');
        document.getElementById('problem-detail-view').classList.remove('hidden');

        // Update problem details
        document.getElementById('problem-title').textContent = currentProblem.title;
        const difficultySpan = document.getElementById('problem-difficulty');
        difficultySpan.textContent = currentProblem.difficulty;
        difficultySpan.className = `px-2 py-1 rounded text-sm font-semibold ${
            currentProblem.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
            currentProblem.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
        }`;

        // Render problem description with markdown
        document.getElementById('problem-description').innerHTML = marked(currentProblem.description);

        // Display test cases
        const testCasesDiv = document.getElementById('test-cases');
        testCasesDiv.innerHTML = currentProblem.test_cases.map((tc, index) => `
            <div class="bg-gray-50 p-4 rounded">
                <div class="font-mono">
                    <strong>Input:</strong> ${tc.input}<br>
                    <strong>Expected Output:</strong> ${tc.expected_output}
                </div>
            </div>
        `).join('');

        // Set initial code in editor
        editor.setValue(currentProblem.initial_code);
    } catch (error) {
        console.error('Error loading problem:', error);
    }
}

// Submit solution
async function submitSolution() {
    try {
        const code = editor.getValue();
        const response = await fetch(`/api/submit/${currentProblem.id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                code: code,
                language: 'python'
            })
        });

        const result = await response.json();
        
        // Show results panel
        const resultsPanel = document.getElementById('results-panel');
        const testResults = document.getElementById('test-results');
        resultsPanel.classList.remove('hidden');
        
        testResults.innerHTML = `
            <div class="p-4 rounded ${result.status === 'Accepted' ? 'bg-green-100' : 'bg-red-100'}">
                <div class="font-bold ${result.status === 'Accepted' ? 'text-green-800' : 'text-red-800'}">
                    ${result.status}
                </div>
                <div class="text-sm mt-2">
                    Runtime: ${result.runtime}ms<br>
                    Memory: ${result.memory_used}MB
                </div>
            </div>
        `;

        // Refresh problems list to update status
        loadProblems();
    } catch (error) {
        console.error('Error submitting solution:', error);
    }
}

// Get AI help
async function getAIHelp() {
    try {
        const code = editor.getValue();
        const response = await fetch('/api/code_review', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                code: code,
                context: `Problem: ${currentProblem.title}\n${currentProblem.description}`
            })
        });

        const result = await response.json();
        
        // Show AI feedback panel
        const aiFeedbackPanel = document.getElementById('ai-feedback-panel');
        const aiFeedback = document.getElementById('ai-feedback');
        aiFeedbackPanel.classList.remove('hidden');
        aiFeedback.innerHTML = marked(result.feedback);
    } catch (error) {
        console.error('Error getting AI help:', error);
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    initializeCodeEditor();
    loadProblems();

    // Button event listeners
    document.getElementById('submit-btn').addEventListener('click', submitSolution);
    document.getElementById('ai-help-btn').addEventListener('click', getAIHelp);
    document.getElementById('run-tests-btn').addEventListener('click', () => {
        // For now, this just calls submit
        submitSolution();
    });
});
