"use strict";

// Importar funciones
import { fetchProducts, fetchCategories } from './functions.js';
import { saveVote, getVotes } from './firebase.js';

// Variables globales
let allProducts = [];
let allCategories = [];

/* =============================
   CARRUSEL DE DIAGNÓSTICO
============================= */

/**
 * Carrusel simple para la sección Diagnóstico
 */
const setupDiagnosticoCarousel = () => {
  const root = document.getElementById('diagnostico-carousel');
  if (!root) return;

  const slides = root.querySelectorAll('.carousel-slide');
  const dots = root.querySelectorAll('.carousel-dot');
  const prevBtn = document.getElementById('diagnostico-prev');
  const nextBtn = document.getElementById('diagnostico-next');

  if (!slides.length) return;
  let current = 0;
  let intervalId = null;

  const showSlide = (idx) => {
    slides.forEach((slide, i) => {
      slide.classList.toggle('opacity-100', i === idx);
      slide.classList.toggle('opacity-0', i !== idx);
      slide.style.zIndex = i === idx ? '10' : '0';
    });
    dots.forEach((dot, i) => {
      dot.classList.toggle('bg-emerald-600', i === idx);
      dot.classList.toggle('bg-white/70', i !== idx);
    });
    current = idx;
  };

  const next = () => showSlide((current + 1) % slides.length);
  const prev = () => showSlide((current - 1 + slides.length) % slides.length);

  nextBtn?.addEventListener('click', () => {
    next();
    restartAuto();
  });
  prevBtn?.addEventListener('click', () => {
    prev();
    restartAuto();
  });

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      showSlide(i);
      restartAuto();
    });
  });

  const startAuto = () => {
    intervalId = setInterval(next, 8000);
  };
  const restartAuto = () => {
    if (intervalId) clearInterval(intervalId);
    startAuto();
  };

  showSlide(0);
  startAuto();
};

/* ======================================
   PRODUCTOS — JSON / CATEGORÍAS XML
====================================== */

const renderProducts = () => {
  fetchProducts('https://data-dawm.github.io/datum/reseller/products.json')
    .then(result => {
      if (result.success) {
        allProducts = result.body;
        displayProducts(allProducts.slice(0, 6));
        populateVotingSelect(allProducts);
      } else {
        showError('productos', result.body);
      }
    });
};

const displayProducts = (products) => {
  const container = document.getElementById('products-container');

  if (products.length === 0) {
    container.innerHTML = `
      <div class="col-span-full text-center py-8">
        <p class="text-gray-600 dark:text-gray-300">No se encontraron productos para esta categoría.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = products.map(product => `
    <div class="bg-white dark:bg-gray-900 rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-gray-200 dark:border-gray-700">
      <div class="relative h-48 bg-gradient-to-br from-green-100 to-green-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
        <img src="${product.imgUrl}" alt="${product.title}" class="h-full w-full object-contain">
      </div>
      <div class="p-6">
        <span class="inline-block px-3 py-1 text-xs font-semibold text-green-600 bg-green-100 rounded-full dark:bg-green-900 dark:text-green-300 mb-2">
          ${product.category}
        </span>
        <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">
          ${product.title.length > 30 ? product.title.substring(0, 30) + '...' : product.title}
        </h3>
        <p class="text-gray-600 dark:text-gray-300 mb-4 text-sm">
          ${product.description || 'Producto eco-amigable para reforestación y conservación'}
        </p>
        <div class="flex items-center justify-between">
          <span class="text-2xl font-bold text-green-600 dark:text-green-400">$${product.price}</span>
          <a href="${product.productURL}" target="_blank" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium">
            Ver más
          </a>
        </div>
      </div>
    </div>
  `).join('');
};

const renderCategories = async () => {
  try {
    const result = await fetchCategories('https://data-dawm.github.io/datum/reseller/categories.xml');

    if (result.success) {
      const container = document.getElementById('categories');
      container.innerHTML = `<option value="" selected>Todas las categorías</option>`;

      const categoriesXML = result.body;
      const categories = categoriesXML.getElementsByTagName('category');

      for (let category of categories) {
        const id = category.getElementsByTagName('id')[0].textContent;
        const name = category.getElementsByTagName('name')[0].textContent;

        container.innerHTML += `<option value="${name}">${name}</option>`;
        allCategories.push({ id, name });
      }
    } else {
      alert('Error al cargar categorías: ' + result.body);
    }
  } catch (error) {
    alert('Error al cargar categorías: ' + error.message);
  }
};

const filterProducts = (categoryName) => {
  if (!categoryName || categoryName === 'Todas las categorías') {
    displayProducts(allProducts);
    return;
  }

  const category = allCategories.find(cat => cat.name === categoryName);
  if (!category) {
    displayProducts([]);
    return;
  }

  const filtered = allProducts.filter(product => product.category_id.toString() === category.id);
  displayProducts(filtered);
};

/* ============================
   VOTACIONES Firebase
============================ */

const populateVotingSelect = (products) => {
  const select = document.getElementById('select_product');
  if (!select) return;

  select.innerHTML = '<option value="" disabled selected>Selecciona una especie</option>';

  products.forEach(product => {
    const option = document.createElement('option');
    option.value = product.asin;
    option.textContent = product.title;
    select.appendChild(option);
  });
};

const enableForm = () => {
  const form = document.getElementById('form_voting');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const productId = document.getElementById('select_product').value;
    const userName = document.getElementById('user_name').value.trim();

    if (!productId || !userName) {
      alert('Por favor completa todos los campos.');
      return;
    }

    const btn = form.querySelector('button[type="submit"]');
    const oldText = btn.textContent;

    btn.disabled = true;
    btn.innerHTML = '<span class="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>Enviando...';

    saveVote(productId, userName)
      .then(result => {
        btn.disabled = false;
        btn.textContent = oldText;

        if (result.success) {
          // Ya no usamos alert, solo toast
          form.reset();
          displayVotes();
          showToast(); // mostrar "¡Voto registrado!" solo aquí
        } else {
          alert('❌ ' + result.message);
        }
      })
      .catch(err => {
        btn.disabled = false;
        btn.textContent = oldText;
        alert('❌ Error: ' + err.message);
      });
  });
};

const displayVotes = async () => {
  const container = document.getElementById('results');
  if (!container) return;

  container.innerHTML = `
    <div class="text-center py-4">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      <p class="mt-2 text-gray-600 dark:text-gray-300">Cargando votos...</p>
    </div>
  `;

  try {
    const result = await getVotes();

    if (result.success && result.data) {
      const votes = result.data;
      const voteCounts = {};

      Object.values(votes).forEach(vote => {
        voteCounts[vote.productId] = (voteCounts[vote.productId] || 0) + 1;
      });

      const productNames = {};
      allProducts.forEach(p => {
        productNames[p.asin] = p.title;
      });

      let html = `
        <div class="overflow-x-auto">
          <table class="w-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg">
            <thead class="bg-green-600 text-white">
              <tr>
                <th class="px-6 py-4 text-left font-semibold">Especie</th>
                <th class="px-6 py-4 text-center font-semibold">Total de votos</th>
              </tr>
            </thead>
            <tbody>
      `;

      const sorted = Object.entries(voteCounts).sort((a, b) => b[1] - a[1]);

      if (sorted.length === 0) {
        html += `
          <tr>
            <td colspan="2" class="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
              No hay votos registrados aún. ¡Sé la primera persona en votar!
            </td>
          </tr>
        `;
      } else {
        sorted.forEach(([id, total], i) => {
          const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '';
          html += `
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
              <td class="px-6 py-4">${medal} ${productNames[id] || id}</td>
              <td class="px-6 py-4 text-center">${total}</td>
            </tr>
          `;
        });
      }

      html += `
            </tbody>
          </table>
        </div>
      `;

      container.innerHTML = html;
    }
  } catch (err) {
    container.innerHTML = `
      <div class="text-center py-8 text-red-600">❌ Error: ${err.message}</div>
    `;
  }
};

/* =======================
   TOAST / VIDEO / ERRORES
======================== */

const showToast = () => {
  const toast = document.getElementById('toast-interactive');
  if (toast) toast.classList.remove('hidden');
};

const hideToast = () => {
  const toast = document.getElementById('toast-interactive');
  if (toast) toast.classList.add('hidden');
};

const showVideo = () => {
  const btn = document.getElementById('demo');
  if (btn) {
    btn.addEventListener('click', () => {
      window.open('https://www.youtube.com/watch?v=dQw4w9WgXcQ', '_blank');
    });
  }
};

const showError = (type, message) => {
  const container = document.getElementById('products-container');
  container.innerHTML = `
    <div class="col-span-full text-center py-8">
      <div class="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-6 inline-block">
        <p class="text-red-800 dark:text-red-300 font-semibold">Error al cargar ${type}</p>
        <p class="text-red-600 dark:text-red-400 text-sm mt-2">${message}</p>
      </div>
    </div>
  `;
};

/* =======================
   POP-UP NEWSLETTER
======================== */

const setupNewsletter = () => {
  const modal = document.getElementById('newsletter-modal');
  const openBtn = document.getElementById('newsletter-open');
  const closeBtn = document.getElementById('newsletter-close');
  const input = document.getElementById('newsletter-input');
  const btn = document.getElementById('newsletter-btn');
  const msg = document.getElementById('newsletter-msg');

  if (!modal || !input || !btn || !msg) return;

  const open = () => {
    modal.classList.remove('hidden');
    input.focus();
  };

  const close = () => {
    modal.classList.add('hidden');
    msg.classList.add('hidden');
    msg.textContent = '';
    input.value = '';
  };

  openBtn?.addEventListener('click', open);
  closeBtn?.addEventListener('click', close);

  // cerrar al hacer clic fuera de la tarjeta
  modal.addEventListener('click', (e) => {
    if (e.target === modal) close();
  });

  btn.addEventListener('click', async () => {
    const email = input.value.trim();

    if (!email) {
      msg.textContent = 'Por favor ingresa un correo válido.';
      msg.classList.remove('hidden');
      msg.classList.remove('text-green-300');
      msg.classList.add('text-red-300');
      return;
    }

    try {
      // Ejemplo de POST (no guarda realmente, solo para la demo / rúbrica)
      await fetch('https://jsonplaceholder.typicode.com/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      msg.textContent = '¡Gracias por suscribirte!';
      msg.classList.remove('hidden');
      msg.classList.remove('text-red-300');
      msg.classList.add('text-green-300');
    } catch (error) {
      msg.textContent = 'No se pudo completar la suscripción.';
      msg.classList.remove('hidden');
      msg.classList.remove('text-green-300');
      msg.classList.add('text-red-300');
    }
  });
};

/* ===================
   AUTOEJECUCIÓN
=================== */

(() => {
  console.log('🌳 Bienvenido a Reforestación Ecuador');

  renderProducts();
  renderCategories();

  enableForm();
  displayVotes();
  showVideo();
  setupDiagnosticoCarousel();
  setupNewsletter();

  const categoriesSelect = document.getElementById('categories');
  categoriesSelect?.addEventListener('change', e => filterProducts(e.target.value));

  const toastCloseBtn = document.querySelector('[data-dismiss-target="#toast-interactive"]');
  toastCloseBtn?.addEventListener('click', hideToast);
})();
