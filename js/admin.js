const AGE_OPTIONS = [
  { key: '4-month', label: '4 Months' },
  { key: '5-month', label: '5 Months' },
  { key: '6-month', label: '6 Months' },
  { key: 'older', label: 'Older' }
];

let products = getProducts();
let editingId = null;
let uploadedImage = null;

const $ = id => document.getElementById(id);
const form = $('admin-form'), list = $('product-list'), saveBtn = $('save-btn'), cancelBtn = $('cancel-edit');

function saveProducts() {
  try {
    localStorage.setItem('clover_admin_products', JSON.stringify(products));
  } catch (e) {
    saveToast('Could not save (browser storage full?)');
  }
  products = getProducts();
}

const ageLabel = key => (AGE_OPTIONS.find(a => a.key === key) || { label: key }).label;
const statusOf = p => (p.stock > 0 ? 'In Stock' : 'Sold Out');

/* ---------- Overview ---------- */
function renderStats() {
  const inStock = products.filter(p => p.stock > 0).length;
  const units = products.reduce((n, p) => n + (p.stock || 0), 0);
  const value = products.reduce((n, p) => n + (p.price || 0) * (p.stock || 0), 0);
  const stats = [
    ['Listings', products.length],
    ['In stock', inStock],
    ['Sold out', products.length - inStock],
    ['Birds available', units],
    ['Inventory value', formatPrice(value)]
  ];
  $('stat-grid').innerHTML = stats.map(([k, v]) => `<div class="stat"><span>${k}</span><strong>${v}</strong></div>`).join('');
  $('image-list').innerHTML = [...new Set((window.CHICKENS || []).map(p => p.image))].map(i => `<option value="${esc(i)}">`).join('');
}

/* ---------- Listings table ---------- */
function renderList() {
  const q = $('admin-search').value.toLowerCase();
  const age = $('admin-age').value, status = $('admin-status').value;
  const rows = [...products]
    .filter(p => (!age || p.age === age) && (!status || statusOf(p) === status) && (!q || (p.name + ' ' + p.breed).toLowerCase().includes(q)))
    .sort((a, b) => b.id - a.id);

  list.innerHTML = rows.length ? rows.map(p => `
    <tr>
      <td>#${p.id}</td>
      <td><img class="admin-thumb" src="${esc(p.image)}" alt="" onerror="this.src='https://placehold.co/44x44?text=+'">${esc(p.breed)}</td>
      <td><span class="tag">${esc(ageLabel(p.age))}</span></td>
      <td><input class="inline-input" type="number" min="0" step="0.01" value="${p.price}" data-id="${p.id}" data-field="price" aria-label="Price"></td>
      <td><input class="inline-input" type="number" min="0" step="1" value="${p.stock}" data-id="${p.id}" data-field="stock" aria-label="Stock"></td>
      <td><span class="status ${statusOf(p) === 'In Stock' ? 'in' : 'out'}">${statusOf(p)}</span></td>
      <td><input type="checkbox" ${p.featured ? 'checked' : ''} data-id="${p.id}" data-field="featured" aria-label="Featured"></td>
      <td class="action-cell">
        <button class="edit-btn" data-id="${p.id}">Edit</button>
        <button class="delete-btn" data-id="${p.id}">Delete</button>
      </td>
    </tr>`).join('') : '<tr><td colspan="8" style="text-align:center;color:var(--muted)">No listings match.</td></tr>';
  renderStats();
}

list.addEventListener('change', e => {
  const el = e.target, field = el.dataset.field;
  if (!field) return;
  const p = products.find(x => x.id == el.dataset.id);
  if (!p) return;
  if (field === 'price') p.price = Math.max(0, parseFloat(el.value) || 0);
  if (field === 'stock') { p.stock = Math.max(0, parseInt(el.value) || 0); p.availability = statusOf(p); }
  if (field === 'featured') p.featured = el.checked;
  saveProducts();
  renderList();
  saveToast('Saved');
});

list.addEventListener('click', e => {
  const id = e.target.dataset.id;
  if (!id) return;
  if (e.target.classList.contains('edit-btn')) loadForEdit(parseInt(id));
  if (e.target.classList.contains('delete-btn') && confirm('Remove this chicken listing?')) {
    products = products.filter(p => p.id != id);
    saveProducts(); renderList(); saveToast('Listing deleted');
  }
});

['admin-search', 'admin-age', 'admin-status'].forEach(id => $(id).addEventListener('input', renderList));

/* ---------- Add / edit form ---------- */
function showPreview(src) {
  const img = $('image-preview');
  img.src = src || ''; img.style.display = src ? 'block' : 'none';
}

function loadForEdit(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  editingId = p.id; uploadedImage = null;
  ['name', 'breed', 'age', 'price', 'stock', 'description', 'image'].forEach(f => $(f).value = p[f]);
  $('egg').value = p.eggColor || '';
  $('trait').value = p.trait || '';
  $('type').value = p.type || '';
  $('featured').value = p.featured ? 'yes' : 'no';
  showPreview(p.image);
  saveBtn.textContent = 'Update Listing';
  cancelBtn.style.display = 'inline-block';
  $('add').scrollIntoView({ behavior: 'smooth' });
}

function resetForm() {
  editingId = null; uploadedImage = null;
  form.reset(); showPreview('');
  saveBtn.textContent = 'Add Listing';
  cancelBtn.style.display = 'none';
}

$('image').addEventListener('input', e => { uploadedImage = null; showPreview(e.target.value.trim()); });

/* Uploaded photos are shrunk to keep browser storage small */
$('image-file').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const img = new Image();
  img.onload = () => {
    const scale = Math.min(1, 600 / Math.max(img.width, img.height));
    const c = document.createElement('canvas');
    c.width = img.width * scale; c.height = img.height * scale;
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    uploadedImage = c.toDataURL('image/jpeg', 0.8);
    showPreview(uploadedImage);
  };
  img.src = URL.createObjectURL(file);
});

function nextId() { return Math.max(0, ...products.map(p => p.id)) + 1; }

form.addEventListener('submit', e => {
  e.preventDefault();
  const breed = $('breed').value.trim(), age = $('age').value, desc = $('description').value.trim();
  const stock = Math.max(0, parseInt($('stock').value) || 0);
  const data = {
    id: editingId || nextId(),
    slug: `${breed.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${age}`,
    name: $('name').value.trim(), breed, age, ageLabel: ageLabel(age),
    price: Math.max(0, parseFloat($('price').value) || 0),
    eggColor: $('egg').value.trim(), trait: $('trait').value.trim(), type: $('type').value.trim(),
    description: desc, shortDescription: desc.slice(0, 120),
    image: uploadedImage || $('image').value.trim() || 'https://placehold.co/600x420?text=Chicken',
    stock, availability: stock > 0 ? 'In Stock' : 'Sold Out',
    featured: $('featured').value === 'yes'
  };
  if (editingId) { products = products.map(p => p.id === editingId ? data : p); saveToast('Listing updated'); }
  else { products.push(data); saveToast('New listing added'); }
  saveProducts(); renderList(); resetForm();
});

cancelBtn.addEventListener('click', resetForm);

$('reset-csv').addEventListener('click', () => {
  if (confirm('Reset all admin changes and restore default listings?')) {
    localStorage.removeItem('clover_admin_products');
    products = getProducts(); renderList(); resetForm(); saveToast('Reset to defaults');
  }
});

/* Sidebar: highlight the section being viewed */
document.querySelectorAll('.admin-sidebar a[href^="#"]').forEach(a => a.addEventListener('click', () => {
  document.querySelectorAll('.admin-sidebar a').forEach(x => x.classList.remove('active'));
  a.classList.add('active');
}));

renderList();
