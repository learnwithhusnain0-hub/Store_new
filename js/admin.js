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
    loadProducts();
    loadOrders();
    loadCVVTracking();
    loadCompanyCards();
    
    // Setup image preview
    setupImagePreview();
});

// Show different sections
function showSection(sectionId) {
    document.querySelectorAll('.admin-section').forEach(s => {
        s.classList.remove('active');
    });
    
    document.querySelectorAll('.admin-sidebar li').forEach(i => {
        i.classList.remove('active');
    });
    
    document.getElementById(sectionId).classList.add('active');
    event.target.closest('li').classList.add('active');
    
    // Refresh data
    if (sectionId === 'products') loadProducts();
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

// Load all products
async function loadProducts() {
    try {
        const snapshot = await db.collection('products').get();
        const tbody = document.getElementById('productsBody');
        tbody.innerHTML = '';
        
        snapshot.forEach(doc => {
            const product = doc.data();
            tbody.innerHTML += `
                <tr>
                    <td>
                        <img src="${product.imageUrl || 'https://via.placeholder.com/50'}" 
                             style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px;">
                    </td>
                    <td>${product.name}</td>
                    <td>₹${product.price}</td>
                    <td>${product.category}</td>
                    <td>${product.stock}</td>
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

// Setup image preview
function setupImagePreview() {
    const imageInput = document.getElementById('productImage');
    const preview = document.getElementById('imagePreview');
    const previewImg = preview.querySelector('img');
    const previewSpan = preview.querySelector('span');

    imageInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                previewImg.src = e.target.result;
                previewImg.style.display = 'block';
                previewSpan.style.display = 'none';
            }
            reader.readAsDataURL(file);
        }
    });
}

// Product form submit
document.getElementById('productForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = document.getElementById('submitBtn');
    const progressDiv = document.getElementById('uploadProgress');
    const progressFill = document.getElementById('progressFill');
    
    submitBtn.disabled = true;
    progressDiv.style.display = 'block';
    
    try {
        // Get form values
        const name = document.getElementById('productName').value;
        const price = parseFloat(document.getElementById('productPrice').value);
        const category = document.getElementById('productCategory').value;
        const description = document.getElementById('productDescription').value;
        const stock = parseInt(document.getElementById('productStock').value);
        const imageFile = document.getElementById('productImage').files[0];
        
        if (!imageFile) {
            alert('Please select an image');
            return;
        }
        
        // 1. Upload image to Firebase Storage
        const storageRef = storage.ref();
        const imageRef = storageRef.child(`products/${Date.now()}_${imageFile.name}`);
        
        // Upload with progress
        const uploadTask = imageRef.put(imageFile);
        
        uploadTask.on('state_changed',
            (snapshot) => {
                // Progress
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                progressFill.style.width = progress + '%';
                progressFill.textContent = Math.round(progress) + '%';
            },
            (error) => {
                console.error('Upload error:', error);
                alert('Image upload failed');
                submitBtn.disabled = false;
            },
            async () => {
                // Upload complete - get download URL
                const imageUrl = await imageRef.getDownloadURL();
                
                // 2. Save product to Firestore with image URL
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
                
                alert('Product added successfully!');
                
                // Reset form
                e.target.reset();
                document.querySelector('#imagePreview img').style.display = 'none';
                document.querySelector('#imagePreview span').style.display = 'block';
                progressDiv.style.display = 'none';
                submitBtn.disabled = false;
                
                // Refresh products list
                loadProducts();
                
                // Switch to products view
                showSection('products');
            }
        );
        
    } catch (error) {
        console.error('Error adding product:', error);
        alert('Error adding product: ' + error.message);
        submitBtn.disabled = false;
        progressDiv.style.display = 'none';
    }
});

// Delete product
async function deleteProduct(productId) {
    if (confirm('Are you sure you want to delete this product?')) {
        try {
            await db.collection('products').doc(productId).delete();
            loadProducts();
        } catch (error) {
            console.error('Error deleting product:', error);
            alert('Error deleting product');
        }
    }
}

// Load all orders
async function loadOrders() {
    try {
        const snapshot = await db.collection('orders').orderBy('createdAt', 'desc').get();
        const tbody = document.getElementById('ordersBody');
        tbody.innerHTML = '';
        
        snapshot.forEach(doc => {
            const order = doc.data();
            const products = order.products || [];
            const productNames = products.map(p => p.name).join(', ');
            
            tbody.innerHTML += `
                <tr>
                    <td>${doc.id.slice(0, 8)}...</td>
                    <td>${order.userEmail || 'N/A'}</td>
                    <td>${productNames.slice(0, 30)}${productNames.length > 30 ? '...' : ''}</td>
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

// Load CVV tracking
async function loadCVVTracking() {
    try {
        const ordersSnapshot = await db.collection('orders').get();
        
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
                
                if (order.createdAt > cvvStats[cvv].lastUsed) {
                    cvvStats[cvv].lastUsed = order.createdAt;
                }
            }
        });
        
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

// Card modal functions
function showAddCardForm() {
    document.getElementById('cardModal').style.display = 'block';
}

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
