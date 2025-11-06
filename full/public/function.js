// js/function.js
import { saveRegistration, getRegistrations, getProducts, saveSubscriber } from './firebase.js';

/**
 * Fallback localStorage helpers (para desarrollo si no hay Firebase)
 */
const localGet = async (key) => {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
};
const localPost = async (key, payload) => {
  const current = await localGet(key);
  current.push(payload);
  localStorage.setItem(key, JSON.stringify(current));
  return { ok: true };
};

/**
 * Carga productos y los renderiza en #products-container
 */
async function loadProducts() {
  const container = document.getElementById('products-container');
  if (!container) return;
  container.innerHTML = `<div class="col-span-full text-center py-8"><div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-700"></div><p class="mt-4 text-gray-600">Cargando productos...</p></div>`;

  try {
    let productsObj = {};
    try {
      const res = await getProducts();
      productsObj = res.data || {};
    } catch (err) {
      // fallback local
      const local = await localGet('sf_products');
      if (Array.isArray(local) && local.length) {
        // convert array to object with index keys
        productsObj = Object.fromEntries(local.map((p, i) => [i, p]));
      } else productsObj = {};
    }

    const items = Object.entries(productsObj);
    if (!items.length) {
      container.innerHTML = `<div class="col-span-full text-center py-8"><p class="text-gray-600">No hay productos disponibles aún.</p></div>`;
      return;
    }

    container.innerHTML = '';
    items.forEach(([id, p]) => {
      const card = document.createElement('div');
      card.className = 'bg-white p-4 rounded-xl shadow';
      card.innerHTML = `
        <img src="${p.image||'https://placehold.co/400x300/90ee90/ffffff?text=Producto'}" alt="${p.name||'Producto'}" class="w-full h-40 object-cover rounded-md mb-3">
        <h4 class="font-bold text-lg mb-1">${p.name || 'Sin nombre'}</h4>
        <p class="text-sm text-gray-600 mb-3">${p.description || ''}</p>
        <div class="flex items-center justify-between">
          <span class="font-semibold">${p.price ? 'USD ' + p.price : ''}</span>
          <button data-id="${id}" class="px-3 py-1 rounded bg-emerald-700 text-white text-sm">Ver</button>
        </div>
      `;
      container.appendChild(card);
    });
  } catch (err) {
    container.innerHTML = `<div class="col-span-full text-center py-8"><p class="text-red-600">Error cargando productos.</p></div>`;
    console.error(err);
  }
}

/**
 * Actualiza el contador de registros leyendo la BD o fallback local
 */
async function updateRegistroCount() {
  const el = document.getElementById('registro-count');
  if (!el) return;
  try {
    let count = 0;
    try {
      const res = await getRegistrations();
      count = Object.keys(res.data || {}).length;
    } catch (err) {
      // fallback
      const local = await localGet('sf_registros');
      count = Array.isArray(local) ? local.length : 0;
    }
    el.textContent = count;
  } catch (err) {
    console.error(err);
  }
}

/**
 * Alpine-compatible registrationForm (cuando usas x-data="registrationForm()")
 * Nota: exponemos esta función en window para que Alpine la encuentre.
 */
export function registrationForm() {
  return {
    form: { nombre:'', apellido:'', email:'', telefono:'', tipo:'', acepta:false },
    sent: false,
    error: false,
    validate() {
      const { nombre, apellido, email, tipo } = this.form;
      if (!nombre.trim() || !apellido.trim()) return false;
      if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return false;
      if (!tipo) return false;
      return true;
    },
    async submit() {
      this.error = false;
      if (!this.validate()) { this.error = true; return; }

      const payload = { ...this.form, fecha: new Date().toISOString() };

      try {
        await saveRegistration(payload);
      } catch (err) {
        // fallback local
        await localPost('sf_registros', payload);
      }

      // actualizar contador
      await updateRegistroCount();

      this.sent = true;
      setTimeout(()=>{ this.reset(); this.sent = false; }, 1800);
    },
    reset() { this.form = { nombre:'', apellido:'', email:'', telefono:'', tipo:'', acepta:false }; this.error=false; }
  }
}

// Hacemos accesible la función para Alpine (Alpine buscaría global registrationForm)
window.registrationForm = registrationForm;

// Newsletter subscribe handler (usado por el footer)
async function handleNewsletterSubscribe() {
  const input = document.getElementById('newsletter-input');
  const btn = document.getElementById('newsletter-btn');
  const msg = document.getElementById('newsletter-msg');
  if (!input || !btn) return;
  btn.addEventListener('click', async () => {
    const email = input.value?.trim();
    msg.classList.add('hidden');
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      msg.textContent = 'Correo inválido';
      msg.classList.remove('hidden');
      msg.classList.remove('text-white'); msg.classList.add('text-red-300');
      return;
    }
    btn.disabled = true;
    btn.textContent = 'Enviando...';
    try {
      await saveSubscriber(email);
      msg.textContent = 'Gracias por suscribirte';
      msg.classList.remove('hidden');
      msg.classList.remove('text-red-300'); msg.classList.add('text-white');
      input.value = '';
    } catch (err) {
      // fallback local
      await localPost('sf_subscribers', { email, fecha: new Date().toISOString() });
      msg.textContent = 'Gracias (guardado localmente)';
      msg.classList.remove('hidden');
      msg.classList.remove('text-red-300'); msg.classList.add('text-white');
      input.value = '';
    } finally {
      btn.disabled = false;
      btn.textContent = 'Suscribirme';
      setTimeout(()=>msg.classList.add('hidden'), 2500);
    }
  });
}

// Autoinicio al cargar la página
document.addEventListener('DOMContentLoaded', () => {
  loadProducts();
  updateRegistroCount();
  handleNewsletterSubscribe();
});
