"use strict";

/**
 * Realiza una petición HTTP GET para obtener productos en formato JSON
 * @param {string} url - URL del endpoint que devuelve los productos
 * @returns {Promise<{success: boolean, body: any}>}
 */
const fetchProducts = (url) => {
  return fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      return { success: true, body: data };
    })
    .catch(error => {
      console.error('Error fetching products:', error);
      return { success: false, body: error.message };
    });
};

/**
 * Realiza una petición HTTP GET para obtener categorías en formato XML
 * @param {string} url - URL del endpoint que devuelve las categorías
 * @returns {Promise<{success: boolean, body: any}>}
 */
const fetchCategories = async (url) => {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const text = await response.text();
    const parser = new DOMParser();
    const data = parser.parseFromString(text, "application/xml");

    return { success: true, body: data };
  } catch (error) {
    console.error('Error fetching categories:', error);
    return { success: false, body: error.message };
  }
};

/**
 * Obtiene el catálogo de especies de árboles (JSON)
 * @param {string} url
 * @returns {Promise<{success: boolean, body: any}>}
 */
const fetchSpecies = (url) => {
  return fetch(url)
    .then(response => {
      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
      return response.json();
    })
    .then(data => ({ success: true, body: data }))
    .catch(error => ({ success: false, body: error.message }));
};

// 👇 SOLO ESTA LÍNEA DE EXPORT
export { fetchProducts, fetchCategories, fetchSpecies };
