// ============================================
// STORE FUNCTIONS - Cart, Products, Payment
// ============================================

// Global variables
let cart = [];
let products = [];
let currentUser = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    loadCartFromStorage();
    
    // Listen for auth changes
    auth.onAuthStateChanged((user) => {
        currentUser = user;
    });
});

// ===== PRODUCTS =====
const sampleProducts = [
    {
        name: 'Classic Burger',
        price: 8.99,
        category: 'burger',
        description: 'Beef patty with lettuce, tomato, and special sauce',
        image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
        stock: 15
    },
    {
        name: 'Double Cheeseburger',
        price: 12.99,
        category: 'burger',
        description: 'Double beef patty with double cheese',
        image: 'https://images.unsplash.com/photo-1553979459-d2229ba7431a?w=400',
        stock: 10
    },
    {
        name: 'Margherita Pizza',
        price: 14.99,
        category: 'pizza',
        description: 'Classic margherita with fresh basil',
        image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400',
        stock: 8
    },
    {
        name: 'French Fries',
        price: 3.99,
        category: 'fries',
        description: 'Crispy golden fries with sea salt',
        image: 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=400',
        stock: 50
    },
    {
        name: 'Coca Cola',
        price: 1.99,
        category: 'drinks',
        description: 'Ice cold 500ml',
        image: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400',
        stock: 100
    },
    {
        name: 'Chicken Wings',
        price: 9.99,
        category: 'fries',
        description: 'Spicy buffalo wings with dip',
        image: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=400',
        stock: 20
    }
];

async function loadProducts() {
    try {
        // Check if products exist in Firebase
        const snapshot = await db.collection('products').get();
        
        if (snapshot.empty) {
            // Add sample products
            for (let product of sampleProducts) {
                await db.collection('products').add({
                    ...product,
                    createdAt: new Date().toISOString()
                });
            }
            // Reload after adding
            loadProducts();
            return;
        }
        
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

function displayProducts(productsToShow) {
    const grid = document.getElementById('productsGrid');
    grid.innerHTML = '';
    
    productsToShow.forEach(product => {
        grid.innerHTML += `
            <div class="product-card">
                <div class="product-image">
                    <img src="${product.image}" alt="${product.name}">
                </div>
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <p class="product-desc">${product.description}</p>
                    <div class="product-price">$${product.price.toFixed(2)}</div>
                    <p class="product-stock"><i class="fas fa-check-circle"></i> In Stock</p>
                    <button class="btn-add-to-cart" onclick="addToCart('${product.id}')">
                        <i class="fas fa-cart-plus"></i> Add to Cart
                    </button>
                </div>
            </div>
        `;
    });
}

// Filter products
function filterProducts(category) {
    // Update active filter
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    if (category === 'all') {
        displayProducts(products);
    } else {
        const filtered = products.filter(p => p.category === category);
        displayProducts(filtered);
    }
}

// ===== CART FUNCTIONS =====
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            ...product,
            quantity: 1
        });
    }
    
    updateCartCount();
    saveCartToStorage();
    showToast('Item added to cart!');
}

function updateCartCount() {
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    document.getElementById('cartCount').textContent = count;
}

function displayCartItems() {
    const cartItems = document.getElementById('cartItems');
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<p style="text-align:center; padding:20px;">Your cart is empty</p>';
        document.getElementById('cartTotal').textContent = '$0.00';
        return;
    }
    
    let cartHtml = '';
    let total = 0;
    
    cart.forEach(item => {
        total += item.price * item.quantity;
        cartHtml += `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p class="cart-item-price">$${(item.price * item.quantity).toFixed(2)}</p>
                    <div class="cart-item-quantity">
                        <button class="quantity-btn" onclick="updateQuantity('${item.id}', -1)">-</button>
                        <span>${item.quantity}</span>
                        <button class="quantity-btn" onclick="updateQuantity('${item.id}', 1)">+</button>
                        <button class="remove-item" onclick="removeFromCart('${item.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    cartItems.innerHTML = cartHtml;
    document.getElementById('cartTotal').textContent = `$${total.toFixed(2)}`;
    document.getElementById('subtotal').textContent = `$${total.toFixed(2)}`;
    document.getElementById('checkoutTotal').textContent = `$${(total + 2.99).toFixed(2)}`;
}

function updateQuantity(productId, change) {
    const item = cart.find(i => i.id === productId);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(productId);
        } else {
            displayCartItems();
            updateCartCount();
            saveCartToStorage();
        }
    }
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    displayCartItems();
    updateCartCount();
    saveCartToStorage();
}

function saveCartToStorage() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function loadCartFromStorage() {
    const saved = localStorage.getItem('cart');
    if (saved) {
        cart = JSON.parse(saved);
        updateCartCount();
    }
}

// ===== CART UI =====
function toggleCart() {
    document.getElementById('cartSidebar').classList.toggle('active');
    document.getElementById('overlay').classList.toggle('active');
    displayCartItems();
}

// ===== CHECKOUT =====
function checkout() {
    if (cart.length === 0) {
        showToast('Your cart is empty!');
        return;
    }
    
    if (!currentUser) {
        toggleCart();
        showLoginModal();
        return;
    }
    
    toggleCart();
    document.getElementById('checkoutModal').classList.add('active');
    displayCartItems();
}

// Payment Form Submit
document.getElementById('paymentForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Show loading
    document.getElementById('paymentLoader').style.display = 'block';
    document.getElementById('payButton').disabled = true;
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
        // Get card details
        const cardDetails = {
            cardNumber: document.getElementById('cardNumber').value.replace(/\s/g, ''),
            expiry: document.getElementById('expiryDate').value,
            cvv: document.getElementById('cvv').value,
            holderName: document.getElementById('cardName').value
        };
        
        // Calculate total
        const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
        const total = subtotal + 2.99;
        
        // Create order
        const orderData = {
            userId: currentUser?.uid || 'guest',
            userEmail: currentUser?.email || 'guest@example.com',
            items: cart.map(item => ({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity
            })),
            subtotal: subtotal,
            delivery: 2.99,
            total: total,
            cardDetails: cardDetails,
            status: 'completed',
            createdAt: new Date().toISOString()
        };
        
        // Save to Firebase
        await db.collection('orders').add(orderData);
        
        // Hide loader
        document.getElementById('paymentLoader').style.display = 'none';
        document.getElementById('payButton').disabled = false;
        
        // Close checkout modal
        document.getElementById('checkoutModal').classList.remove('active');
        
        // Show success modal
        showOrderConfirmation(orderData);
        
        // Clear cart
        cart = [];
        updateCartCount();
        saveCartToStorage();
        document.getElementById('paymentForm').reset();
        
    } catch (error) {
        console.error('Payment error:', error);
        document.getElementById('paymentLoader').style.display = 'none';
        document.getElementById('payButton').disabled = false;
        showToast('Payment failed: ' + error.message, 'error');
    }
});

// Show order confirmation
function showOrderConfirmation(order) {
    const modal = document.getElementById('successModal');
    const details = document.getElementById('orderDetails');
    
    const items = order.items.map(item => 
        `${item.quantity}x ${item.name} - $${(item.price * item.quantity).toFixed(2)}`
    ).join('<br>');
    
    details.innerHTML = `
        <p><strong>Order Total:</strong> $${order.total.toFixed(2)}</p>
        <p><small>${items}</small></p>
    `;
    
    modal.classList.add('active');
}

// Close modals
function closeCheckoutModal() {
    document.getElementById('checkoutModal').classList.remove('active');
}

function closeSuccessModal() {
    document.getElementById('successModal').classList.remove('active');
}

// ===== TOAST =====
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    toastMessage.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ===== UTILITIES =====
function scrollToMenu() {
    document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
}

function toggleMobileMenu() {
    document.getElementById('navLinks').classList.toggle('active');
}
