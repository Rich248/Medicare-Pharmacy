/* ============================================================
   MediCare Pharmacy — script.js
   Auth · Cart · Checkout · Animations
   Storage: localStorage (medicare_users / medicare_session / medicare_cart)
   ============================================================ */

'use strict';

/* ══════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════ */

const getUsers   = () => { try { return JSON.parse(localStorage.getItem('medicare_users')) || []; } catch { return []; } };
const saveUsers  = u  => localStorage.setItem('medicare_users', JSON.stringify(u));
const getSession = () => { try { return JSON.parse(localStorage.getItem('medicare_session')); } catch { return null; } };
const saveSession = u => localStorage.setItem('medicare_session', JSON.stringify(u));
const clearSession = () => localStorage.removeItem('medicare_session');

function showEl(el) { if (el) { el.hidden = false; } }
function hideEl(el) { if (el) { el.hidden = true;  } }

/* Smooth animated show/hide using CSS transitions */
function fadeIn(el) {
  if (!el) return;
  el.hidden = false;
  el.style.opacity = '0';
  el.style.transform = 'translateY(10px)';
  el.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
  requestAnimationFrame(() => {
    el.style.opacity = '1';
    el.style.transform = 'translateY(0)';
  });
}

function setError(form, msg) {
  const errEl = form ? form.querySelector('[data-form-error]') : null;
  if (!errEl) return;
  errEl.textContent = msg;
  errEl.hidden = !msg;
  if (msg) fadeIn(errEl);
}

/* ══════════════════════════════════════════════════════════
   HEADER AUTH STATE
══════════════════════════════════════════════════════════ */

function updateHeaderAuth() {
  const session = getSession();
  const section = document.getElementById('userAuthSection');

  if (section) {
    if (session) {
      section.innerHTML = `
        <span class="user-greeting"><strong>${session.name.split(' ')[0]}</strong></span>
        <button type="button" class="signup-btn logout-btn" id="headerLogoutBtn">Log Out</button>`;
      document.getElementById('headerLogoutBtn')?.addEventListener('click', handleLogout);
    } else {
      section.innerHTML = `<span class="header-auth-links"><a class="login-link" href="login.html">Log In</a><a class="signup-btn" href="Register.html">Sign Up</a></span>`;
    }
  }

  /* Apply logged-in styling to login buttons */
  document.querySelectorAll('.login-btn').forEach(btn => {
    if (session) {
      btn.classList.add('is-logged-in');
    } else {
      btn.classList.remove('is-logged-in');
    }
  });

  /* Auth modal account view */
  const accountView  = document.getElementById('accountView');
  const accountName  = document.getElementById('accountName');
  const accountEmail = document.getElementById('accountEmail');
  const authTabs     = document.getElementById('authTabs');
  const modalLogin   = document.querySelector('[data-auth-form="login"]');
  const modalSignup  = document.querySelector('[data-auth-form="signup"]');

  if (accountView) {
    if (session) {
      showEl(accountView);
      hideEl(modalLogin);
      hideEl(modalSignup);
      hideEl(authTabs);
      if (accountName)  accountName.textContent  = session.name;
      if (accountEmail) accountEmail.textContent = session.email;
    } else {
      hideEl(accountView);
      showEl(modalLogin);
      hideEl(modalSignup);
      showEl(authTabs);
    }
  }
}

/* ══════════════════════════════════════════════════════════
   LOGOUT
══════════════════════════════════════════════════════════ */

function handleLogout() {
  clearSession();
  updateHeaderAuth();
  if (/login|Register|checkout/i.test(window.location.pathname)) {
    window.location.href = 'index.html';
  }
}

/* ══════════════════════════════════════════════════════════
   INLINE FORM MESSAGE (pages without [data-form-error])
══════════════════════════════════════════════════════════ */

function showFormMessage(form, msg, type) {
  let el = form.querySelector('.form-inline-msg');
  if (!el) {
    el = document.createElement('p');
    el.className = 'form-inline-msg';
    el.style.cssText = 'border-radius:7px;padding:10px 14px;font-size:.88rem;margin-bottom:.5rem;';
    const btn = form.querySelector('[type="submit"]');
    form.insertBefore(el, btn);
  }
  el.textContent = msg;
  el.style.color      = type === 'error' ? '#c0392b' : '#0b806e';
  el.style.background = type === 'error' ? '#fdf0f0' : '#e8f7f3';
  el.style.border     = `1px solid ${type === 'error' ? '#f5c6cb' : '#a8ddd3'}`;
  fadeIn(el);
}

/* ══════════════════════════════════════════════════════════
   REGISTRATION  (Register.html)
══════════════════════════════════════════════════════════ */

function initRegisterPage() {
  const form = document.getElementById('signupForm');
  if (!form || !document.getElementById('signupSuccessModal')) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    const name     = form.elements['name'].value.trim();
    const email    = form.elements['email'].value.trim().toLowerCase();
    const phone    = form.elements['phone']?.value.trim() || '';
    const code     = form.elements['countryCode']?.value || '+233';
    const address  = form.elements['address']?.value.trim() || '';
    const password = form.elements['password'].value;

    if (!name || !email || !password) {
      showFormMessage(form, 'Please fill in all required fields.', 'error'); return;
    }
    if (password.length < 6) {
      showFormMessage(form, 'Password must be at least 6 characters.', 'error'); return;
    }

    const users = getUsers();
    if (users.find(u => u.email === email)) {
      showFormMessage(form, 'An account with this email already exists. Please log in.', 'error'); return;
    }

    const newUser = { name, email, phone: code + ' ' + phone, address, password };
    users.push(newUser);
    saveUsers(users);
    saveSession({ name, email });

    const modal = document.getElementById('signupSuccessModal');
    const msgEl = document.getElementById('signupSuccessMessage');
    if (msgEl) msgEl.textContent = `Hello, ${name}! `;
    showEl(modal);

    const btn = document.getElementById('signupContinueBtn');
    if (btn) btn.addEventListener('click', () => { window.location.href = 'index.html'; }, { once: true });
  });
}

function initCountryCodeFlags() {
  const select = document.querySelector('select[name="countryCode"]');
  const flag = document.getElementById('countryFlagIcon');
  const code = document.getElementById('countryCallingCode');
  if (!select || !flag) return;
  const sync = () => {
    const option = select.selectedOptions[0];
    flag.textContent = option?.dataset.flag || '🌐';
    if (code) code.textContent = select.value || option?.value || '';
  };
  select.addEventListener('change', sync);
  sync();
}

/* ══════════════════════════════════════════════════════════
   LOGIN  (login.html)
══════════════════════════════════════════════════════════ */

function initLoginPage() {
  const form = document.querySelector('form#loginForm.auth-form-page');
  if (!form) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    const email    = form.elements['email'].value.trim().toLowerCase();
    const password = form.elements['password'].value;

    if (!email || !password) {
      showFormMessage(form, 'Please enter your email and password.', 'error'); return;
    }

    const user = getUsers().find(u => u.email === email && u.password === password);
    if (!user) {
      showFormMessage(form, 'Incorrect email or password. Please try again.', 'error'); return;
    }

    saveSession({ name: user.name, email: user.email });

    const modal = document.getElementById('loginSuccessModal');
    const msgEl = document.getElementById('loginSuccessMessage');
    if (msgEl) msgEl.textContent = `Hello, ${user.name}! 👋`;
    showEl(modal);

    const btn = document.getElementById('continueBtn');
    if (btn) btn.addEventListener('click', () => { window.location.href = 'index.html'; }, { once: true });
  });
}

/* ══════════════════════════════════════════════════════════
   AUTH MODAL  (index.html / checkout.html)
══════════════════════════════════════════════════════════ */

function initAuthModal() {
  /* Ensure initial state - show login, hide signup */
  const loginTab = document.querySelector('[data-auth-tab="login"]');
  const signupTab = document.querySelector('[data-auth-tab="signup"]');
  const loginForm = document.querySelector('[data-auth-form="login"]');
  const signupForm = document.querySelector('[data-auth-form="signup"]');

  if (loginTab && signupTab && loginForm && signupForm) {
    loginTab.classList.add('active');
    signupTab.classList.remove('active');
    loginForm.hidden = false;
    signupForm.hidden = true;
  }

  /* Tab switching for modal */
  document.querySelectorAll('[data-auth-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.authTab;
      document.querySelectorAll('[data-auth-tab]').forEach(b => b.classList.toggle('active', b === btn));
      document.querySelectorAll('[data-auth-form]').forEach(f => { f.hidden = f.dataset.authForm !== target; });
    });
  });

  /* Tab switching for auth page (login.html) */
  const authToggleBtns = document.querySelectorAll('.auth-toggle-btn');
  const loginView = document.getElementById('loginView');
  const signupView = document.getElementById('signupView');

  if (authToggleBtns.length > 0 && loginView && signupView) {
    authToggleBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.authTab;
        authToggleBtns.forEach(b => b.classList.toggle('active', b === btn));
        if (target === 'login') {
          loginView.classList.remove('hidden');
          signupView.classList.add('hidden');
        } else {
          loginView.classList.add('hidden');
          signupView.classList.remove('hidden');
        }
      });
    });
  }

  /* Auth-switch links for auth page */
  document.querySelectorAll('[data-auth-switch]').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const target = link.dataset.authSwitch;
      if (authToggleBtns.length > 0) {
        authToggleBtns.forEach(b => b.classList.toggle('active', b.dataset.authTab === target));
        if (target === 'login') {
          loginView.classList.remove('hidden');
          signupView.classList.add('hidden');
        } else {
          loginView.classList.add('hidden');
          signupView.classList.remove('hidden');
        }
      }
    });
  });

  /* Modal login submit */
  const mLogin = document.querySelector('[data-auth-form="login"]');
  if (mLogin) {
    mLogin.addEventListener('submit', function (e) {
      e.preventDefault();
      const email = this.elements['email'].value.trim().toLowerCase();
      const pass  = this.elements['password'].value;
      const user  = getUsers().find(u => u.email === email && u.password === pass);
      if (!user) { setError(this, 'Incorrect email or password.'); return; }
      setError(this, '');
      saveSession({ name: user.name, email: user.email });
      updateHeaderAuth();
      closeModal(document.getElementById('authModal'));
      // Show success toast
      showToast(`Welcome back, ${user.name}!`);
    });
  }

  /* Modal signup submit */
  const mSignup = document.querySelector('[data-auth-form="signup"]');
  if (mSignup) {
    mSignup.addEventListener('submit', function (e) {
      e.preventDefault();
      const name  = this.elements['name'].value.trim();
      const email = this.elements['email'].value.trim().toLowerCase();
      const pass  = this.elements['password'].value;
      if (!name || !email || !pass)  { setError(this, 'Please fill in all fields.'); return; }
      if (pass.length < 6)           { setError(this, 'Password must be at least 6 characters.'); return; }
      const users = getUsers();
      if (users.find(u => u.email === email)) { setError(this, 'Email already registered.'); return; }
      users.push({ name, email, password: pass });
      saveUsers(users);
      saveSession({ name, email });
      setError(this, '');
      updateHeaderAuth();
      closeModal(document.getElementById('authModal'));
      // Show success toast
      showToast(`Account created successfully, ${name}!`);
    });
  }

  /* Auth page login submit (login.html) */
  const pLogin = document.getElementById('loginForm');
  if (pLogin && !pLogin.hasAttribute('data-auth-form')) {
    pLogin.addEventListener('submit', function (e) {
      e.preventDefault();
      const email = this.elements['email'].value.trim().toLowerCase();
      const pass  = this.elements['password'].value;
      const user  = getUsers().find(u => u.email === email && u.password === pass);
      if (!user) { setError(this, 'Incorrect email or password.'); return; }
      setError(this, '');
      saveSession({ name: user.name, email: user.email });
      updateHeaderAuth();
      // Show success modal
      const modal = document.getElementById('loginSuccessModal');
      if (modal) {
        const msgEl = document.getElementById('loginSuccessMessage');
        if (msgEl) msgEl.textContent = `Hello, ${user.name}! 👋`;
        openModal(modal);
        const btn = document.getElementById('continueBtn');
        if (btn) btn.addEventListener('click', () => { window.location.href = 'index.html'; }, { once: true });
      }
    });
  }

  /* Auth page signup submit (login.html) */
  const pSignup = document.getElementById('signupForm');
  if (pSignup && !pSignup.hasAttribute('data-auth-form')) {
    pSignup.addEventListener('submit', function (e) {
      e.preventDefault();
      const name  = this.elements['name'].value.trim();
      const email = this.elements['email'].value.trim().toLowerCase();
      const pass  = this.elements['password'].value;
      if (!name || !email || !pass)  { setError(this, 'Please fill in all fields.'); return; }
      if (pass.length < 6)           { setError(this, 'Password must be at least 6 characters.'); return; }
      const users = getUsers();
      if (users.find(u => u.email === email)) { setError(this, 'Email already registered.'); return; }
      users.push({ name, email, password: pass });
      saveUsers(users);
      saveSession({ name, email });
      setError(this, '');
      updateHeaderAuth();
      // Show success modal
      const modal = document.getElementById('loginSuccessModal');
      if (modal) {
        const msgEl = document.getElementById('loginSuccessMessage');
        if (msgEl) msgEl.textContent = `Welcome, ${name}! 👋`;
        openModal(modal);
        const btn = document.getElementById('continueBtn');
        if (btn) btn.addEventListener('click', () => { window.location.href = 'index.html'; }, { once: true });
      }
    });
  }

  /* Logout from modal */
  document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);

  /* Auth-switch links for modal */
  document.querySelectorAll('[data-auth-switch]').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const target = link.dataset.authSwitch;
      // Check if we're in modal context (has data-auth-form elements)
      const modalForms = document.querySelectorAll('[data-auth-form]');
      if (modalForms.length > 0) {
        document.querySelectorAll('[data-auth-tab]').forEach(b => b.classList.toggle('active', b.dataset.authTab === target));
        document.querySelectorAll('[data-auth-form]').forEach(f => { f.hidden = f.dataset.authForm !== target; });
      }
      // Check if we're in auth page context (has auth-toggle-btn elements)
      const authToggleBtns = document.querySelectorAll('.auth-toggle-btn');
      const loginView = document.getElementById('loginView');
      const signupView = document.getElementById('signupView');
      if (authToggleBtns.length > 0 && loginView && signupView) {
        authToggleBtns.forEach(b => b.classList.toggle('active', b.dataset.authTab === target));
        if (target === 'login') {
          loginView.classList.remove('hidden');
          signupView.classList.add('hidden');
        } else {
          loginView.classList.add('hidden');
          signupView.classList.remove('hidden');
        }
      }
    });
  });
}

/* ══════════════════════════════════════════════════════════
   CART
══════════════════════════════════════════════════════════ */

let cart = [];

const getCart  = () => { try { return JSON.parse(localStorage.getItem('medicare_cart')) || []; } catch { return []; } };
const saveCart = () => localStorage.setItem('medicare_cart', JSON.stringify(cart));

function hydrateCartPricesFromPage() {
  const products = [...document.querySelectorAll('[data-add-to-cart]')].map(btn => {
    const card = btn.closest('[data-product]') || btn.closest('.product-card');
    const name = btn.dataset.name || card?.dataset.productName || card?.querySelector('h3')?.textContent?.trim() || '';
    const priceText = btn.dataset.price || card?.dataset.productPrice || card?.querySelector('[data-price], .price')?.textContent || '';
    return { name: name.trim(), price: Number.parseFloat(String(priceText).replace(/[^0-9.]/g, '')) || 0 };
  });
  let changed = false;
  cart = cart.map(item => {
    const match = products.find(product => product.name === item.name);
    if (match && (!Number.isFinite(Number(item.price)) || Number(item.price) <= 0) && match.price > 0) {
      changed = true;
      return { ...item, price: match.price };
    }
    return { ...item, price: Number(item.price) || 0, qty: Math.max(1, Number(item.qty) || 1) };
  });
  if (changed) saveCart();
}

function updateCartUI() {
  const total = cart.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.qty) || 0), 0);
  const count = cart.reduce((s, i) => s + (Number(i.qty) || 0), 0);

  /* Header badge */
  document.querySelectorAll('[data-cart-count]').forEach(el => {
    el.textContent = count;
    el.hidden = count === 0;
  });

  /* Header total */
  document.querySelectorAll('[data-cart-total]').forEach(el => {
    el.textContent = `GH₵ ${total.toFixed(2)}`;
  });

  /* Compact price list attached to each cart control. */
  document.querySelectorAll('[data-cart]').forEach(cartControl => {
    if (cartControl.parentElement) cartControl.parentElement.style.position = 'relative';
    let preview = cartControl.parentElement?.querySelector('.cart-icon-price-list');
    if (!preview) {
      preview = document.createElement('div');
      preview.className = 'cart-icon-price-list';
      preview.setAttribute('role', 'status');
      preview.setAttribute('aria-live', 'polite');
      cartControl.insertAdjacentElement('afterend', preview);
    }
    preview.innerHTML = cart.length
      ? `<div class="cart-preview-heading">Cart items</div><div class="cart-preview-items">${cart.map(item => `
          <div class="cart-preview-row"><span>${item.name} × ${item.qty}<small style="display:block;color:#6b7280">GH₵ ${Number(item.price).toFixed(2)} each</small></span><strong>GH₵ ${(Number(item.price) * Number(item.qty)).toFixed(2)}</strong></div>`).join('')}</div>
         <div class="cart-preview-total"><span>Total</span><strong>GH₵ ${total.toFixed(2)}</strong></div>`
      : '<div class="cart-preview-empty">Your cart is empty.</div>';
    preview.hidden = true;
    cartControl.setAttribute('aria-label', cart.length
      ? `Shopping cart: ${count} item${count === 1 ? '' : 's'}, total GH₵ ${total.toFixed(2)}`
      : 'Shopping cart is empty');
  });

  /* Cart modal list */
  const listEl  = document.getElementById('cartItemsList');
  const totalEl = document.getElementById('cartModalTotal');

  if (listEl) {
    if (cart.length === 0) {
      listEl.innerHTML = '<p class="cart-empty">Your cart is empty.</p>';
    } else {
      listEl.innerHTML = cart.map((item, idx) => `
        <div class="cart-item" style="animation:fadeSlideIn .25s ease both;animation-delay:${idx * 0.04}s">
          <img class="cart-item-image" src="${item.image || ''}" alt="${item.name}" onerror="this.style.display='none'">
          <div class="cart-item-info" style="flex:1;min-width:0">
            <div class="cart-item-name">${item.name}</div>
            <div class="cart-item-price" style="display:block!important;visibility:visible!important;color:#0b806e;font-weight:800;font-size:.95rem;margin-top:.2rem">GH₵ ${Number(item.price).toFixed(2)} each</div>
            <div class="cart-item-line-total" style="display:block!important;visibility:visible!important;color:#192f52;font-weight:800;font-size:.9rem;margin-top:.15rem">Item total: GH₵ ${(Number(item.price) * Number(item.qty)).toFixed(2)}</div>
          </div>
          <div class="cart-item-controls">
            <button class="qty-btn" type="button" onclick="changeQty(${idx},-1)">−</button>
            <span class="qty">${item.qty}</span>
            <button class="qty-btn" type="button" onclick="changeQty(${idx},1)">+</button>
            <button class="cart-item-remove" type="button" onclick="removeItem(${idx})">Remove</button>
          </div>
        </div>`).join('');
    }
  }

  if (totalEl) totalEl.textContent = `GH₵ ${total.toFixed(2)}`;
}

window.changeQty = function (idx, delta) {
  if (!cart[idx]) return;
  cart[idx].qty = Math.max(1, cart[idx].qty + delta);
  saveCart();
  updateCartUI();
};

window.removeItem = function (idx) {
  cart.splice(idx, 1);
  saveCart();
  updateCartUI();
};

function addToCart(product) {
  const normalized = {
    ...product,
    price: Number.isFinite(Number(product.price)) ? Number(product.price) : 0,
    qty: 1,
  };
  const existing = cart.find(i => i.id === normalized.id);
  if (existing) existing.qty = Math.max(1, Number(existing.qty) || 1) + 1;
  else cart.push(normalized);
  saveCart();
  updateCartUI();
}

/* ══════════════════════════════════════════════════════════
   MODALS
══════════════════════════════════════════════════════════ */

function openModal(modal) {
  if (!modal) return;
  showEl(modal);
  document.body.style.overflow = 'hidden';
  setTimeout(() => {
    modal.querySelector('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')?.focus();
  }, 100);
}

function closeModal(modal) {
  if (!modal) return;
  hideEl(modal);
  document.body.style.overflow = '';
}

function initCartPreview() {
  document.querySelectorAll('[data-cart]').forEach(cartControl => {
    const preview = cartControl.parentElement?.querySelector('.cart-icon-price-list');
    if (!preview || cartControl.dataset.previewBound === 'true') return;
    cartControl.dataset.previewBound = 'true';
    cartControl.addEventListener('mouseenter', () => { preview.hidden = false; });
    cartControl.addEventListener('mouseleave', () => window.setTimeout(() => {
      if (!preview.matches(':hover')) preview.hidden = true;
    }, 120));
    preview.addEventListener('mouseenter', () => { preview.hidden = false; });
    preview.addEventListener('mouseleave', () => { preview.hidden = true; });
    cartControl.addEventListener('focus', () => { preview.hidden = false; });
    cartControl.addEventListener('blur', () => { preview.hidden = true; });
  });
}

function initModals() {
  /* Close buttons */
  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.closest('.modal-overlay')));
  });

  /* Backdrop click */
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(overlay); });
  });

  /* Escape key */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay:not([hidden])').forEach(closeModal);
    }
  });

  /* Cart button opens cart modal without duplicate listeners. */
  document.querySelectorAll('[data-cart]').forEach(btn => {
    if (btn.dataset.cartBound === 'true') return;
    btn.dataset.cartBound = 'true';
    btn.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      openModal(document.getElementById('cartModal'));
    });
  });

  /* Checkout button in cart modal */
  const checkoutBtn = document.getElementById('checkoutBtn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      if (!getSession()) {
        closeModal(document.getElementById('cartModal'));
        // Reset auth modal to login tab before opening
        resetAuthModalToLogin();
        openModal(document.getElementById('authModal'));
        return;
      }
      if (cart.length === 0) {
        alert('Your cart is empty. Add some items first!');
        return;
      }
      window.location.href = 'checkout.html';
    });
  }
}

/* Reset auth modal to login tab state */
function resetAuthModalToLogin() {
  const loginTab = document.querySelector('[data-auth-tab="login"]');
  const signupTab = document.querySelector('[data-auth-tab="signup"]');
  const loginForm = document.querySelector('[data-auth-form="login"]');
  const signupForm = document.querySelector('[data-auth-form="signup"]');

  if (loginTab && signupTab && loginForm && signupForm) {
    loginTab.classList.add('active');
    signupTab.classList.remove('active');
    loginForm.hidden = false;
    signupForm.hidden = true;
  }
}

/* ══════════════════════════════════════════════════════════
   SEARCH
══════════════════════════════════════════════════════════ */

function initSearch() {
  const input = document.getElementById('searchInput');
  if (!input) return;

  const isMedicinesPage = /medicines\.html$/i.test(window.location.pathname);
  const params = new URLSearchParams(window.location.search);
  const initialQuery = (params.get('q') || '').trim();
  if (initialQuery) input.value = initialQuery;

  function normalize(value) {
    return String(value || '').toLowerCase().trim();
  }

  function applySearch(query) {
    const cards = [...document.querySelectorAll('.product-card')];
    if (!cards.length) return false;
    const term = normalize(query);
    const activeFilter = window.__activeMedicineFilter || 'all';
    let visible = 0;
    cards.forEach(card => {
      const searchable = normalize([
        card.dataset.productName,
        card.dataset.category,
        card.querySelector('h3, .product-name, .usage')?.textContent,
        card.textContent
      ].join(' '));
      const categoryMatch = activeFilter === 'all' || normalize(card.dataset.category) === normalize(activeFilter);
      const searchMatch = !term || searchable.includes(term);
      const show = categoryMatch && searchMatch;
      card.style.display = show ? 'flex' : 'none';
      if (show) visible += 1;
    });
    const empty = document.getElementById('searchEmptyState');
    if (empty) empty.hidden = visible !== 0;
    return true;
  }

  window.__applyMedicineSearch = applySearch;
  input.addEventListener('input', () => {
    if (isMedicinesPage) applySearch(input.value);
  });
  input.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
      event.preventDefault();
      const query = input.value.trim();
      if (isMedicinesPage) {
        const next = new URL(window.location.href);
        if (query) next.searchParams.set('q', query); else next.searchParams.delete('q');
        window.history.replaceState({}, '', next);
        applySearch(query);
      } else if (query) {
        window.location.href = `medicines.html?q=${encodeURIComponent(query)}`;
      }
    }
  });

  if (isMedicinesPage && initialQuery) applySearch(initialQuery);
}

/* ══════════════════════════════════════════════════════════
   ADD-TO-CART BUTTONS (product cards)
══════════════════════════════════════════════════════════ */

function initAddToCartButtons() {
  document.querySelectorAll('[data-add-to-cart]').forEach(btn => {
    if (btn.dataset.cartBtnBound === 'true') return;
    btn.dataset.cartBtnBound = 'true';
    btn.addEventListener('click', () => {
      const card = btn.closest('[data-product]') || btn.closest('.product-card');
      if (!card) return;
      const priceSource = btn.dataset.price || card.dataset.productPrice || card.querySelector('[data-price], .price')?.textContent || '0';
      const nameSource = btn.dataset.name || card.dataset.productName || card.querySelector('.product-name,h3')?.textContent || 'Product';
      const product = {
        id:    btn.dataset.productId || card.dataset.productId || nameSource.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') || Math.random().toString(36).slice(2),
        name:  nameSource.trim(),
        price: Number.parseFloat(String(priceSource).replace(/[^0-9.]/g, '')) || 0,
        image: card.querySelector('img')?.src || '',
      };
      addToCart(product);
      const orig = btn.textContent;
      btn.textContent = '✓ Added';
      btn.style.background = 'var(--teal-dark)';
      btn.disabled = true;
      setTimeout(() => { btn.textContent = orig; btn.style.background = ''; btn.disabled = false; }, 1200);
    });
  });
}

/* ══════════════════════════════════════════════════════════
   STUB LINKS (careers / legal / social)
══════════════════════════════════════════════════════════ */

function initStubLinks() {
  document.querySelectorAll('[data-careers]').forEach(el =>
    el.addEventListener('click', e => { e.preventDefault(); alert('Careers page coming soon!'); }));
  document.querySelectorAll('[data-legal]').forEach(el =>
    el.addEventListener('click', e => { e.preventDefault(); alert(`${el.dataset.legal} – coming soon!`); }));
  document.querySelectorAll('[data-social]').forEach(el =>
    el.addEventListener('click', e => { e.preventDefault(); alert(`Follow us on ${el.dataset.social}!`); }));
}

/* ══════════════════════════════════════════════════════════
   CHECKOUT PAGE  (checkout.html)
══════════════════════════════════════════════════════════ */

function initCheckoutPage() {
  if (!document.getElementById('placeOrderBtn')) return;

  const DELIVERY_FEE = 15;

  /* ── Guard: must be logged in ── */
  const session = getSession();
  if (!session) { window.location.href = 'login.html'; return; }

  /* ── Guard: cart must not be empty ── */
  if (cart.length === 0) { window.location.href = 'index.html'; return; }

  /* ── Pre-fill delivery form from user profile ── */
  const userData = getUsers().find(u => u.email === session.email);
  if (userData) {
    const nameEl    = document.getElementById('recipientName');
    const addressEl = document.getElementById('deliveryAddress');
    const phoneEl   = document.getElementById('phoneNumber');
    if (nameEl    && userData.name)    nameEl.value    = userData.name;
    if (addressEl && userData.address) addressEl.value = userData.address;
    if (phoneEl   && userData.phone)   phoneEl.value   = userData.phone;
  }

  /* ── Render cart items in sidebar ── */
  function renderSummary() {
    const listEl     = document.getElementById('checkoutItemsList');
    const subtotalEl = document.getElementById('checkoutSubtotal');
    const feeEl      = document.getElementById('checkoutDeliveryFee');
    const discountEl = document.getElementById('checkoutDiscount');
    const totalEl    = document.getElementById('checkoutTotal');

    const subtotal = cart.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.qty) || 0), 0);
    const discount = 0;
    const total    = subtotal + DELIVERY_FEE - discount;

    if (listEl) {
      listEl.innerHTML = cart.map((item, idx) => `
        <div class="checkout-item" style="animation:fadeSlideIn .3s ease both;animation-delay:${idx * 0.06}s">
          <img src="${item.image || ''}" alt="${item.name}"
               style="width:44px;height:44px;object-fit:cover;border-radius:8px;flex-shrink:0;background:#f1f4f3"
               onerror="this.style.display='none'">
          <div class="checkout-item-info" style="flex:1;padding-left:.5rem">
            <div class="checkout-item-name">${item.name}</div>
            <div class="checkout-item-qty">Qty: ${item.qty}</div>
          </div>
          <div class="checkout-item-price">GH₵ ${((Number(item.price) || 0) * (Number(item.qty) || 0)).toFixed(2)}</div>
        </div>`).join('');
    }

    if (subtotalEl) subtotalEl.textContent = `GH₵ ${subtotal.toFixed(2)}`;
    if (feeEl)      feeEl.textContent      = `GH₵ ${DELIVERY_FEE.toFixed(2)}`;
    if (discountEl) discountEl.textContent = `− GH₵ ${discount.toFixed(2)}`;
    if (totalEl)    totalEl.textContent    = `GH₵ ${total.toFixed(2)}`;

    return { subtotal, discount, total };
  }

  renderSummary();

  /* Guarantee a visible MoMo input even if the checkout HTML omitted it. */
  function ensureMomoField() {
    const option = [...document.querySelectorAll('.payment-option')].find(el =>
      el.querySelector('input[name="paymentMethod"][value="momo"]'));
    if (!option) return null;
    let details = option.querySelector('.payment-details');
    if (!details) {
      details = document.createElement('div');
      details.className = 'payment-details';
      option.appendChild(details);
    }
    let input = document.getElementById('momoNumber');
    if (!input) {
      const field = document.createElement('label');
      field.className = 'momo-number-field';
      field.innerHTML = '<span>Mobile Money number</span><input id="momoNumber" name="momoNumber" type="tel" inputmode="numeric" autocomplete="tel" placeholder="e.g. 024 123 4567" maxlength="15" required><small>Enter the number to use for this order.</small>';
      details.appendChild(field);
      input = field.querySelector('input');
    }
    input.required = true;
    input.setAttribute('aria-label', 'Mobile Money number');
    return input;
  }

  const momoInput = ensureMomoField();

  /* ── Payment method toggle (fix: proper show/hide with animation) ── */
  function applyPaymentToggle(selectedValue) {
    document.querySelectorAll('.payment-option').forEach(option => {
      const radio   = option.querySelector('input[type="radio"]');
      const details = option.querySelector('.payment-details');
      const card    = option.querySelector('.payment-card');

      if (!radio || !details) return;

      if (radio.value === selectedValue) {
        details.classList.remove('hidden');
        details.style.animation = 'fadeSlideIn 0.25s ease both';
        if (card) card.style.borderColor = 'var(--teal)';
        if (card) card.style.background  = 'var(--mint)';
      } else {
        details.classList.add('hidden');
        if (card) card.style.borderColor = '';
        if (card) card.style.background  = '';
      }
    });
  }

  /* Set initial state */
  const initialMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'momo';
  applyPaymentToggle(initialMethod);

  /* Listen for changes */
  document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
    radio.addEventListener('change', function () {
      applyPaymentToggle(this.value);
    });
  });

  /* Also make clicking the whole payment card select its radio */
  document.querySelectorAll('.payment-option').forEach(option => {
    option.addEventListener('click', function () {
      const radio = this.querySelector('input[type="radio"]');
      if (radio && !radio.checked) {
        radio.checked = true;
        applyPaymentToggle(radio.value);
      }
    });
  });

  /* ── Card number auto-format ── */
  document.getElementById('cardNumber')?.addEventListener('input', function () {
    let v = this.value.replace(/\D/g, '').slice(0, 16);
    this.value = v.replace(/(.{4})/g, '$1 ').trim();
  });

  document.getElementById('expiryDate')?.addEventListener('input', function () {
    let v = this.value.replace(/\D/g, '').slice(0, 4);
    if (v.length >= 3) v = v.slice(0, 2) + '/' + v.slice(2);
    this.value = v;
  });

  document.getElementById('cvv')?.addEventListener('input', function () {
    this.value = this.value.replace(/\D/g, '').slice(0, 4);
  });

  momoInput?.addEventListener('input', function () {
    this.value = this.value.replace(/[^0-9+\s()-]/g, '').slice(0, 20);
    this.setCustomValidity('');
  });

  /* ── Place order ── */
  document.getElementById('placeOrderBtn').addEventListener('click', () => {
    const recipientName = document.getElementById('recipientName')?.value.trim();
    const deliveryAddr  = document.getElementById('deliveryAddress')?.value.trim();
    const deliveryPhone = document.getElementById('phoneNumber')?.value.trim();

    if (!recipientName || !deliveryAddr || !deliveryPhone) {
      showCheckoutMsg('⚠️ Please fill in all delivery details before placing your order.', 'error');
      document.getElementById('recipientName')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const selectedMethod = document.querySelector('input[name="paymentMethod"]:checked');
    const momoEl = document.querySelector('#momoNumber, input[name="momoNumber"]');
    const cardEl = document.getElementById('cardPaymentDetails');
    const method = selectedMethod?.value || (momoEl && !momoEl.closest('.payment-details')?.classList.contains('hidden') ? 'momo' : 'card');
    let paymentNumber = '';

    if (method === 'momo') {
      const rawNumber = String(momoEl?.value || '').trim();
      const digits = rawNumber.replace(/\D/g, '');
      if (!digits) {
        showCheckoutMsg('Please enter your Mobile Money number before confirming the order.', 'error');
        momoEl?.focus();
        return;
      }
      if (digits.length < 9 || digits.length > 15) {
        showCheckoutMsg('Please enter a valid Mobile Money number.', 'error');
        momoEl?.focus();
        return;
      }
      paymentNumber = rawNumber;
    } else if (method === 'card') {
      const num    = document.getElementById('cardNumber')?.value.trim();
      const expiry = document.getElementById('expiryDate')?.value.trim();
      const cvv    = document.getElementById('cvv')?.value.trim();
      if (!num || !expiry || !cvv) { showCheckoutMsg('⚠️ Please fill in all card details.', 'error'); return; }
      if (num.replace(/\s/g, '').length < 16) { showCheckoutMsg('⚠️ Please enter a valid 16-digit card number.', 'error'); return; }
    }

    /* All valid — build order */
    const { subtotal, discount, total } = renderSummary();
    const order = {
      id:          'ORD-' + Date.now(),
      date:        new Date().toLocaleString('en-GH'),
      customer:    session,
      delivery:    { name: recipientName, address: deliveryAddr, phone: deliveryPhone },
      deliveryPerson: { name: 'Kwame Mensah', image: 'images/delivery-person.jpg' },
      payment:     method,
      paymentNumber,
      items:       [...cart],
      subtotal,
      deliveryFee: DELIVERY_FEE,
      discount,
      total,
    };

    localStorage.setItem('medicare_last_order', JSON.stringify(order));
    cart = [];
    saveCart();
    updateCartUI();

    showCheckoutMsg(`✅ Payment confirmed. Your order ${order.id} was placed successfully.`, 'success');

    // Redirect to order confirmation page
    setTimeout(() => {
      window.location.href = 'order-confirmation.html';
    }, 1500);
  });
}

/* ── Checkout inline message ── */
function showCheckoutMsg(msg, type) {
  let el = document.getElementById('checkoutMsg');
  if (!el) {
    el = document.createElement('p');
    el.id = 'checkoutMsg';
    el.style.cssText = 'border-radius:8px;padding:10px 14px;font-size:.88rem;margin:.75rem 0;font-weight:600;';
    const btn = document.getElementById('placeOrderBtn');
    btn?.parentNode.insertBefore(el, btn);
  }
  el.textContent  = msg;
  el.style.color  = type === 'error' ? '#c0392b' : '#0b806e';
  el.style.background = type === 'error' ? '#fdf0f0' : '#e8f7f3';
  el.style.border     = `1px solid ${type === 'error' ? '#f5c6cb' : '#a8ddd3'}`;
  fadeIn(el);
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/* ── Animated order success modal ── */
function showOrderSuccess(order) {
  /* Inject keyframe CSS once */
  if (!document.getElementById('mcAnimCSS')) {
    const s = document.createElement('style');
    s.id = 'mcAnimCSS';
    s.textContent = `
      @keyframes fadeSlideIn { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
      @keyframes popIn       { from { opacity:0; transform:scale(.7);       } to { opacity:1; transform:scale(1);   } }
      @keyframes overlayIn   { from { opacity:0; } to { opacity:1; } }
      .oc-overlay { animation: overlayIn .3s ease both; }
      .oc-card    { animation: popIn .4s cubic-bezier(.34,1.56,.64,1) .1s both; }
    `;
    document.head.appendChild(s);
  }

  const momoNum = document.getElementById('momoNumber')?.value.trim();
  const cardLast4 = (document.getElementById('cardNumber')?.value || '').replace(/\s/g, '').slice(-4);
  const payLabel = order.payment === 'momo'
    ? `📱 Mobile Money${momoNum ? ' — ' + momoNum : ''}`
    : `💳 Card ending in ${cardLast4 || '****'}`;

  const overlay = document.createElement('div');
  overlay.className = 'oc-overlay';
  overlay.style.cssText = `
    position:fixed;inset:0;z-index:9999;
    background:rgba(25,47,82,.65);backdrop-filter:blur(6px);
    display:flex;align-items:center;justify-content:center;padding:1rem;
    overflow-y:auto;`;

  overlay.innerHTML = `
    <div class="oc-card" style="
      background:#fff;border-radius:20px;padding:2.5rem 2rem;
      max-width:520px;width:100%;text-align:center;
      box-shadow:0 30px 80px rgba(0,0,0,.25);">

      <!-- Tick icon -->
      <div style="width:80px;height:80px;border-radius:50%;background:#0f9f87;
                  display:flex;align-items:center;justify-content:center;
                  margin:0 auto 1.25rem;font-size:2.2rem;color:#fff;
                  box-shadow:0 8px 24px rgba(15,159,135,.35);">✓</div>

      <h2 style="color:#192f52;font-size:1.6rem;margin:0 0 .4rem">Order Placed Successfully!</h2>
      <p role="status" style="color:#0b806e;font-weight:800;margin:0 0 .65rem;font-size:1rem">Payment confirmed — thank you for your order.</p>
      <p style="color:#0f9f87;font-weight:700;margin:0 0 1.5rem;font-size:.9rem">
        Order ID: ${order.id} &nbsp;·&nbsp; ${order.date}
      </p>

      <!-- Delivery & payment info -->
      <div style="background:#f4fbf9;border-radius:12px;padding:1.1rem 1.25rem;
                  text-align:left;margin-bottom:1.25rem;border:1px solid #dce6e3;">
        <div style="display:grid;gap:.6rem;font-size:.88rem;">
          <div style="display:flex;gap:.6rem;align-items:flex-start">
            <span style="min-width:20px">👤</span>
            <div><strong style="display:block;color:#172b4d">${order.delivery.name}</strong>
            <span style="color:#6b7280">${session.email}</span></div>
          </div>
          <div style="display:flex;gap:.6rem;align-items:flex-start">
            <span style="min-width:20px">📍</span>
            <span style="color:#172b4d">${order.delivery.address}</span>
          </div>
          <div style="display:flex;gap:.6rem;align-items:center">
            <span style="min-width:20px">📞</span>
            <span style="color:#172b4d">${order.delivery.phone}</span>
          </div>
          <div style="display:flex;gap:.6rem;align-items:center">
            <span style="min-width:20px">💳</span>
            <span style="color:#172b4d">${payLabel}</span>
          </div>
        </div>
      </div>

      <!-- Items -->
      <div style="text-align:left;margin-bottom:1.25rem;">
        <div style="font-size:.8rem;font-weight:700;color:#6b7280;
                    text-transform:uppercase;letter-spacing:.5px;margin-bottom:.6rem">Items Ordered</div>
        ${order.items.map(i => `
          <div style="display:flex;justify-content:space-between;
                      padding:.4rem 0;border-bottom:1px solid #f0f0f0;
                      font-size:.88rem;color:#172b4d;">
            <span>${i.name} <span style="color:#6b7280">× ${i.qty}</span></span>
            <strong>GH₵ ${((Number(i.price) || 0) * (Number(i.qty) || 0)).toFixed(2)}</strong>
          </div>`).join('')}

        <!-- Totals -->
        <div style="display:flex;justify-content:space-between;padding:.35rem 0;font-size:.85rem;color:#6b7280;margin-top:.25rem">
          <span>Subtotal</span><span>GH₵ ${order.subtotal.toFixed(2)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:.35rem 0;font-size:.85rem;color:#6b7280">
          <span>Delivery fee</span><span>GH₵ ${order.deliveryFee.toFixed(2)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:.6rem 0;
                    border-top:2px solid #dce6e3;margin-top:.25rem;
                    font-size:1.05rem;font-weight:800;color:#192f52;">
          <span>Total Paid</span><strong style="color:#0f9f87">GH₵ ${order.total.toFixed(2)}</strong>
        </div>
      </div>

      <p style="font-size:.82rem;color:#6b7280;margin-bottom:1.25rem;line-height:1.5">
        🚀 We'll send an SMS to <strong>${order.delivery.phone}</strong> once your order is dispatched.
      </p>

      <button id="oc-home-btn" style="
        background:var(--teal,#0f9f87);color:#fff;border:none;
        border-radius:10px;padding:.85rem 2rem;font-size:1rem;
        font-weight:800;cursor:pointer;width:100%;
        transition:background .2s,transform .15s;
        box-shadow:0 4px 14px rgba(15,159,135,.35);">
        🛍️ Continue Shopping
      </button>
    </div>`;

  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';

  const homeBtn = document.getElementById('oc-home-btn');
  homeBtn.addEventListener('mouseover', () => { homeBtn.style.background = '#0b806e'; homeBtn.style.transform = 'translateY(-1px)'; });
  homeBtn.addEventListener('mouseout',  () => { homeBtn.style.background = ''; homeBtn.style.transform = ''; });
  homeBtn.addEventListener('click', () => { window.location.href = 'index.html'; });
}

/* ══════════════════════════════════════════════════════════
   GLOBAL ANIMATION CSS (injected once)
══════════════════════════════════════════════════════════ */

function injectGlobalCSS() {
  if (document.getElementById('mcGlobalCSS')) return;
  const s = document.createElement('style');
  s.id = 'mcGlobalCSS';
  s.textContent = `
    html { scroll-behavior: smooth; }
    .site-header { position: sticky; top: 0; z-index: 1000; transition: background .25s ease, box-shadow .25s ease; }
    .site-header.is-scrolled { background: rgba(255,255,255,.96); box-shadow: 0 6px 20px rgba(25,47,82,.1); backdrop-filter: blur(10px); }
    @keyframes fadeSlideIn {
      from { opacity:0; transform:translateY(12px); }
      to   { opacity:1; transform:translateY(0);    }
    }
    /* Smooth button press feel */
    .btn, .outline-btn, .qty-btn, .cart-chip, [data-add-to-cart] {
      -webkit-tap-highlight-color: transparent;
      transition: transform .12s ease, box-shadow .12s ease, background .18s ease !important;
    }
    .btn:active, .outline-btn:active, [data-add-to-cart]:active {
      transform: scale(.96) !important;
    }
    /* Smooth modal open */
    .modal-overlay:not([hidden]) { display:grid; }
    /* Cart icon price list */
    [data-cart] { position: relative; }
    .cart-icon-price-list {
      position: absolute; top: calc(100% + 10px); right: 0; z-index: 1000;
      width: min(330px, calc(100vw - 2rem)); padding: .85rem;
      border: 1px solid #dce6e3; border-radius: 12px; background: #fff;
      box-shadow: 0 14px 34px rgba(25,47,82,.16); color: #192f52;
      animation: fadeSlideIn .18s ease both;
    }
    .cart-preview-heading { font-size: .76rem; font-weight: 800; text-transform: uppercase; letter-spacing: .04em; color: #6b7280; margin-bottom: .45rem; }
    .cart-preview-items { max-height: min(280px, 42vh); overflow-y: auto; overscroll-behavior: contain; scrollbar-width: thin; scrollbar-color: #9bcfc4 transparent; padding-right: .25rem; }
    .cart-preview-items::-webkit-scrollbar { width: 6px; }
    .cart-preview-items::-webkit-scrollbar-thumb { background: #9bcfc4; border-radius: 999px; }
    .cart-preview-items::-webkit-scrollbar-track { background: transparent; }
    .cart-preview-row, .cart-preview-total { display: flex; justify-content: space-between; gap: .75rem; padding: .42rem 0; font-size: .84rem; }
    .cart-preview-row span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .cart-preview-total { margin-top: .35rem; padding-top: .65rem; border-top: 1px solid #dce6e3; font-weight: 800; color: #0f9f87; }
    .cart-preview-empty { color: #6b7280; font-size: .84rem; }
    .momo-number-field { display: grid; gap: .4rem; margin-top: .75rem; color: #192f52; font-weight: 700; }
    .momo-number-field input { width: 100%; box-sizing: border-box; padding: .8rem .9rem; border: 1px solid #cfdad7; border-radius: 9px; font: inherit; color: #192f52; background: #fff; }
    .momo-number-field small { color: #6b7280; font-size: .76rem; font-weight: 400; }

    /* Payment card hover */
    .payment-card { transition: border-color .2s, background .2s, box-shadow .2s; cursor:pointer; }
    .payment-card:hover { box-shadow:0 4px 16px rgba(15,159,135,.12); }
    /* Input focus ripple */
    .address-form input:focus,
    .payment-details input:focus,
    .payment-details select:focus {
      box-shadow: 0 0 0 3px rgba(15,159,135,.15);
      transition: border-color .2s, box-shadow .2s;
    }
  `;
  document.head.appendChild(s);
}

/* ══════════════════════════════════════════════════════════
   ORDER CONFIRMATION PAGE
══════════════════════════════════════════════════════════ */

function initConfirmationPage() {
  const itemsEl = document.getElementById('orderItemsList');
  const order = (() => {
    try { return JSON.parse(localStorage.getItem('medicare_last_order')); } catch { return null; }
  })();
  if (!itemsEl || !order) return;

  const money = value => `GH₵ ${Number(value || 0).toFixed(2)}`;
  const items = Array.isArray(order.items) ? order.items : [];

  itemsEl.innerHTML = items.length ? items.map(item => {
    const price = Number(item.price || 0);
    const qty = Number(item.qty || 0);
    return `<div class="order-item" style="display:flex;align-items:center;gap:.75rem;padding:.75rem 0;border-bottom:1px solid #e6eeec">
      <img src="${item.image || ''}" alt="${item.name || 'Item'}" style="width:56px;height:56px;object-fit:cover;border-radius:8px;background:#f1f4f3" onerror="this.style.display='none'">
      <div style="flex:1;min-width:0"><strong style="display:block;color:#192f52">${item.name || 'Item'}</strong><span style="display:block;color:#6b7280;font-size:.85rem">${money(price)} each × ${qty}</span></div>
      <strong style="color:#0b806e;white-space:nowrap">${money(price * qty)}</strong>
    </div>`;
  }).join('') : '<p class="cart-empty">No order items found.</p>';

  const subtotal = Number(order.subtotal || items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0), 0));
  const deliveryFee = Number(order.deliveryFee || 0);
  const discount = Number(order.discount || 0);
  const total = Number(order.total || subtotal + deliveryFee - discount);
  document.getElementById('cartSubtotal')?.replaceChildren(document.createTextNode(money(subtotal)));
  document.getElementById('deliveryFee')?.replaceChildren(document.createTextNode(money(deliveryFee)));
  document.getElementById('localTax')?.replaceChildren(document.createTextNode(money(discount)));
  document.getElementById('orderTotal')?.replaceChildren(document.createTextNode(money(total)));
  document.getElementById('orderId')?.replaceChildren(document.createTextNode(order.id || '#MED-000000'));
  document.getElementById('orderPlacedDate')?.replaceChildren(document.createTextNode(order.date || new Date().toLocaleString('en-GH')));

  // Calculate estimated delivery date (2-3 business days from now)
  const orderDate = new Date();
  const deliveryDate = new Date(orderDate);
  let businessDays = 0;
  while (businessDays < 3) {
    deliveryDate.setDate(deliveryDate.getDate() + 1);
    const dayOfWeek = deliveryDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Skip weekends
      businessDays++;
    }
  }
  const deliveryDateEl = document.getElementById('deliveryDate');
  if (deliveryDateEl) {
    deliveryDateEl.textContent = deliveryDate.toLocaleDateString('en-GH', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  const delivery = order.delivery || {};
  document.getElementById('recipientName')?.replaceChildren(document.createTextNode(delivery.name || ''));
  document.getElementById('deliveryAddress')?.replaceChildren(document.createTextNode(delivery.address || ''));
  document.getElementById('recipientPhone')?.replaceChildren(document.createTextNode(delivery.phone || ''));

  const paymentEl = document.getElementById('paymentMethod');
  if (paymentEl) {
    const method = order.payment === 'card' ? 'Credit / Debit Card' : 'Mobile Money';
    paymentEl.textContent = order.paymentNumber ? `${method} • ${order.paymentNumber}` : method;
  }
  const agent = order.deliveryPerson || { name: 'Kwame Mensah', image: 'images/delivery-person.jpg' };
  const agentName = document.getElementById('deliveryPersonName');
  const agentImage = document.getElementById('deliveryPersonImage');
  if (agentName) agentName.textContent = agent.name || 'Kwame Mensah';
  if (agentImage && agent.image) agentImage.src = agent.image;
}

function initSmoothHeader() {
  const header = document.querySelector('.site-header');
  if (!header) return;
  const update = () => header.classList.toggle('is-scrolled', window.scrollY > 12);
  window.addEventListener('scroll', update, { passive: true });
  update();
}

/* Toast notification function */
function showToast(message, duration = 3000) {
  // Remove existing toast if any
  const existingToast = document.querySelector('.success-toast');
  if (existingToast) existingToast.remove();

  // Create toast element
  const toast = document.createElement('div');
  toast.className = 'success-toast';
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    top: 100px;
    right: 20px;
    background: var(--teal);
    color: white;
    padding: 16px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 2000;
    animation: slideInRight 0.3s ease-out;
    font-weight: 600;
    max-width: 300px;
  `;

  // Add animation keyframes if not exists
  if (!document.getElementById('toast-animations')) {
    const style = document.createElement('style');
    style.id = 'toast-animations';
    style.textContent = `
      @keyframes slideInRight {
        from { opacity: 0; transform: translateX(100px); }
        to { opacity: 1; transform: translateX(0); }
      }
      @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(toast);

  // Remove after duration
  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.3s ease-out forwards';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/* ══════════════════════════════════════════════════════════
   TRACK ORDER PAGE
══════════════════════════════════════════════════════════ */

function initTrackOrderPage() {
  const trackSearchBtn = document.getElementById('trackSearchBtn');
  const trackOrderIdInput = document.getElementById('trackOrderId');
  const trackResult = document.getElementById('trackResult');
  const trackError = document.getElementById('trackError');

  if (!trackSearchBtn || !trackOrderIdInput) return;

  trackSearchBtn.addEventListener('click', () => {
    const orderId = trackOrderIdInput.value.trim();
    if (!orderId) {
      showToast('Please enter an order ID');
      return;
    }

    // Try to get order from localStorage
    let order = null;
    try {
      const storedOrder = JSON.parse(localStorage.getItem('medicare_last_order'));
      if (storedOrder && storedOrder.id === orderId) {
        order = storedOrder;
      }
    } catch (e) {
      // If no match in last_order, we could search through a history (not implemented)
    }

    if (!order) {
      trackResult.classList.add('hidden');
      trackError.classList.remove('hidden');
      return;
    }

    // Show order details
    trackError.classList.add('hidden');
    trackResult.classList.remove('hidden');

    const money = value => `GH₵ ${Number(value || 0).toFixed(2)}`;

    // Update order info
    document.getElementById('resultOrderId').textContent = order.id;
    document.getElementById('resultOrderDate').textContent = order.date;

    // Update tracking steps (simulate status based on order date)
    const orderDate = new Date(order.date);
    const now = new Date();
    const hoursSinceOrder = (now - orderDate) / (1000 * 60 * 60);

    let currentStep = 'placed';
    if (hoursSinceOrder > 0.5) currentStep = 'payment';
    if (hoursSinceOrder > 2) currentStep = 'processing';
    if (hoursSinceOrder > 24) currentStep = 'shipped';
    if (hoursSinceOrder > 48) currentStep = 'delivered';

    // Update step icons and states
    const steps = ['placed', 'payment', 'processing', 'shipped', 'delivered'];
    const stepOrder = steps.indexOf(currentStep);

    steps.forEach((step, index) => {
      const stepEl = document.querySelector(`.tracking-step[data-step="${step}"]`);
      if (!stepEl) return;

      const iconEl = stepEl.querySelector('.step-icon');
      if (index < stepOrder) {
        // Completed step
        stepEl.classList.add('completed');
        stepEl.classList.remove('active');
        iconEl.textContent = '✓';
      } else if (index === stepOrder) {
        // Current step
        stepEl.classList.add('active');
        stepEl.classList.remove('completed');
        iconEl.textContent = '●';
      } else {
        // Future step
        stepEl.classList.remove('completed', 'active');
        iconEl.textContent = '○';
      }
    });

    // Update step dates
    document.getElementById('stepPlacedDate').textContent = order.date;
    if (stepOrder >= 1) {
      const paymentDate = new Date(orderDate.getTime() + 30 * 60000);
      document.getElementById('stepPaymentDate').textContent = paymentDate.toLocaleString('en-GH');
    }
    if (stepOrder >= 3) {
      const shippedDate = new Date(orderDate.getTime() + 24 * 60 * 60000);
      document.getElementById('stepShippedDate').textContent = shippedDate.toLocaleString('en-GH');
    }
    if (stepOrder >= 4) {
      const deliveredDate = new Date(orderDate.getTime() + 48 * 60 * 60000);
      document.getElementById('stepDeliveredDate').textContent = deliveredDate.toLocaleString('en-GH');
    }

    // Update items
    const itemsEl = document.getElementById('trackItemsList');
    const items = Array.isArray(order.items) ? order.items : [];
    itemsEl.innerHTML = items.length ? items.map(item => {
      const price = Number(item.price || 0);
      const qty = Number(item.qty || 0);
      return `<div class="track-item">
        <span>${item.name} <small>× ${qty}</small></span>
        <strong>${money(price * qty)}</strong>
      </div>`;
    }).join('') : '<p class="cart-empty">No items found.</p>';

    // Update summary
    const subtotal = Number(order.subtotal || items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0), 0));
    const deliveryFee = Number(order.deliveryFee || 0);
    const total = Number(order.total || subtotal + deliveryFee);
    document.getElementById('trackSubtotal').textContent = money(subtotal);
    document.getElementById('trackDeliveryFee').textContent = money(deliveryFee);
    document.getElementById('trackTotal').textContent = money(total);

    // Update delivery info
    const delivery = order.delivery || {};
    document.getElementById('trackRecipientName').textContent = delivery.name || '';
    document.getElementById('trackDeliveryAddress').textContent = delivery.address || '';
    document.getElementById('trackRecipientPhone').textContent = delivery.phone || '';
  });

  // Allow Enter key to trigger search
  trackOrderIdInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      trackSearchBtn.click();
    }
  });
}

/* ══════════════════════════════════════════════════════════
   MEDICINES PAGE
══════════════════════════════════════════════════════════ */

function initMedicinesPage() {
  if (!window.location.pathname.includes('medicines.html')) return;

  const filterButtons = document.querySelectorAll('.filter-btn');
  const productCards = document.querySelectorAll('.product-card');
  const categoryTitle = document.getElementById('categoryTitle');
  const categorySubtitle = document.getElementById('categorySubtitle');
  const urlParams = new URLSearchParams(window.location.search);
  const categoryParam = urlParams.get('category');
  const initialFilter = categoryParam ? categoryParam.toLowerCase().replace(/\s+/g, '-') : 'all';
  window.__activeMedicineFilter = initialFilter;

  function filterProducts(filter) {
    window.__activeMedicineFilter = filter;
    const query = document.getElementById('searchInput')?.value || '';
    if (typeof window.__applyMedicineSearch === 'function') {
      window.__applyMedicineSearch(query);
      return;
    }
    productCards.forEach(card => { card.style.display = filter === 'all' || card.dataset.category === filter ? 'flex' : 'none'; });
  }

  function updateCategoryTitle(filter) {
    const titles = { all: 'All Medicines', prescription: 'Prescription Medicines', otc: 'OTC Drugs', supplements: 'Health Supplements', 'personal-care': 'Personal Care', 'medical-equipment': 'Medical Equipment', 'baby-care': 'Baby Care' };
    const subtitles = { all: 'Browse our complete collection of prescription and over-the-counter medications', prescription: 'Prescription medications requiring pharmacist verification', otc: 'Over-the-counter medications for common health needs', supplements: 'Vitamins, minerals, and dietary supplements', 'personal-care': 'Personal hygiene and wellness products', 'medical-equipment': 'Home medical devices and equipment', 'baby-care': 'Healthcare products for babies and children' };
    if (categoryTitle) categoryTitle.innerHTML = `${titles[filter] || 'All Medicines'} <span class="catalog-count">80+ products</span>`;
    if (categorySubtitle) categorySubtitle.textContent = subtitles[filter] || '';
  }

  filterButtons.forEach(btn => btn.addEventListener('click', () => {
    filterButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const filter = btn.dataset.filter || 'all';
    filterProducts(filter);
    updateCategoryTitle(filter);
  }));

  filterButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.filter === initialFilter));
  filterProducts(initialFilter);
  updateCategoryTitle(initialFilter);
}

/* ══════════════════════════════════════════════════════════
   CATEGORIES PAGE
══════════════════════════════════════════════════════════ */

function initCategoriesPage() {
  if (!window.location.pathname.includes('categories.html')) return;
  
  // Category cards should link to medicines.html with category filter
  document.querySelectorAll('.subcategory-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const categoryName = item.textContent.trim();
      window.location.href = `medicines.html?category=${encodeURIComponent(categoryName)}`;
    });
  });
}

/* ══════════════════════════════════════════════════════════
   BOOTSTRAP
══════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  injectGlobalCSS();

  cart = getCart();
  hydrateCartPricesFromPage();

  updateHeaderAuth();
  updateCartUI();
  initCartPreview();

  initLoginPage();
  initRegisterPage();
  initCountryCodeFlags();
  initAuthModal();
  initModals();
  initSearch();
  initAddToCartButtons();
  initStubLinks();
  initSmoothHeader();
  initCheckoutPage();
  initConfirmationPage();
  initTrackOrderPage();
  initMedicinesPage();
  initCategoriesPage();
});