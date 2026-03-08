// ============================================
// AUTHENTICATION MODULE
// ============================================

// Current user state
let currentUser = null;

// Initialize auth listener
auth.onAuthStateChanged((user) => {
    currentUser = user;
    if (user) {
        document.getElementById('userNameDisplay').textContent = user.displayName?.split(' ')[0] || 'User';
        updateUserDropdown(user);
        checkAdminStatus(user);
    } else {
        document.getElementById('userNameDisplay').textContent = 'Account';
        updateUserDropdown(null);
    }
});

// Update dropdown based on auth state
function updateUserDropdown(user) {
    const dropdown = document.getElementById('userDropdown');
    if (!dropdown) return;
    
    if (user) {
        dropdown.innerHTML = `
            <div class="user-info-dropdown">
                <img src="${user.photoURL || 'https://ui-avatars.com/api/?name=' + user.displayName}" alt="User">
                <div>
                    <h4>${user.displayName || 'User'}</h4>
                    <p>${user.email}</p>
                </div>
            </div>
            <div class="dropdown-menu-items">
                <a href="#profile"><i class="fas fa-user"></i> My Profile</a>
                <a href="#orders"><i class="fas fa-shopping-bag"></i> My Orders</a>
                <div class="dropdown-divider"></div>
                <a href="admin-dashboard.html" id="adminDropdownLink" style="display: none;"><i class="fas fa-crown"></i> Admin Panel</a>
                <button onclick="logout()"><i class="fas fa-sign-out-alt"></i> Logout</button>
            </div>
        `;
    } else {
        dropdown.innerHTML = `
            <div class="dropdown-menu-items">
                <button onclick="googleLogin()"><i class="fab fa-google"></i> Login with Google</button>
            </div>
        `;
    }
}

// Google Login
async function googleLogin() {
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        const result = await auth.signInWithPopup(provider);
        await saveUserToDatabase(result.user);
        showToast('Login successful!');
        closeUserMenu();
    } catch (error) {
        showToast('Login failed: ' + error.message);
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
    } else {
        await userRef.update({
            lastLogin: new Date().toISOString()
        });
    }
}

// Check admin status
async function checkAdminStatus(user) {
    try {
        const doc = await db.collection('users').doc(user.uid).get();
        if (doc.exists && doc.data().role === 'admin') {
            const adminLink = document.getElementById('adminDropdownLink');
            if (adminLink) adminLink.style.display = 'flex';
        }
    } catch (error) {
        console.error('Error checking admin status:', error);
    }
}

// Logout
async function logout() {
    try {
        await auth.signOut();
        window.cart.clearCart();
        showToast('Logged out');
        closeUserMenu();
    } catch (error) {
        showToast('Logout failed: ' + error.message);
    }
}

// Toggle user menu
function toggleUserMenu() {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) dropdown.classList.toggle('show');
}

// Close user menu
function closeUserMenu() {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) dropdown.classList.remove('show');
}

// Close dropdown when clicking outside
window.addEventListener('click', (e) => {
    if (!e.target.closest('.user-menu')) {
        closeUserMenu();
    }
});

// Make functions global
window.googleLogin = googleLogin;
window.logout = logout;
window.toggleUserMenu = toggleUserMenu;
