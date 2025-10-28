# 🚀 Quick Start Guide - By Role

## 👤 **PERSON 1: Cloudinary Integration**

### **Setup (15 mins):**
1. Go to https://cloudinary.com/users/register/free
2. Sign up for free account
3. Dashboard → Settings → Upload → Create upload preset
4. Set preset to "unsigned" for client-side uploads
5. Note your: `Cloud Name` and `Upload Preset Name`

### **Code to Add:**

**1. Add Cloudinary Widget to admin.html (in `<head>`):**
```html
<script src="https://upload-widget.cloudinary.com/global/all.js"></script>
```

**2. Create `cloudinary-config.js`:**
```javascript
const CLOUDINARY_CONFIG = {
  cloudName: 'YOUR_CLOUD_NAME',
  uploadPreset: 'YOUR_UPLOAD_PRESET'
};

async function uploadToCloudinary(file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
  
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`,
    { method: 'POST', body: formData }
  );
  
  const data = await response.json();
  return data.secure_url; // Return the image URL
}
```

**3. Update admin.js (replace toDataUrl function):**
```javascript
// OLD: const imageData = await toDataUrl(imageFile);
// NEW:
const imageData = imageFile ? await uploadToCloudinary(imageFile) : '';
```

**Test:** Upload image in admin panel → Check Cloudinary dashboard → Verify URL saved

---

## 👤 **PERSON 2: Firebase Database**

### **Setup (20 mins):**
1. Go to https://console.firebase.google.com
2. Create new project "shopy-ecommerce"
3. Add web app (click Web icon)
4. Copy Firebase config object
5. Enable Firestore Database (Test mode for now)
6. Create collections: `products`, `orders`, `users`

### **Code to Add:**

**1. Add Firebase to index.html (before closing `</body>`):**
```html
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js"></script>
<script src="firebase-config.js"></script>
```

**2. Create `firebase-config.js`:**
```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
```

**3. Create `firebase-db.js`:**
```javascript
// Products
async function getAllProductsFromDB() {
  const snapshot = await db.collection('products').get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

async function addProductToDB(product) {
  const docRef = await db.collection('products').add(product);
  return docRef.id;
}

async function updateProductInDB(id, data) {
  await db.collection('products').doc(id).update(data);
}

async function deleteProductFromDB(id) {
  await db.collection('products').doc(id).delete();
}

// Orders
async function createOrderInDB(orderData) {
  const docRef = await db.collection('orders').add({
    ...orderData,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    status: 'pending'
  });
  return docRef.id;
}
```

**4. Update product.js:**
```javascript
// Replace getAllProducts() function:
async function getAllProducts() {
  return await getAllProductsFromDB();
}
```

**Test:** Add product → Check Firebase console → Verify data stored

---

## 👤 **PERSON 3: Authentication**

### **Setup (15 mins):**
1. Firebase Console → Authentication
2. Enable Email/Password sign-in
3. Enable Google sign-in (optional)

### **Code to Add:**

**1. Add Firebase Auth to your pages:**
```html
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js"></script>
```

**2. Create `login.html`:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Login - SHOPY</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="auth-container">
    <h2>Login</h2>
    <form id="loginForm">
      <input type="email" id="email" placeholder="Email" required>
      <input type="password" id="password" placeholder="Password" required>
      <button type="submit" class="btn">Login</button>
    </form>
    <p>Don't have an account? <a href="register.html">Register</a></p>
  </div>
  <script src="firebase-config.js"></script>
  <script src="auth.js"></script>
</body>
</html>
```

**3. Create `auth.js`:**
```javascript
const auth = firebase.auth();

// Register
async function registerUser(email, password, displayName) {
  const userCredential = await auth.createUserWithEmailAndPassword(email, password);
  await userCredential.user.updateProfile({ displayName });
  await db.collection('users').doc(userCredential.user.uid).set({
    email, displayName, createdAt: new Date()
  });
  return userCredential.user;
}

// Login
async function loginUser(email, password) {
  return await auth.signInWithEmailAndPassword(email, password);
}

// Logout
async function logoutUser() {
  return await auth.signOut();
}

// Get current user
function getCurrentUser() {
  return auth.currentUser;
}

// Check auth state
auth.onAuthStateChanged(user => {
  if (user) {
    console.log('User logged in:', user.email);
    updateUIForLoggedInUser(user);
  } else {
    console.log('User logged out');
    updateUIForLoggedOutUser();
  }
});
```

**Test:** Register user → Login → Check Firebase Auth console

---

## 👤 **PERSON 4: Orders & Emails**

### **Setup (15 mins):**
1. Go to https://www.emailjs.com
2. Sign up for free account
3. Create email service (Gmail recommended)
4. Create email template for "Order Confirmation"
5. Note: `Service ID`, `Template ID`, `Public Key`

### **Code to Add:**

**1. Add EmailJS to checkout.html:**
```html
<script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js"></script>
```

**2. Create `email-service.js`:**
```javascript
emailjs.init('YOUR_PUBLIC_KEY');

async function sendOrderConfirmation(orderData) {
  const templateParams = {
    to_email: orderData.email,
    to_name: orderData.firstName,
    order_id: orderData.id,
    total: orderData.total,
    items: orderData.items.map(i => `${i.name} x${i.quantity}`).join(', ')
  };
  
  return await emailjs.send(
    'YOUR_SERVICE_ID',
    'YOUR_TEMPLATE_ID',
    templateParams
  );
}
```

**3. Create `orders.html` (Admin Order Management):**
```html
<!DOCTYPE html>
<html>
<head>
  <title>Orders - Admin</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="orders-container">
    <h2>Order Management</h2>
    <table id="ordersTable">
      <thead>
        <tr>
          <th>Order ID</th>
          <th>Customer</th>
          <th>Total</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody></tbody>
    </table>
  </div>
  <script src="firebase-config.js"></script>
  <script>
    // Load orders from Firebase
    db.collection('orders').orderBy('createdAt', 'desc').onSnapshot(snapshot => {
      const tbody = document.querySelector('#ordersTable tbody');
      tbody.innerHTML = snapshot.docs.map(doc => {
        const order = doc.data();
        return `
          <tr>
            <td>${doc.id}</td>
            <td>${order.firstName} ${order.lastName}</td>
            <td>KSh ${order.total}</td>
            <td>${order.status}</td>
            <td>
              <select onchange="updateOrderStatus('${doc.id}', this.value)">
                <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>Processing</option>
                <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Shipped</option>
                <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
              </select>
            </td>
          </tr>
        `;
      }).join('');
    });
    
    async function updateOrderStatus(orderId, newStatus) {
      await db.collection('orders').doc(orderId).update({ status: newStatus });
      alert('Order status updated!');
    }
  </script>
</body>
</html>
```

**Test:** Create test order → Check orders.html → Update status → Verify email sent

---

## 👤 **PERSON 5: UI/UX & Reviews**

### **Code to Add:**

**1. Add Reviews to product.html (after product details):**
```html
<section class="reviews-section">
  <h3>Customer Reviews</h3>
  <div class="reviews-summary">
    <div class="rating-stars">
      <span id="avgRating">0.0</span>
      <span class="stars" id="avgStars"></span>
    </div>
  </div>
  
  <form id="reviewForm" style="display:none;">
    <h4>Write a Review</h4>
    <div class="rating-input">
      <label>Rating:</label>
      <select id="reviewRating">
        <option value="5">5 Stars</option>
        <option value="4">4 Stars</option>
        <option value="3">3 Stars</option>
        <option value="2">2 Stars</option>
        <option value="1">1 Star</option>
      </select>
    </div>
    <textarea id="reviewComment" placeholder="Share your experience..." required></textarea>
    <button type="submit" class="btn">Submit Review</button>
  </form>
  
  <div id="reviewsList"></div>
</section>
```

**2. Create `reviews.js`:**
```javascript
async function addReview(productId, userId, userName, rating, comment) {
  await db.collection('reviews').add({
    productId,
    userId,
    userName,
    rating,
    comment,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    approved: false // Admin moderation
  });
}

async function getProductReviews(productId) {
  const snapshot = await db.collection('reviews')
    .where('productId', '==', productId)
    .where('approved', '==', true)
    .orderBy('createdAt', 'desc')
    .get();
  return snapshot.docs.map(doc => doc.data());
}

function displayReviews(reviews) {
  const container = document.getElementById('reviewsList');
  container.innerHTML = reviews.map(review => `
    <div class="review-card">
      <div class="review-header">
        <strong>${review.userName}</strong>
        <span class="stars">${'⭐'.repeat(review.rating)}</span>
      </div>
      <p>${review.comment}</p>
      <small>${new Date(review.createdAt?.toDate()).toLocaleDateString()}</small>
    </div>
  `).join('');
}
```

**3. Add Wishlist Toggle (in product cards):**
```html
<button class="wishlist-btn" onclick="toggleWishlist('PRODUCT_ID')">
  <i class="fa fa-heart"></i>
</button>
```

**4. Create `wishlist.js`:**
```javascript
async function toggleWishlist(productId) {
  const user = firebase.auth().currentUser;
  if (!user) {
    alert('Please login to add to wishlist');
    return;
  }
  
  const wishlistRef = db.collection('wishlists').doc(user.uid);
  const doc = await wishlistRef.get();
  
  if (doc.exists) {
    const wishlist = doc.data().items || [];
    const index = wishlist.indexOf(productId);
    if (index > -1) {
      wishlist.splice(index, 1); // Remove
      showToast('Removed from wishlist', 'info');
    } else {
      wishlist.push(productId); // Add
      showToast('Added to wishlist', 'success');
    }
    await wishlistRef.update({ items: wishlist });
  } else {
    await wishlistRef.set({ items: [productId] });
    showToast('Added to wishlist', 'success');
  }
}
```

**Test:** Add review → Check Firebase → Verify appears on product page

---

## 👤 **YOU: M-Pesa Integration**

### **Setup (30 mins):**
1. Go to https://developer.safaricom.co.ke
2. Create account and login
3. Create App → Get Consumer Key & Secret
4. Use Sandbox for testing
5. Test credentials:
   - **Shortcode:** 174379
   - **Passkey:** [Get from docs]

### **Code to Add:**

**1. Create `mpesa-handler.js`:**
```javascript
const MPESA_CONFIG = {
  consumerKey: 'YOUR_CONSUMER_KEY',
  consumerSecret: 'YOUR_CONSUMER_SECRET',
  shortcode: '174379', // Sandbox
  passkey: 'YOUR_PASSKEY',
  callbackUrl: 'https://your-domain.com/mpesa-callback'
};

async function getMpesaToken() {
  const auth = btoa(`${MPESA_CONFIG.consumerKey}:${MPESA_CONFIG.consumerSecret}`);
  const response = await fetch('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
    headers: { 'Authorization': `Basic ${auth}` }
  });
  const data = await response.json();
  return data.access_token;
}

async function initiateMpesaPayment(phoneNumber, amount, orderId) {
  const token = await getMpesaToken();
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
  const password = btoa(MPESA_CONFIG.shortcode + MPESA_CONFIG.passkey + timestamp);
  
  const response = await fetch('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      BusinessShortCode: MPESA_CONFIG.shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: phoneNumber,
      PartyB: MPESA_CONFIG.shortcode,
      PhoneNumber: phoneNumber,
      CallBackURL: MPESA_CONFIG.callbackUrl,
      AccountReference: orderId,
      TransactionDesc: `Payment for order ${orderId}`
    })
  });
  
  return await response.json();
}
```

**2. Update checkout.html:**
```javascript
// In placeOrder() function, when M-Pesa is selected:
if (selectedPayment.dataset.method === 'mpesa') {
  const phone = document.getElementById('phone').value;
  const total = calculateTotal();
  
  // Show loading
  showToast('Initiating M-Pesa payment...', 'info');
  
  try {
    const result = await initiateMpesaPayment(phone, total, orderId);
    if (result.ResponseCode === '0') {
      showToast('Please check your phone and enter M-Pesa PIN', 'success');
      // Poll for payment status
      checkPaymentStatus(result.CheckoutRequestID);
    } else {
      showToast('Payment failed: ' + result.errorMessage, 'error');
    }
  } catch (error) {
    showToast('Payment error: ' + error.message, 'error');
  }
}
```

**3. Create payment callback handler (needs backend):**
```javascript
// For now, simulate with polling:
async function checkPaymentStatus(checkoutRequestId) {
  // In production, this would check your backend
  // For now, show manual confirmation
  const paid = confirm('Have you completed the M-Pesa payment?');
  if (paid) {
    await createOrderInDB({...orderData, paymentStatus: 'paid'});
    showToast('Payment successful!', 'success');
    window.location.href = 'order-success.html';
  }
}
```

**Test:** Use sandbox phone number → Initiate payment → Verify callback received

---

## 🔗 **Integration Checklist**

### **Week 1 - Setup:**
- [ ] Everyone has their accounts created
- [ ] Firebase project shared with all
- [ ] Config files created and shared (NOT in Git!)
- [ ] Each person can run project locally

### **Week 2 - Core Features:**
- [ ] Images upload to Cloudinary
- [ ] Products save to Firebase
- [ ] Users can register/login
- [ ] Orders create in database
- [ ] Reviews can be added
- [ ] M-Pesa payment initiated

### **Week 3 - Integration:**
- [ ] All systems work together
- [ ] No localStorage used
- [ ] Auth protects required pages
- [ ] Orders have payment status
- [ ] Emails send on order creation
- [ ] UI is polished and responsive

---

## 🆘 **Common Issues & Solutions**

### **"Firebase not defined"**
- Make sure scripts are in correct order
- Firebase config must load before other scripts

### **"CORS error"**
- Use proper callback URLs
- For development, may need proxy

### **"Payment not working"**
- Check you're using sandbox credentials
- Verify phone number format (254XXXXXXXXX)

### **"Images not uploading"**
- Check upload preset is "unsigned"
- Verify cloud name is correct

---

## 📞 **Need Help?**

1. Check the main TEAM_TASKS.md file
2. Ask in team group chat
3. Google the specific error message
4. Check official documentation

**Remember: We're a team! Help each other! 🤝**
