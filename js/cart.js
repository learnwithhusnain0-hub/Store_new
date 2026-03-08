// ============================================
// CART MODULE
// ============================================

// Cart state
let cart = [];

// Load cart from localStorage
function loadCart() {
    const saved = localStorage.getItem('cart');
    if (saved) {
        cart = JSON.parse(saved);
        updateCartCount();
    }
}

// Save cart to localStorage
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
}

// Update cart count display
function updateCartCount() {
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    const countElement = document.getElementById('cartCount');
    if (countElement) countElement.textContent = count;
}

// Add item to cart
function addToCart(product) {
    const existing = cart.find(item => item.id === product.id);
    
    if (existing) {
        existing.quantity++;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: 1
        });
    }
    
    saveCart();
    displayCartItems();
    showToast('Added to cart!');
}

// Remove item from cart
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    displayCartItems();
}

// Update item quantity
function updateQuantity(productId, change) {
    const item = cart.find(i => i.id === productId);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(productId);
        } else {
            saveCart();
            displayCartItems();
        }
    }
}

// Clear entire cart
function clearCart() {
    cart = [];
    saveCart();
    displayCartItems();
}

// Calculate cart total
function calculateTotal() {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

// Display cart items in sidebar
function displayCartItems() {
    const container = document.getElementById('cartItems');
    const totalElement = document.getElementById('cartTotal');
    
    if (!container || !totalElement) return;
    
    if (cart.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999;">Cart is empty</p>';
        totalElement.textContent = '$0.00';
        return;
    }
    
    let html = '';
    cart.forEach(item => {
        html += `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                <div class="cart-item-details">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">$${(item.price * item.quantity).toFixed(2)}</div>
                    <div class="cart-item-actions">
                        <button class="quantity-btn" onclick="window.cart.updateQuantity('${item.id}', -1)">-</button>
                        <span>${item.quantity}</span>
                        <button class="quantity-btn" onclick="window.cart.updateQuantity('${item.id}', 1)">+</button>
                        <button class="remove-btn" onclick="window.cart.removeFromCart('${item.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    totalElement.textContent = `$${calculateTotal().toFixed(2)}`;
}

// Checkout function
async function checkout() {
    if (cart.length === 0) {
        showToast('Cart is empty!');
        return;
    }
    
    if (!currentUser) {
        showToast('Please login first!');
        googleLogin();
        return;
    }
    
    // Here you would implement payment modal
    alert('Proceed to payment...');
}

// Toggle cart sidebar
function toggleCart() {
    const sidebar = document.getElementById('cartSidebar');
    const overlay = document.getElementById('overlay');
    
    if (sidebar && overlay) {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
        displayCartItems();
    }
}

// Initialize cart
document.addEventListener('DOMContentLoaded', loadCart);

// Export cart functions globally
window.cart = {
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    checkout,
    getItems: () => cart,
    getTotal: calculateTotal
};

window.cartUI = {
    toggleCart,
    displayCartItems
};
