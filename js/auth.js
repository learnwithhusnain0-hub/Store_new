// Auth state observer
auth.onAuthStateChanged((user) => {
    if (user) {
        // User is signed in
        showUserInfo(user);
        checkAdminStatus(user);
    } else {
        // User is signed out
        showLoginButtons();
    }
});

// Google Login
async function googleLogin() {
    try {
        const result = await auth.signInWithPopup(googleProvider);
        const user = result.user;
        
        // Save user to database
        await saveUserToDatabase(user);
        
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed: ' + error.message);
    }
}

// Save user to Firestore
async function saveUserToDatabase(user) {
    const userRef = db.collection('users').doc(user.uid);
    const doc = await userRef.get();
    
    if (!doc.exists) {
        await userRef.set({
            name: user.displayName || 'User',
            email: user.email,
            photoURL: user.photoURL || '',
            role: 'user',
            createdAt: new Date().toISOString()
        });
    }
}

// Check if user is admin
async function checkAdminStatus(user) {
    const userDoc = await db.collection('users').doc(user.uid).get();
    if (userDoc.exists && userDoc.data().role === 'admin') {
        // Show admin link
        showAdminLink();
    }
}

// Logout
async function logout() {
    try {
        await auth.signOut();
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// UI Functions
function showUserInfo(user) {
    const userInfo = document.getElementById('userInfo');
    const authButtons = document.getElementById('authButtons');
    
    if (userInfo) {
        userInfo.innerHTML = `
            <img src="${user.photoURL || 'https://via.placeholder.com/40'}" class="user-avatar">
            <span>${user.displayName || user.email}</span>
        `;
    }
    
    if (authButtons) {
        authButtons.innerHTML = `
            <button class="btn-logout" onclick="logout()">
                <i class="fas fa-sign-out-alt"></i> Logout
            </button>
        `;
    }
}

function showLoginButtons() {
    const userInfo = document.getElementById('userInfo');
    const authButtons = document.getElementById('authButtons');
    
    if (userInfo) userInfo.innerHTML = '';
    if (authButtons) {
        authButtons.innerHTML = `
            <button class="btn-google" onclick="googleLogin()">
                <i class="fab fa-google"></i> Sign in with Google
            </button>
        `;
    }
}

function showAdminLink() {
    // Add admin link to navbar
    const navLinks = document.querySelector('.nav-links');
    if (navLinks && !document.getElementById('adminLink')) {
        navLinks.innerHTML += `
            <a href="admin-dashboard.html" id="adminLink" class="admin-link">
                <i class="fas fa-crown"></i> Admin
            </a>
        `;
    }
}
