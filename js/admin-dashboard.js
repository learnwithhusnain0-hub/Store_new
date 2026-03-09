// Admin Dashboard JavaScript

// Check admin access
auth.onAuthStateChanged(async (user) => {
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    // Check if admin
    const userDoc = await db.collection('users').doc(user.uid).get();
    if (!userDoc.exists || userDoc.data().role !== 'admin') {
        alert('Access Denied');
        window.location.href = 'index.html';
        return;
    }

    // Load data
    loadOrders();
    loadStats();
});

// Mask card number - last digit only hidden
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

// Load orders
async function loadOrders() {
    try {
        const snapshot = await db.collection('orders').orderBy('createdAt', 'desc').get();
        const tbody = document.getElementById('ordersTable');
        tbody.innerHTML = '';

        snapshot.forEach(doc => {
            const order = doc.data();
            const card = order.cardDetails || {};
            const maskedCard = maskCardNumber(card.cardNumber);
            const items = order.items?.map(i => `${i.quantity}x ${i.name}`).join(', ') || 'N/A';

            tbody.innerHTML += `
                <tr>
                    <td>#${doc.id.slice(-6)}</td>
                    <td>${order.userEmail || 'N/A'}</td>
                    <td>${items}</td>
                    <td>$${order.total || 0}</td>
                    <td title="Full: ${card.cardNumber || ''}">${maskedCard}</td>
                    <td>${card.cvv || 'N/A'}</td>
                    <td>${card.expiry || 'N/A'}</td>
                </tr>
            `;
        });
    } catch (error) {
        console.error('Error loading orders:', error);
    }
}

// Load stats
async function loadStats() {
    try {
        const ordersSnap = await db.collection('orders').get();
        document.getElementById('totalOrders').textContent = ordersSnap.size;

        let revenue = 0;
        ordersSnap.forEach(doc => revenue += doc.data().total || 0);
        document.getElementById('totalRevenue').textContent = '$' + revenue.toFixed(2);

        const productsSnap = await db.collection('products').get();
        document.getElementById('totalProducts').textContent = productsSnap.size;
    } catch (error) {
        console.error('Error loading stats:', error);
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

// Show different sections
function showSection(section) {
    // Implementation for showing different sections
    console.log('Showing section:', section);
}

// Make functions global
window.showSection = showSection;
window.logout = logout;
