document.addEventListener('DOMContentLoaded', () => {
  const noticesPanel = document.getElementById('notices-panel');
  const showNoticesBtn = document.getElementById('show-notices-btn');
  const closeNoticesBtn = document.getElementById('close-notices-btn');
  const noticesList = document.querySelector('.notices-list');
  const tabButtons = document.querySelectorAll('.tab-button');

  let avisos = [];
  let filtroActual = 'todos'; // Mantener registro del filtro actual

  // --- Mostrar / Ocultar el panel ---
  if (noticesPanel && showNoticesBtn && closeNoticesBtn) {
    const openNotices = () => noticesPanel.classList.add('is-visible');
    const closeNotices = () => noticesPanel.classList.remove('is-visible');

    showNoticesBtn.addEventListener('click', openNotices);
    closeNoticesBtn.addEventListener('click', closeNotices);

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && noticesPanel.classList.contains('is-visible')) closeNotices();
    });
  }

  // --- Función para obtener la URL según el filtro ---
  function obtenerUrlPorFiltro(filtro) {
    switch (filtro) {
      case 'recientes':
      case 'actuales':
        return 'http://107.22.248.129:7001/avisos/ultimos7dias';
      case 'pasados':
        return 'http://107.22.248.129:7001/avisos/mayores7dias';
      default:
        return 'http://107.22.248.129:7001/mensajes-admin';
    }
  }

  // --- Cargar avisos desde el backend ---
  function cargarAvisos(filtro = 'todos') {
    const url = obtenerUrlPorFiltro(filtro);
    
    // Mostrar indicador de carga
    noticesList.innerHTML = '<div class="text-center"><i class="fa-solid fa-spinner fa-spin"></i> Cargando avisos...</div>';
    
    fetch(url)
      .then(res => {
        if (!res.ok) {
          throw new Error(`Error ${res.status}: ${res.statusText}`);
        }
        return res.json();
      })
      .then(data => {
        console.log(`AVISOS ${filtro.toUpperCase()} RECIBIDOS:`, data.map(a => a.id));
        avisos = data;
        filtroActual = filtro;
        mostrarAvisos(data);
        activarModalLeerMas();
      })
      .catch(err => {
        console.error(`Error al cargar avisos (${filtro}):`, err);
        mostrarErrorCarga(err.message);
      });
  }

  // --- Mostrar error de carga ---
  function mostrarErrorCarga(mensaje) {
    noticesList.innerHTML = `
      <div class="text-center text-danger">
        <i class="fa-solid fa-exclamation-triangle"></i>
        <p>Error al cargar los avisos: ${mensaje}</p>
        <button class="btn btn-sm btn-outline-primary" onclick="location.reload()">
          <i class="fa-solid fa-refresh"></i> Reintentar
        </button>
      </div>
    `;
  }

  // --- Mostrar avisos en la interfaz ---
  function mostrarAvisos(avisosData) {
    noticesList.innerHTML = ''; // Limpiar lista

    if (!avisosData || avisosData.length === 0) {
      const mensajeSinDatos = obtenerMensajeSinDatos(filtroActual);
      noticesList.innerHTML = `<p class="text-center text-muted">${mensajeSinDatos}</p>`;
      return;
    }

    // Ordenar por ID descendente (más reciente primero)
    const avisosOrdenados = [...avisosData].sort((a, b) => {
      const idA = Number(a.id) || 0;
      const idB = Number(b.id) || 0;
      return idB - idA;
    });

    avisosOrdenados.forEach(aviso => {
      const descripcion = aviso.contenido || 'Sin descripción';
      const autor = aviso.autor || 'Administrador';
      const titulo = aviso.titulo || 'Sin título';
      const fecha = formatearFecha(aviso.fecha);
      const id = aviso.id || '?';

      const avisoHTML = `
        <article class="notice-item" data-id="${id}">
          <div class="notice-title">
            <h4><i class="fa-solid fa-user-shield"></i> ${autor}</h4>
          </div>
          <h5>${titulo}</h5>
          <p>
            ${recortarTexto(descripcion)} 
            <a href="#" class="leer-mas-link" 
               data-titulo="${encodeURIComponent(titulo)}" 
               data-contenido="${encodeURIComponent(descripcion)}"
               data-autor="${encodeURIComponent(autor)}"
               data-fecha="${fecha}">Leer más</a>
          </p>
          <time>${fecha}</time>
        </article>
      `;

      noticesList.insertAdjacentHTML('beforeend', avisoHTML);
    });

    activarModalLeerMas();
  }

  // --- Obtener mensaje cuando no hay datos ---
  function obtenerMensajeSinDatos(filtro) {
    switch (filtro) {
      case 'recientes':
      case 'actuales':
        return 'No hay avisos recientes (últimos 7 días).';
      case 'pasados':
        return 'No hay avisos pasados (anteriores a 7 días).';
      default:
        return 'No hay avisos disponibles.';
    }
  }

  // --- Manejo de pestañas ---
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      // Remover clase activa de todos los botones
      tabButtons.forEach(b => b.classList.remove('active'));
      
      // Agregar clase activa al botón clickeado
      btn.classList.add('active');
      
      // Obtener el filtro basado en el texto del botón
      const textoBoton = btn.textContent.toLowerCase().trim();
      let filtro;
      
      switch (textoBoton) {
        case 'actuales':
          filtro = 'recientes'; // Mapear "actuales" a "recientes" para el endpoint
          break;
        case 'pasados':
          filtro = 'pasados';
          break;
        default:
          filtro = 'todos';
      }
      
      // Cargar avisos con el nuevo filtro
      cargarAvisos(filtro);
    });
  });

  // --- Funciones utilitarias ---
  function recortarTexto(texto, limite = 50) {
    if (typeof texto !== 'string') return 'Descripción no disponible';
    return texto.length > limite ? texto.slice(0, limite) + '...' : texto;
  }

  function formatearFecha(fecha) {
    if (!fecha) return 'Fecha no disponible';
    const opciones = { day: 'numeric', month: 'short', year: 'numeric' };
    const fechaObj = new Date(fecha);
    return isNaN(fechaObj) ? 'Fecha no válida' : fechaObj.toLocaleDateString('es-MX', opciones);
  }

  // --- Modal "Leer más" ---
  function activarModalLeerMas() {
    // Crear el modal solo si no existe
    if (!document.getElementById('modal-leer-mas')) {
      const modal = document.createElement('div');
      modal.id = 'modal-leer-mas';
      modal.className = 'modal-overlay';
      Object.assign(modal.style, {
        display: 'none',
        position: 'fixed',
        top: 0, left: 0, width: '100%', height: '100%',
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: '9999',
      });

      modal.innerHTML = `
        <div class="modal-content" style="margin: auto; max-width: 600px; margin-top: 5rem; background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); max-height: 80vh; overflow-y: auto;">
          <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid #eee;">
            <h3 id="modal-titulo" style="margin: 0; color: #333;"></h3>
            <button id="cerrar-modal-leer-mas" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #666; padding: 0; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;">&times;</button>
          </div>
          <div class="modal-body">
            <div class="modal-meta" style="margin-bottom: 1rem; color: #666; font-size: 0.9rem;">
              <span id="modal-autor" style="font-weight: 500;"></span> • 
              <span id="modal-fecha"></span>
            </div>
            <p id="modal-descripcion" style="white-space: pre-line; line-height: 1.6; color: #333;"></p>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      // Event listeners para cerrar modal
      document.getElementById('cerrar-modal-leer-mas').addEventListener('click', () => {
        modal.style.display = 'none';
      });

      modal.addEventListener('click', e => {
        if (e.target === modal) modal.style.display = 'none';
      });

      // Cerrar con Escape
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && modal.style.display === 'flex') {
          modal.style.display = 'none';
        }
      });
    }

    // Eliminar listeners antiguos para evitar duplicados
    document.querySelectorAll('.leer-mas-link').forEach(link => {
      link.removeEventListener('click', abrirModal);
      link.addEventListener('click', abrirModal);
    });

    // Función para abrir modal
    function abrirModal(e) {
      e.preventDefault();
      const link = e.currentTarget;
      const titulo = decodeURIComponent(link.dataset.titulo || '');
      const contenido = decodeURIComponent(link.dataset.contenido || '');
      const autor = decodeURIComponent(link.dataset.autor || 'Administrador');
      const fecha = link.dataset.fecha || '';
      const modal = document.getElementById('modal-leer-mas');

      document.getElementById('modal-titulo').textContent = titulo;
      document.getElementById('modal-descripcion').textContent = contenido;
      document.getElementById('modal-autor').textContent = autor;
      document.getElementById('modal-fecha').textContent = fecha;
      modal.style.display = 'flex';
    }
  }

  // --- Cargar avisos iniciales ---
  cargarAvisos('todos');

  // --- Función pública para recargar avisos (útil para actualizaciones) ---
  window.recargarAvisos = function() {
    cargarAvisos(filtroActual);
  };
});