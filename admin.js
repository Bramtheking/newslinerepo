// Simple admin: store products in localStorage and render list
const ADMIN_KEY = 'shopy_products_admin';

function loadAdminProducts() {
  try {
    return JSON.parse(localStorage.getItem(ADMIN_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function saveAdminProducts(products) {
  localStorage.setItem(ADMIN_KEY, JSON.stringify(products));
}

function toDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve('');
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function renderProductsTable() {
  const tbody = document.getElementById('productsTable');
  const products = loadAdminProducts();
  if (!tbody) return;
  tbody.innerHTML = products.map(p => `
    <tr>
      <td><img src="${p.image}" alt="${p.name}"></td>
      <td>${p.name}</td>
      <td>KSh ${Number(p.price).toLocaleString('en-KE')}</td>
      <td>${p.category}</td>
      <td class="actions">
        <button data-action="edit" data-id="${p.id}" class="btn">Edit</button>
        <button data-action="delete" data-id="${p.id}" class="btn" style="background:#dc3545">Delete</button>
        <a href="product.html?id=${p.id}" class="btn" style="background:#6c757d">View</a>
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('button[data-action]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      const action = e.currentTarget.getAttribute('data-action');
      if (action === 'delete') handleDelete(id);
      if (action === 'edit') handleEdit(id);
    });
  });
}

function handleDelete(id) {
  const products = loadAdminProducts();
  const product = products.find(p => String(p.id) === String(id));
  
  if (!product) return;
  
  if (confirm(`Are you sure you want to delete "${product.name}"? This action cannot be undone.`)) {
    let updatedProducts = products.filter(p => String(p.id) !== String(id));
    saveAdminProducts(updatedProducts);
    renderProductsTable();
    
    if (typeof showToast === 'function') {
      showToast(`"${product.name}" deleted successfully`, 'success');
    } else {
      alert(`"${product.name}" deleted successfully`);
    }
  }
}

function handleEdit(id) {
  const products = loadAdminProducts();
  const p = products.find(pr => String(pr.id) === String(id));
  if (!p) return;
  
  // Populate form with product data
  document.getElementById('productId').value = p.id;
  document.getElementById('name').value = p.name;
  document.getElementById('price').value = p.price;
  document.getElementById('category').value = p.category;
  document.getElementById('description').value = p.description || '';
  
  const specsTextarea = document.getElementById('specs');
  if (specsTextarea) {
    const lines = (p.specs || []).map(s => `${s.key}: ${s.value}`).join('\n');
    specsTextarea.value = lines;
  }
  
  // Clear image input (user needs to re-select if they want to change)
  document.getElementById('image').value = '';
  
  // Scroll to form and show feedback
  window.scrollTo({ top: 0, behavior: 'smooth' });
  
  if (typeof showToast === 'function') {
    showToast(`Editing "${p.name}"`, 'info');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('productForm');
  renderProductsTable();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const idInput = document.getElementById('productId');
    const name = document.getElementById('name').value.trim();
    const price = Number(document.getElementById('price').value) || 0;
    const category = document.getElementById('category').value;
    const imageFile = document.getElementById('image').files[0];
    const description = document.getElementById('description').value.trim();
    const specsText = document.getElementById('specs') ? document.getElementById('specs').value.trim() : '';
    const specs = specsText
      ? specsText.split(/\n+/).map(line => {
          const [k, ...rest] = line.split(':');
          return { key: (k||'').trim(), value: (rest.join(':')||'').trim() };
        }).filter(p => p.key && p.value)
      : [];

    const imageData = await toDataUrl(imageFile);

    let products = loadAdminProducts();
    let id = idInput.value || Date.now().toString();
    const existing = products.find(p => String(p.id) === String(id));
    const payload = { id, name, price, category, image: imageData || (existing ? existing.image : ''), description, specs };

    if (existing) {
      Object.assign(existing, payload);
    } else {
      products.push(payload);
    }
    saveAdminProducts(products);
    form.reset();
    idInput.value = '';
    renderProductsTable();
    
    const action = existing ? 'updated' : 'created';
    if (typeof showToast === 'function') {
      showToast(`Product "${name}" ${action} successfully`, 'success');
    } else {
      alert(`Product "${name}" ${action} successfully`);
    }
  });
});


