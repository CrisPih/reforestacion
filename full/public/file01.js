"use strict";

// Importar funciones
import { fetchProducts, fetchCategories } from './functions.js';
import { saveVote, getVotes } from './firebase.js';

// Variables globales
let allProducts = [];
let allCategories = [];

/**
 * Renderiza los productos obtenidos desde la API en el contenedor
 * @description Obtiene productos desde JSON y los muestra en tarjetas
 * @returns {void}
 */
const renderProducts = () => {
  fetchProducts('https://data-dawm.github.io/datum/reseller/products.json')
    .then(result => {
      if (result.success) {
        allProducts = result.body; // Todos los productos
        displayProducts(allProducts.slice(0, 6)); // Mostramos solo 6 inicialmente
        populateVotingSelect(allProducts);  // Llenar select de votación
      } else {
        showError('productos', result.body);
      }
    });
};

/**
 * Muestra los productos en el DOM
 * @param {Array} products - Array de productos a mostrar
 * @returns {void}
 */
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
      <div class="relative h-48 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
        <img src="${product.imgUrl}" alt="${product.title}" class="h-full w-full object-contain">
      </div>
      <div class="p-6">
        <span class="inline-block px-3 py-1 text-xs font-semibold text-blue-600 bg-blue-100 rounded-full dark:bg-blue-900 dark:text-blue-300 mb-2">
          ${product.category}
        </span>
        <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">
          ${product.title.length > 30 ? product.title.substring(0, 30) + '...' : product.title}
        </h3>
        <p class="text-gray-600 dark:text-gray-300 mb-4 text-sm">
          ${product.description || 'Producto de alta calidad para el cuidado dental'}
        </p>
        <div class="flex items-center justify-between">
          <span class="text-2xl font-bold text-blue-600 dark:text-blue-400">$${product.price}</span>
          <a href="${product.productURL}" target="_blank" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium">
            Ver más
          </a>
        </div>
      </div>
    </div>
  `).join('');
};

/**
 * Obtiene un emoji según la categoría del producto
 * @param {string} category - Categoría del producto
 * @returns {string} Emoji correspondiente
 */
const getProductEmoji = (category) => {
  const emojis = {
    'Cepillos': '🪥',
    'Pasta Dental': '🦷',
    'Enjuague': '💧',
    'Hilo Dental': '🧵',
    'Blanqueamiento': '✨',
    'default': '🛒'
  };
  return emojis[category] || emojis.default;
};

/**
 * Renderiza las categorías obtenidas desde XML
 * @description Obtiene categorías desde XML y las muestra en el select
 * @returns {void}
 */
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

        const categoryHTML = `<option value="${name}">${name}</option>`;
        container.innerHTML += categoryHTML;

        allCategories.push({ id, name });
      }
    } else {
      alert('Error al cargar categorías: ' + result.body);
    }
  } catch (error) {
    alert('Error al cargar categorías: ' + error.message);
  }
};

/**
 * Filtra productos por categoría
 * @param {string} categoryName - Nombre de la categoría seleccionada
 * @returns {void}
 */
const filterProducts = (categoryName) => {
  // Si selecciona "Todas las categorías" mostramos todo
  if (!categoryName || categoryName === 'Todas las categorías') {
    displayProducts(allProducts);
    return;
  }

  // Buscamos el ID de la categoría seleccionada
  const category = allCategories.find(cat => cat.name === categoryName);
  if (!category) {
    displayProducts([]); // no encontró la categoría
    return;
  }

  const filtered = allProducts.filter(product => product.category_id.toString() === category.id);
  displayProducts(filtered);
};


/**
 * Llena el select de votación con los productos
 * @param {Array} products - Array de productos
 * @returns {void}
 */
const populateVotingSelect = (products) => {
  const select = document.getElementById('select_product');
  if (!select) return;

  select.innerHTML = '<option value="" disabled selected>Selecciona un producto</option>';

  products.forEach(product => {
    const option = document.createElement('option');
    option.value = product.asin;
    option.textContent = product.title;
    select.appendChild(option);
  });
};

/**
 * Habilita el formulario de votación con input de nombre
 * @returns {void}
 */
const enableForm = () => {
  const form = document.getElementById('form_voting');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const selectProduct = document.getElementById('select_product');
    const productId = selectProduct.value;

    const userNameInput = document.getElementById('user_name');
    const userName = userNameInput ? userNameInput.value.trim() : '';

    if (!productId || !userName) {
      alert('Por favor completa todos los campos.');
      return;
    }

    // Mostrar loading en el botón
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>Enviando...';

    // Guardar voto (puedes usar tu función saveVote)
    saveVote(productId, userName)
      .then(result => {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;

        if (result.success) {
          alert('✅ ' + result.message);
          form.reset();
          displayVotes(); // Actualizar tabla de votos
        } else {
          alert('❌ ' + result.message);
        }
      })
      .catch(err => {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        alert('❌ Error al enviar voto: ' + err.message);
      });
  });
};


/**
 * Muestra los votos en una tabla
 * @description Obtiene y renderiza los votos desde Firebase
 * @returns {void}
 */
const displayVotes = async () => {
  const resultsContainer = document.getElementById('results');
  if (!resultsContainer) return;

  resultsContainer.innerHTML = `
    <div class="text-center py-4">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <p class="mt-2 text-gray-600 dark:text-gray-300">Cargando votos...</p>
    </div>
  `;

  try {
    const result = await getVotes();

    if (result.success && result.data) {
      const votes = result.data;

      // Contar votos por producto
      const voteCounts = {};
      Object.values(votes).forEach(vote => {
        voteCounts[vote.productId] = (voteCounts[vote.productId] || 0) + 1;
      });

      // Obtener nombres de productos
      const productNames = {};
      allProducts.forEach(product => {
        productNames[product.asin] = product.title;
      });

      // Crear tabla
      let tableHTML = `
        <div class="overflow-x-auto">
          <table class="w-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg">
            <thead class="bg-blue-600 text-white">
              <tr>
                <th class="px-6 py-4 text-left font-semibold">Producto</th>
                <th class="px-6 py-4 text-center font-semibold">Total de Votos</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
      `;

      if (Object.keys(voteCounts).length === 0) {
        tableHTML += `
          <tr>
            <td colspan="2" class="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
              No hay votos registrados aún. ¡Sé el primero en votar!
            </td>
          </tr>
        `;
      } else {
        // Ordenar por cantidad de votos
        const sortedVotes = Object.entries(voteCounts).sort((a, b) => b[1] - a[1]);

        sortedVotes.forEach(([productId, count], index) => {
          const productName = productNames[productId] || `Producto ${productId}`;
          const medalEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';

          tableHTML += `
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
              <td class="px-6 py-4 text-gray-900 dark:text-white">
                ${medalEmoji} ${productName}
              </td>
              <td class="px-6 py-4 text-center">
                <span class="inline-flex items-center justify-center px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full font-bold">
                  ${count}
                </span>
              </td>
            </tr>
          `;
        });
      }

      tableHTML += `
            </tbody>
          </table>
        </div>
      `;

      resultsContainer.innerHTML = tableHTML;
    } else {
      resultsContainer.innerHTML = `
        <div class="text-center py-8 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <p class="text-yellow-800 dark:text-yellow-200">⚠️ ${result.message || 'No hay votos disponibles'}</p>
        </div>
      `;
    }
  } catch (error) {
    resultsContainer.innerHTML = `
      <div class="text-center py-8 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
        <p class="text-red-800 dark:text-red-200">❌ Error al cargar votos: ${error.message}</p>
      </div>
    `;
  }
};

/**
 * Muestra la notificación toast
 * @description Hace visible el elemento toast
 * @returns {void}
 */
const showToast = () => {
  const toast = document.getElementById('toast-interactive');
  if (toast) {
    toast.classList.remove('hidden');
  }
};

/**
 * Oculta la notificación toast
 * @description Oculta el elemento toast
 * @returns {void}
 */
const hideToast = () => {
  const toast = document.getElementById('toast-interactive');
  if (toast) {
    toast.classList.add('hidden');
  }
};

/**
 * Configura el botón "Ver demo" para abrir video
 * @description Agrega evento click al botón demo
 * @returns {void}
 */
const showVideo = () => {
  const demoBtn = document.getElementById('demo');
  if (demoBtn) {
    demoBtn.addEventListener('click', () => {
      window.open('https://www.youtube.com/watch?v=dQw4w9WgXcQ', '_blank');
    });
  }
};

/**
 * Muestra un mensaje de error
 * @param {string} type - Tipo de error
 * @param {string} message - Mensaje de error
 * @returns {void}
 */
const showError = (type, message) => {
  const container = document.getElementById('products-container');
  container.innerHTML = `
    <div class="col-span-full text-center py-8">
      <div class="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-6 inline-block">
        <svg class="w-12 h-12 text-red-600 dark:text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <p class="text-red-800 dark:text-red-300 font-semibold">Error al cargar ${type}</p>
        <p class="text-red-600 dark:text-red-400 text-sm mt-2">${message}</p>
      </div>
    </div>
  `;
};

// ========== FUNCIÓN DE AUTOEJECUCIÓN ==========
(() => {
  console.log('🦷 Bienvenido a Consultorio Dental Arrobo');

  fetchProducts('https://data-dawm.github.io/datum/reseller/products.json')
    .then(result => {
      if (result.success) {
        console.log(result.body); // mira esto en la consola del navegador
      } else {
        console.error('Error cargando productos:', result.body);
      }
    });

  // Cargar productos y categorías
  renderProducts();
  renderCategories();

  // Configurar eventos
  showVideo();
  enableForm();
  displayVotes();

  // Mostrar toast después de 3 segundos
  setTimeout(showToast, 3000);

  // Event listener para filtro de categorías
  const categoriesSelect = document.getElementById('categories');
  if (categoriesSelect) {
    categoriesSelect.addEventListener('change', (e) => {
      filterProducts(e.target.value);
    });
  }

  // Event listener para cerrar toast
  const toastCloseBtn = document.querySelector('[data-dismiss-target="#toast-interactive"]');
  if (toastCloseBtn) {
    toastCloseBtn.addEventListener('click', hideToast);
  }
})();