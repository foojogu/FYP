// Helper function for showing error messages
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-4';
    errorDiv.role = 'alert';
    errorDiv.textContent = message;
    
    const form = document.querySelector('form');
    form.parentNode.insertBefore(errorDiv, form.nextSibling);
    
    setTimeout(() => errorDiv.remove(), 5000);
}

// Helper function for showing success messages
function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mt-4';
    successDiv.role = 'alert';
    successDiv.textContent = message;
    
    const form = document.querySelector('form');
    form.parentNode.insertBefore(successDiv, form.nextSibling);
    
    setTimeout(() => successDiv.remove(), 5000);
}

// Login form handler
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });
            
            const data = await response.json();
            
            if (response.ok) {
                showSuccess('Login successful!');
                setTimeout(() => window.location.href = '/', 1000);
            } else {
                showError(data.error);
            }
        } catch (error) {
            showError('An error occurred. Please try again.');
        }
    });
}

// Registration form handler
const registerForm = document.getElementById('register-form');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        if (password !== confirmPassword) {
            showError('Passwords do not match');
            return;
        }
        
        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email, password }),
            });
            
            const data = await response.json();
            
            if (response.ok) {
                showSuccess('Registration successful! Please check your email for verification.');
                setTimeout(() => window.location.href = '/login.html', 2000);
            } else {
                showError(data.error);
            }
        } catch (error) {
            showError('An error occurred. Please try again.');
        }
    });
}

// Forgot password form handler
const forgotPasswordForm = document.getElementById('forgot-password-form');
if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        
        try {
            const response = await fetch('/api/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });
            
            const data = await response.json();
            
            if (response.ok) {
                showSuccess('If your email is registered, you will receive password reset instructions.');
                setTimeout(() => window.location.href = '/login.html', 2000);
            } else {
                showError(data.error);
            }
        } catch (error) {
            showError('An error occurred. Please try again.');
        }
    });
}

// Reset password form handler
const resetPasswordForm = document.getElementById('reset-password-form');
if (resetPasswordForm) {
    resetPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        if (password !== confirmPassword) {
            showError('Passwords do not match');
            return;
        }
        
        // Get token from URL
        const token = window.location.pathname.split('/').pop();
        
        try {
            const response = await fetch(`/api/reset-password/${token}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ password }),
            });
            
            const data = await response.json();
            
            if (response.ok) {
                showSuccess('Password reset successful!');
                setTimeout(() => window.location.href = '/login.html', 2000);
            } else {
                showError(data.error);
            }
        } catch (error) {
            showError('An error occurred. Please try again.');
        }
    });
}
