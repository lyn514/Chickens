const CURRENCY = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' });

function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

function formatPrice(p) { return CURRENCY.format(p); }

function getAdminProducts() {
  try {
    const raw = localStorage.getItem('clover_admin_products');
    if (raw) return JSON.parse(raw);
  } catch (e) { /* ignore */ }
  return null;
}

function getProducts() {
  const admin = getAdminProducts();
  return admin ? admin : (window.CHICKENS || []);
}

function findProduct(id) {
  return getProducts().find(p => p.id == id);
}

function saveToast(msg) {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2200);
}

/* ---------- Render product cards ---------- */
function renderCards(containerId, products, onAdd) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  if (!products.length) {
    container.innerHTML = `<div class="empty-state"><h3>No chickens found</h3><p>Try adjusting your filters.</p></div>`;
    return;
  }
  products.forEach(p => {
    const stock = p.availability === 'In Stock';
    const card = document.createElement('article');
    card.className = 'product-card';
    card.innerHTML = `
      <div class="card-img">
        <img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" onerror="this.src='https://placehold.co/400x300?text=Chicken'">
        ${stock ? '' : '<span class="badge out">Sold Out</span>'}
      </div>
      <div class="card-body">
        <div class="card-meta"><span>${esc(p.ageLabel)}</span> <span>·</span> <span>${esc(p.breed)}</span></div>
        <h3 class="card-title">${esc(p.name)}</h3>
        <p style="font-size:0.86rem;color:var(--muted);margin-bottom:10px">${esc(p.shortDescription)}</p>
        <div class="card-price">${formatPrice(p.price)}</div>
        <div class="card-actions">
          <a href="product.html?id=${p.id}" class="btn btn-primary btn-sm">View Details</a>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

/* ---------- Global init ---------- */
document.addEventListener('DOMContentLoaded', () => {
  /* Mobile menu */
  const menuBtn = document.getElementById('menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  const mOverlay = document.getElementById('menu-overlay');
  function closeMobile() { if (!mobileMenu) return; mobileMenu.classList.remove('open'); mOverlay.classList.remove('open'); }
  if (menuBtn && mobileMenu) menuBtn.addEventListener('click', () => { mobileMenu.classList.add('open'); mOverlay.classList.add('open'); });
  if (mOverlay) mOverlay.addEventListener('click', closeMobile);

  /* Hamburger bars (button ships empty in the HTML) */
  if (menuBtn && !menuBtn.children.length) menuBtn.innerHTML = '<span></span><span></span><span></span>';

  /* Admin link styling */
  document.querySelectorAll('a[href="admin.html"]').forEach(a => { a.classList.add('nav-admin'); });
});
