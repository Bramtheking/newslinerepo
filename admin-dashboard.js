// Admin Dashboard JavaScript
// Clean implementation without conflicts

// Cloudinary configuration
const CLOUDINARY_CONFIG = {
    cloudName: 'ds60x41jz',
    uploadPreset: 'e-commerce'
};

// Global variables
let currentImageUrl = '';
let firebaseDatabase = null;

// Initialize Firebase connection
function initializeFirebase() {
    if (window.firebaseDb) {
        firebaseDatabase = window.firebaseDb;
        console.log('✅ Firebase connected successfully');
        return true;
    }
    console.log('⏳ Waiting for Firebase...');
    return false;
}

// Toast notification system
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) {
        console.log('Toast:', message, type);
        return;
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
    padding: 12px 20px;
    margin: 10px;
    border-radius: 4px;
    color: white;
    font-weight: 500;
    animation: slideIn 0.3s ease;
    background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#007bff'};
  `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Image upload to Cloudinary
async function uploadToCloudinary(file) {
    console.log('📤 Starting upload:', file.name);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
    formData.append('folder', 'ecommerce-products');

    try {
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`,
            {
                method: 'POST',
                body: formData
            }
        );

        if (!response.ok) {
            const errorData = await response.text();
            console.error('❌ Upload failed:', errorData);
            throw new Error(`Upload failed: ${response.status}`);
        }

        const result = await response.json();
        console.log('✅ Upload successful:', result.secure_url);
        return result.secure_url;
    } catch (error) {
        console.error('❌ Upload error:', error);
        throw error;
    }
}

// Load products from Firebase
async function loadProducts() {
    if (!firebaseDatabase) {
        console.error('❌ Firebase not initialized');
        return [];
    }

    try {
        console.log('📥 Loading products...');
        const snapshot = await firebaseDatabase.collection('products').orderBy('createdAt', 'desc').get();
        const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log(`✅ Loaded ${products.length} products`);
        return products;
    } catch (error) {
        console.error('❌ Error loading products:', error);
        return [];
    }
}

// Save product to Firebase
async function saveProduct(productData) {
    if (!firebaseDatabase) {
        throw new Error('Firebase not initialized');
    }

    try {
        console.log('💾 Saving product:', productData.name);

        if (productData.id && productData.id !== 'new') {
            // Update existing product
            await firebaseDatabase.collection('products').doc(productData.id).update({
                ...productData,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log('✅ Product updated');
        } else {
            // Create new product
            delete productData.id;
            const docRef = await firebaseDatabase.collection('products').add({
                ...productData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log('✅ Product created with ID:', docRef.id);
        }
        return true;
    } catch (error) {
        console.error('❌ Error saving product:', error);
        throw error;
    }
}

// Delete product from Firebase
async function deleteProduct(productId) {
    if (!firebaseDatabase) {
        throw new Error('Firebase not initialized');
    }

    try {
        await firebaseDatabase.collection('products').doc(productId).delete();
        console.log('✅ Product deleted:', productId);
        return true;
    } catch (error) {
        console.error('❌ Error deleting product:', error);
        throw error;
    }
}

// Render products table
async function renderProductsTable() {
    const tbody = document.getElementById('productsTableBody');
    if (!tbody) return;

    try {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Loading products...</td></tr>';

        const products = await loadProducts();

        if (products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No products found</td></tr>';
            return;
        }

        tbody.innerHTML = products.map(p => `
      <tr>
        <td><img src="${p.imageUrl || p.image || ''}" alt="${p.name}" style="max-width: 60px; max-height: 60px; object-fit: contain;"></td>
        <td>${p.name}</td>
        <td>KSh ${Number(p.price).toLocaleString('en-KE')}</td>
        <td>${p.category}</td>
        <td class="actions">
          <button data-action="edit" data-id="${p.id}" class="btn btn-edit">Edit</button>
          <button data-action="delete" data-id="${p.id}" class="btn btn-delete" style="background:#dc3545">Delete</button>
          <a href="product.html?id=${p.id}" class="btn btn-view" style="background:#6c757d">View</a>
        </td>
      </tr>
    `).join('');

        tbody.querySelectorAll('button[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                const action = e.currentTarget.getAttribute('data-action');
                if (action === 'delete') confirmDelete(id, products.find(p => p.id === id)?.name);
                if (action === 'edit') editProduct(id);
            });
        });

    } catch (error) {
        console.error('❌ Error rendering table:', error);
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: red;">Error loading products</td></tr>';
    }
}

// Edit product function
async function editProduct(productId) {
    try {
        const doc = await firebaseDatabase.collection('products').doc(productId).get();
        if (!doc.exists) {
            showToast('Product not found', 'error');
            return;
        }

        const product = doc.data();

        // Populate form
        document.getElementById('productId').value = productId;
        document.getElementById('productName').value = product.name;
        document.getElementById('productPrice').value = product.price;
        document.getElementById('productCategory').value = product.category;
        document.getElementById('productDescription').value = product.description || '';

        // Handle specs
        const specsText = (product.specs || [])
            .map(spec => `${spec.key}: ${spec.value}`)
            .join('\n');
        document.getElementById('productSpecs').value = specsText;

        // Handle image
        if (product.imageUrl) {
            currentImageUrl = product.imageUrl;
            document.getElementById('imageUrl').value = currentImageUrl;
            document.getElementById('uploadStatus').textContent = 'Current image loaded';
            document.getElementById('uploadStatus').style.color = '#28a745';

            const preview = document.getElementById('imagePreview');
            preview.innerHTML = `<img src="${currentImageUrl}" alt="Current image">`;
        }

        // Scroll to form
        window.scrollTo({ top: 0, behavior: 'smooth' });
        showToast(`Editing "${product.name}"`, 'info');

    } catch (error) {
        console.error('❌ Error loading product for edit:', error);
        showToast('Error loading product', 'error');
    }
}

// Confirm delete function
async function confirmDelete(productId, productName) {
    if (confirm(`Are you sure you want to delete "${productName}"?\n\nThis action cannot be undone.`)) {
        try {
            await deleteProduct(productId);
            await renderProductsTable();
            showToast(`"${productName}" deleted successfully`, 'success');
        } catch (error) {
            showToast('Failed to delete product', 'error');
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initializing Admin Dashboard...');

    // Initialize Firebase
    if (!initializeFirebase()) {
        setTimeout(() => {
            if (!initializeFirebase()) {
                showToast('Failed to connect to Firebase', 'error');
                return;
            }
            renderProductsTable();
        }, 1000);
    } else {
        renderProductsTable();
    }

    // Image upload handler
    const imageFile = document.getElementById('imageFile');
    const uploadStatus = document.getElementById('uploadStatus');
    const imagePreview = document.getElementById('imagePreview');

    imageFile.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        console.log('📁 File selected:', file.name);

        // Validate file
        if (!file.type.startsWith('image/')) {
            uploadStatus.textContent = 'Please select an image file';
            uploadStatus.style.color = '#dc3545';
            showToast('Please select an image file', 'error');
            return;
        }

        if (file.size > 10000000) { // 10MB
            uploadStatus.textContent = 'Image too large (max 10MB)';
            uploadStatus.style.color = '#dc3545';
            showToast('Image too large (max 10MB)', 'error');
            return;
        }

        // Show preview immediately
        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
        };
        reader.readAsDataURL(file);

        // Upload to Cloudinary
        uploadStatus.textContent = 'Uploading...';
        uploadStatus.style.color = '#007bff';

        try {
            const imageUrl = await uploadToCloudinary(file);

            currentImageUrl = imageUrl;
            document.getElementById('imageUrl').value = imageUrl;

            uploadStatus.textContent = 'Image uploaded successfully!';
            uploadStatus.style.color = '#28a745';

            showToast('Image uploaded successfully!', 'success');
        } catch (error) {
            uploadStatus.textContent = 'Upload failed. Please try again.';
            uploadStatus.style.color = '#dc3545';
            imagePreview.innerHTML = '';
            showToast('Upload failed. Please try again.', 'error');
        }
    });

    // Form submission handler
    const form = document.getElementById('productForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        submitBtn.disabled = true;

        try {
            const formData = {
                id: document.getElementById('productId').value || 'new',
                name: document.getElementById('productName').value.trim(),
                price: Number(document.getElementById('productPrice').value) || 0,
                category: document.getElementById('productCategory').value,
                imageUrl: document.getElementById('imageUrl').value || currentImageUrl,
                description: document.getElementById('productDescription').value.trim(),
                specs: []
            };

            // Parse specs
            const specsText = document.getElementById('productSpecs').value.trim();
            if (specsText) {
                formData.specs = specsText.split('\n')
                    .map(line => {
                        const [key, ...valueParts] = line.split(':');
                        return {
                            key: (key || '').trim(),
                            value: (valueParts.join(':') || '').trim()
                        };
                    })
                    .filter(spec => spec.key && spec.value);
            }

            // Validate required fields
            if (!formData.name) {
                throw new Error('Product name is required');
            }
            if (!formData.imageUrl) {
                throw new Error('Please upload an image');
            }
            if (!formData.category) {
                throw new Error('Please select a category');
            }

            await saveProduct(formData);

            // Reset form
            form.reset();
            document.getElementById('productId').value = '';
            currentImageUrl = '';
            document.getElementById('imageUrl').value = '';
            uploadStatus.textContent = 'No image selected';
            uploadStatus.style.color = '';
            imagePreview.innerHTML = '';

            await renderProductsTable();

            const action = formData.id && formData.id !== 'new' ? 'updated' : 'created';
            showToast(`Product "${formData.name}" ${action} successfully`, 'success');

        } catch (error) {
            console.error('❌ Form submission error:', error);
            showToast(error.message || 'Error saving product', 'error');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;
document.head.appendChild(style);