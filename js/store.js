// ============================================
// STORE MODULE - Products Display
// ============================================

// Load products from Firebase
async function loadProducts() {
    try {
        const snapshot = await db.collection('products').get();
        const grid = document.getElementById('productsGrid');
        
        if (!grid) return;
        
        grid.innerHTML = '';
        
        if (snapshot.empty) {
            grid.innerHTML = '<p style="text-align: center; padding: 40px;">No products available</p>';
            return;
        }
        
        snapshot.forEach(doc => {
            const product = { id: doc.id, ...doc.data() };
            displayProduct(grid, product);
        });
    } catch (error) {
        console.error('Error loading products:', error);
        showToast('Failed to load products');
    }
}

// Display single product
function displayProduct(container, product) {
    const productHTML = `
        <div class="product-card">
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}" loading="lazy">
            </div>
            <div class="product-info">
                <h3>${product.name}</h3>
                <div class="product-price">$${product.price}</div>
                <button class="btn-add-to-cart" onclick="addToCartHandler('${product.id}', '${product.name}', ${product.price}, '${product.image}')">
                    <i class="fas fa-cart-plus"></i> Add to Cart
                </button>
            </div>
        </div>
    `;
    
    container.innerHTML += productHTML;
}

// Add to cart handler
function addToCartHandler(id, name, price, image) {
    window.cart.addToCart({ id, name, price, image });
}

// Scroll to menu
function scrollToMenu() {
    const productsSection = document.getElementById('products');
    if (productsSection) {
        productsSection.scrollIntoView({ behavior: 'smooth' });
    }
}

// Toggle mobile menu (to be implemented)
function toggleMobileMenu() {
    // Add your mobile menu logic here
    alert('Mobile menu - Add your links here');
}

// Show toast notification
function showToast(message) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    if (toast && toastMessage) {
        toastMessage.textContent = message;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 2000);
    }
}

// Initialize store
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
});

// Make functions global
window.addToCartHandler = addToCartHandler;
window.scrollToMenu = scrollToMenu;
window.toggleMobileMenu = toggleMobileMenu;
window.showToast = showToast;
