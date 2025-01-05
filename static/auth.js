// Wait for Firebase to be initialized
document.addEventListener('DOMContentLoaded', function() {
    // Ensure Firebase is loaded
    if (typeof firebase === 'undefined') {
        console.error('Firebase SDK not loaded');
        return;
    }

    // Helper function for showing error messages
    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-4';
        errorDiv.role = 'alert';
        errorDiv.textContent = message;
        
        const form = document.querySelector('form');
        if (form) {
            form.parentNode.insertBefore(errorDiv, form.nextSibling);
        } else {
            document.body.appendChild(errorDiv);
        }
        
        setTimeout(() => errorDiv.remove(), 5000);
    }

    // Helper function for showing success messages
    function showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mt-4';
        successDiv.role = 'alert';
        successDiv.textContent = message;
        
        const form = document.querySelector('form');
        if (form) {
            form.parentNode.insertBefore(successDiv, form.nextSibling);
        } else {
            document.body.appendChild(successDiv);
        }
        
        setTimeout(() => successDiv.remove(), 5000);
    }

    // Helper function to set cookie
    function setCookie(name, value, days) {
        let expires = "";
        if (days) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + (value || "") + expires + "; path=/";
    }

    // Helper function to clear auth data
    function clearAuthData() {
        setCookie('authToken', '', -1);
    }

    // Helper function to check if we're on an auth page
    function isAuthPage() {
        return window.location.pathname === '/login' || 
               window.location.pathname === '/register' || 
               window.location.pathname === '/forgot-password';
    }

    // Logout handler
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            try {
                await firebase.auth().signOut();
                clearAuthData();
                window.location.href = '/login';
            } catch (error) {
                showError('Error logging out: ' + error.message);
            }
        });
    }

    // Login form handler
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            try {
                const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
                const user = userCredential.user;

                if (!user.emailVerified) {
                    showError('Please verify your email before logging in. Check your inbox for the verification link.');
                    await firebase.auth().signOut();
                    return;
                }

                const idToken = await user.getIdToken();
                setCookie('authToken', idToken, 7); // Store token in cookie for 7 days
                
                showSuccess('Login successful!');
                setTimeout(() => window.location.href = '/', 1000);
            } catch (error) {
                showError(error.message);
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
                const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
                const user = userCredential.user;

                // Update user profile with name
                await user.updateProfile({
                    displayName: name
                });

                // Send verification email
                await user.sendEmailVerification();
                
                // Sign out the user until they verify their email
                await firebase.auth().signOut();
                
                showSuccess('Registration successful! Please check your email to verify your account before logging in.');
                setTimeout(() => window.location.href = '/login', 3000);
            } catch (error) {
                showError(error.message);
            }
        });
    }

    // Resend verification email
    const resendVerificationBtn = document.getElementById('resend-verification');
    if (resendVerificationBtn) {
        resendVerificationBtn.addEventListener('click', async () => {
            const user = firebase.auth().currentUser;
            if (user && !user.emailVerified) {
                try {
                    await user.sendEmailVerification();
                    showSuccess('Verification email sent! Please check your inbox.');
                } catch (error) {
                    showError(error.message);
                }
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
                await firebase.auth().sendPasswordResetEmail(email);
                showSuccess('Password reset email sent. Please check your inbox.');
                setTimeout(() => window.location.href = '/login', 2000);
            } catch (error) {
                showError(error.message);
            }
        });
    }

    // Check authentication state
    firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
            // Always check email verification
            if (!user.emailVerified) {
                if (!isAuthPage()) {
                    showError('Please verify your email before continuing.');
                    await firebase.auth().signOut();
                    clearAuthData();
                    window.location.href = '/login';
                }
                return;
            }

            // Get fresh token and store in cookie
            try {
                const idToken = await user.getIdToken();
                setCookie('authToken', idToken, 7); // Store token in cookie for 7 days
                
                // Update UI if on main page
                const userEmailElement = document.getElementById('user-email');
                if (userEmailElement) {
                    userEmailElement.textContent = user.email;
                }

                // Only redirect to home if we're on a login-related page
                if (isAuthPage()) {
                    window.location.href = '/';
                }
            } catch (error) {
                console.error('Error getting token:', error);
                if (!isAuthPage()) {
                    clearAuthData();
                    window.location.href = '/login';
                }
            }
        } else {
            // Only clear auth and redirect if we're not on a login-related page
            if (!isAuthPage()) {
                clearAuthData();
                window.location.href = '/login';
            }
        }
    });
});
