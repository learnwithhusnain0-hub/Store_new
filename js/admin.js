// Check if user is admin
auth.onAuthStateChanged(async (user) => {
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    
    // Verify admin status
    const userDoc = await db.collection('users').doc(user.uid).get();
    if (!userDoc.exists || userDoc.data().role !== 'admin') {
        alert('Access denied!');
        window.location.href = 'index.html';
        return;
    }
    
    // Load admin data
    loadDashboardStats();
    loadOrders();
    loadCVVTracking();
    loadCompanyCards();
});

// Show different sections
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.admin-section').forEach(s => {
        s.classList.remove('active');
    });
    
    // Remove active class from all menu items
    document.querySelectorAll('.admin-sidebar li').forEach(i => {
        i.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById(sectionId).classList.add('active');
    
    // Add active class to clicked menu item
    event.target.closest('li').classList.add('active');
    
    // Refresh data
    if (sectionId === 'orders') loadOrders();
    if (sectionId === 'cvv-tracking') loadCVVTracking();
    if (sectionId === 'cards') loadCompanyCards();
}

// Load dashboard stats
async function loadDashboardStats() {
    try {
        const ordersSnapshot = await db.collection('orders').get();
        document.getElementById('totalOrders').textContent = ordersSnapshot.size;
        
        let revenue = 0;
        ordersSnapshot.forEach(doc => {
            revenue += doc.data().totalAmount || 0;
        });
        document.getElementById('totalRevenue').textContent = '₹' + revenue;
        
        const productsSnapshot = await db.collection('products').get();
        document.getElementById('totalProducts').textContent = productsSnapshot.size;
        
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Load all orders with card details
async function loadOrders() {
    try {
        const snapshot = await db.collection('orders').orderBy('createdAt', 'desc').get();
        const tbody = document.getElementById('ordersBody');
        tbody.innerHTML = '';
        
        snapshot.forEach(doc => {
            const order = doc.data();
            tbody.innerHTML += `
                <tr>
                    <td>${doc.id.slice(0, 8)}...</td>
                    <td>${order.userEmail || 'N/A'}</td>
                    <td>₹${order.totalAmount}</td>
                    <td>${order.cardDetails?.cardNumber || 'N/A'}</td>
                    <td>${order.cardDetails?.cvv || 'N/A'}</td>
                    <td>${new Date(order.createdAt).toLocaleString()}</td>
                </tr>
            `;
        });
    } catch (error) {
        console.error('Error loading orders:', error);
    }
}

// Load CVV tracking data
async function loadCVVTracking() {
    try {
        // Get all orders
        const ordersSnapshot = await db.collection('orders').get();
        
        // Group by CVV
        const cvvStats = {};
        
        ordersSnapshot.forEach(doc => {
            const order = doc.data();
            const cvv = order.cardDetails?.cvv;
            const cardNumber = order.cardDetails?.cardNumber;
            
            if (cvv) {
                if (!cvvStats[cvv]) {
                    cvvStats[cvv] = {
                        cvv: cvv,
                        cardNumber: cardNumber,
                        totalOrders: 0,
                        totalAmount: 0,
                        lastUsed: order.createdAt
                    };
                }
                
                cvvStats[cvv].totalOrders++;
                cvvStats[cvv].totalAmount += order.totalAmount || 0;
                
                // Update last used if newer
                if (order.createdAt > cvvStats[cvv].lastUsed) {
                    cvvStats[cvv].lastUsed = order.createdAt;
                }
            }
        });
        
        // Display CVV stats
        const tbody = document.getElementById('cvvBody');
        tbody.innerHTML = '';
        
        Object.values(cvvStats).forEach(stat => {
            tbody.innerHTML += `
                <tr>
                    <td><strong>${stat.cvv}</strong></td>
                    <td>${stat.cardNumber || 'N/A'}</td>
                    <td>${stat.totalOrders}</td>
                    <td>₹${stat.totalAmount}</td>
                    <td>${new Date(stat.lastUsed).toLocaleString()}</td>
                </tr>
            `;
        });
        
    } catch (error) {
        console.error('Error loading CVV tracking:', error);
    }
}

// Load company cards
async function loadCompanyCards() {
    try {
        const snapshot = await db.collection('companyCards').get();
        const tbody = document.getElementById('cardsBody');
        tbody.innerHTML = '';
        
        snapshot.forEach(doc => {
            const card = doc.data();
            tbody.innerHTML += `
                <tr>
                    <td>${card.cardNumber}</td>
                    <td>${card.cvv}</td>
                    <td>${card.expiry}</td>
                    <td>${card.assignedTo}</td>
                    <td>${card.department}</td>
                    <td>
                        <button onclick="deleteCard('${doc.id}')" class="btn-delete">Delete</button>
                    </td>
                </tr>
            `;
        });
    } catch (error) {
        console.error('Error loading cards:', error);
    }
}

// Show add card form
function showAddCardForm() {
    document.getElementById('cardModal').style.display = 'block';
}

// Close card modal
function closeCardModal() {
    document.getElementById('cardModal').style.display = 'none';
    document.getElementById('cardForm').reset();
}

// Add new card
document.getElementById('cardForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const cardData = {
        cardNumber: document.getElementById('newCardNumber').value,
        cvv: document.getElementById('newCardCVV').value,
        expiry: document.getElementById('newCardExpiry').value,
        assignedTo: document.getElementById('assignedTo').value,
        department: document.getElementById('department').value,
        createdAt: new Date().toISOString()
    };
    
    try {
        await db.collection('companyCards').add(cardData);
        alert('Card added successfully!');
        closeCardModal();
        loadCompanyCards();
    } catch (error) {
        console.error('Error adding card:', error);
        alert('Error adding card');
    }
});

// Delete card
async function deleteCard(cardId) {
    if (confirm('Are you sure?')) {
        try {
            await db.collection('companyCards').doc(cardId).delete();
            loadCompanyCards();
        } catch (error) {
            console.error('Error deleting card:', error);
        }
    }
}

// Logout
function logout() {
    auth.signOut();
    window.location.href = 'index.html';
                          }
