// ============================================
// AUTHENTICATION - Google Login Popup
// ============================================

// Check auth state
auth.onAuthStateChanged((user) => {
    if (user) {
        // User logged in
        showUserInfo(user);
        checkAdminStatus(user);
        closeLoginModal();
    } else {
        // User logged out
        showLoginButton();
    }
});

// Google Login
async function googleLogin() {
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        const result = await auth.signInWithPopup(provider);
        const user = result.user;
        
        // Save user to database
        await saveUserToDatabase(user);
        
        showToast(`Welcome ${user.displayName}!`);
        
    } catch (error) {
        console.error('Login error:', error);
        showToast('Login failed: ' + error.message, 'error');
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
    
    await userRef.update({
        lastLogin: new Date().toISOString()
    });
}

// Continue as Guest
function continueAsGuest() {
    closeLoginModal();
    showToast('Continuing as guest');
}

// Check admin status
async function checkAdminStatus(user) {
    const userDoc = await db.collection('users').doc(user.uid).get();
    if (userDoc.exists && userDoc.data().role === 'admin') {
        document.getElementById('adminLink').style.display = 'block';
    }
}

// Logout
async function logout() {
    try {
        await auth.signOut();
        window.location.reload();
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// ===== UI Functions =====
function showUserInfo(user) {
    const userSection = document.getElementById('userSection');
    userSection.innerHTML = `
        <div class="user-info">
            <img src="${user.photoURL || 'https://ui-avatars.com/api/?name=' + user.displayName}" alt="User">
            <span>${user.displayName || user.email}</span>
            <button class="btn-logout" onclick="logout()">
                <i class="fas fa-sign-out-alt"></i>
            </button>
        </div>
    `;
}

function showLoginButton() {
    const userSection = document.getElementById('userSection');
    userSection.innerHTML = `
        <button class="btn-google-login" onclick="showLoginModal()">
            <i class="fab fa-google"></i>
            <span>Login</span>
        </button>
    `;
}

// ===== Modal Functions =====
function showLoginModal() {
    document.getElementById('loginModal').classList.add('active');
}

function closeLoginModal() {
    document.getElementById('loginModal').classList.remove('active');
}
