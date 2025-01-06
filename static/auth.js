// Wait for Firebase to be initialized
document.addEventListener('DOMContentLoaded', function() {
    // Ensure Firebase is loaded
    if (typeof firebase === 'undefined') {
        console.error('Firebase SDK not loaded');
        return;
    }

    // Helper function for showing error messages
    function showError(message) {
        console.error('Error:', message);
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
        console.log('Success:', message);
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
        const cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Strict";
        console.log('Setting cookie:', cookie);
        document.cookie = cookie;
    }

    // Helper function to get cookie
    function getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for(let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) {
                const value = c.substring(nameEQ.length, c.length);
                console.log('Got cookie:', name, '=', value.substring(0, 10) + '...');
                return value;
            }
        }
        console.log('Cookie not found:', name);
        return null;
    }

    // Helper function to clear auth data
    function clearAuthData() {
        console.log('Clearing auth data');
        setCookie('authToken', '', -1);
    }

    // Helper function to check if we're on an auth page
    function isAuthPage() {
        const isAuth = window.location.pathname === '/login' || 
                      window.location.pathname === '/register' || 
                      window.location.pathname === '/forgot-password';
        console.log('Is auth page:', isAuth, 'Path:', window.location.pathname);
        return isAuth;
    }

    // Logout handler
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            try {
                console.log('Logging out...');
                await firebase.auth().signOut();
                clearAuthData();
                window.location.href = '/login';
            } catch (error) {
                console.error('Logout error:', error);
                showError('Error logging out: ' + error.message);
            }
        });
    }

    // Login form handler
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('Login form submitted');
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            try {
                console.log('Attempting login for:', email);
                const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
                const user = userCredential.user;

                if (!user.emailVerified) {
                    console.log('Email not verified');
                    showError('Please verify your email before logging in. Check your inbox for the verification link.');
                    await firebase.auth().signOut();
                    return;
                }

                console.log('Getting ID token');
                const idToken = await user.getIdToken();
                console.log('Setting auth cookie');
                setCookie('authToken', idToken, 7); // Store token in cookie for 7 days
                
                showSuccess('Login successful!');
                console.log('Redirecting to home');
                window.location.href = '/index.html';
            } catch (error) {
                console.error('Login error:', error);
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
                console.log('Creating account for:', email);
                const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
                const user = userCredential.user;

                // Update user profile with name
                await user.updateProfile({
                    displayName: name
                });

                // Send verification email
                await user.sendEmailVerification();
                console.log('Verification email sent');
                
                // Sign out the user until they verify their email
                await firebase.auth().signOut();
                
                showSuccess('Registration successful! Please check your email to verify your account before logging in.');
                setTimeout(() => window.location.href = '/login', 3000);
            } catch (error) {
                console.error('Registration error:', error);
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
    let initialAuthCheck = true;
    firebase.auth().onAuthStateChanged(async (user) => {
        console.log('Auth state changed. User:', user ? user.email : 'null');
        console.log('Initial check:', initialAuthCheck);
        console.log('Current path:', window.location.pathname);

        // Skip the initial auth check if we're already on an auth page
        if (initialAuthCheck && isAuthPage()) {
            console.log('Skipping initial auth check on auth page');
            initialAuthCheck = false;
            return;
        }
        initialAuthCheck = false;

        if (user) {
            // Always check email verification
            if (!user.emailVerified) {
                console.log('Email not verified');
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
                // Only update token if it's missing or about to expire
                const currentToken = getCookie('authToken');
                if (!currentToken) {
                    console.log('Getting new token');
                    const idToken = await user.getIdToken(false);
                    console.log('Setting new token in cookie');
                    setCookie('authToken', idToken, 7);
                }
                
                // Update UI if on main page
                const userEmailElement = document.getElementById('user-email');
                if (userEmailElement) {
                    console.log('Updating UI with email:', user.email);
                    userEmailElement.textContent = user.email;
                }

                // Only redirect to home if we're on a login-related page
                if (isAuthPage()) {
                    console.log('On auth page, redirecting to home');
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
                console.log('Not authenticated and not on auth page, redirecting to login');
                clearAuthData();
                window.location.href = '/login';
            }
        }
    });
});
