// Importaciones
import { DynamicPagination } from "../../../Shared/Script/DynamicPagination.js";
import { obtenerTotalReport } from "../services/countReportsServices.js";

// Configuración
const ITEMS_PER_PAGE = 10;


export function initializeReportPagination(containerId) {
  const container = document.getElementById(containerId);
  
  if (!container) {
    console.error(`Contenedor con ID ${containerId} no encontrado`);
    return;
  }

  // Estado
  let currentPage = 1;
  let totalPages = 1;

  // Inicialización
  const init = async () => {
    try {
      const totalItems = await obtenerTotalReport();
      currentPage = getCurrentPage();
      totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
      
      renderPagination();
      setupEventListeners();
      
    } catch (error) {
      console.error("Error inicializando paginación:", error);
      renderErrorState();
    }
  };

  // Helper functions
  const getCurrentPage = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return parseInt(urlParams.get('page')) || 1;
  };

  const renderPagination = () => {
    container.innerHTML = `
      <dynamic-pagination 
        total-pages="${totalPages}" 
        current-page="${currentPage}"
      ></dynamic-pagination>
    `;
  };

  const setupEventListeners = () => {
    container.addEventListener('page-changed', (event) => {
      handlePageChange(event.detail);
    });
  };

  const handlePageChange = (newPage) => {
    currentPage = newPage;
    updateUrl();
    // Aquí puedes llamar a una función para cargar los datos de la nueva página
    // loadPageData(newPage);
  };

  const updateUrl = () => {
    const url = new URL(window.location);
    url.searchParams.set('page', currentPage);
    window.history.pushState({}, '', url);
  };

  const renderErrorState = () => {
    container.innerHTML = `
      <dynamic-pagination
        total-pages="1"
        current-page="1"
      ></dynamic-pagination>
      <p class="error-message">Error cargando paginación</p>
    `;
  };

  // Iniciar
  init();

  // Retornar API pública si es necesario
  return {
    refresh: init,
    getCurrentPage: () => currentPage,
    getTotalPages: () => totalPages
  };
}