document.addEventListener('DOMContentLoaded', async () => {
  const clearFiltersBtn = document.getElementById('limpiarFiltros');   
  const tablaContenedor = document.getElementById('report-table');
  const paginacionComponent = document.querySelector('dynamic-pagination');
  const idUsuario = localStorage.getItem('id_usuario');
  const LIMIT = 9;

  if (!idUsuario) {
    tablaContenedor.innerHTML = '<p>Por favor inicia sesión para ver tus reportes.</p>';
    return;
  }

  let secciones = {};
  let usuarios = {};
  let ubicaciones = {};
  let calles = {};
  let totalReportes = 0;

  // Variables de filtro
  let filtroActivo = null; // "estado" o "tipo"
  let valorFiltro = null;
  let paginaActual = 1;
  const reportesPorPagina = LIMIT;

  const estados = { 1: 'Pendiente', 2: 'Resuelto', 3: 'En proceso' };
  const clasesEstado = {
    'Pendiente': 'status-pendiente',
    'Resuelto': 'status-resuelto',
    'En proceso': 'status-en-proceso',
  };
  const tipos = {
    1: "Ruido excesivo",
    2: "Problema de alcohol",
    3: "Basura",
    4: "Asalto",
    5: "Alumbrado Público",
    6: "Fuga de agua",
    7: "Drenaje tapado"
  };
  const urgencias = {
    1: { texto: "Alta", clase: "urgency-alta" },
    2: { texto: "Media", clase: "urgency-media" },
    3: { texto: "Baja", clase: "urgency-baja" }
  };
  const urgenciaPorTipo = {
    1: 2, 2: 2, 3: 3, 4: 1, 5: 2, 6: 1, 7: 1
  };

  function inicializarFiltros() {
    const filterToggle = document.getElementById('filter-toggle');
    const filterDropdown = document.getElementById('filter-dropdown');
    
    if (!filterToggle || !filterDropdown) {
      console.error('Elementos de filtro no encontrados');
      return;
    }

    // Toggle del dropdown principal - evento en todo el contenedor
    filterToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      filterDropdown.classList.toggle('show');
    });

    // Cerrar dropdown al hacer click fuera
    document.addEventListener('click', (e) => {
      if (!filterToggle.contains(e.target) && !filterDropdown.contains(e.target)) {
        filterDropdown.classList.remove('show');
        // Cerrar todos los submenus
        document.querySelectorAll('.submenu').forEach(submenu => {
          submenu.style.display = 'none';
        });
      }
    });

    // Manejo de submenus - evento en todo el elemento has-submenu
    document.querySelectorAll('.dropdown-item.has-submenu').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const submenu = item.querySelector('.submenu');
        
        // Cerrar otros submenus
        document.querySelectorAll('.submenu').forEach(menu => {
          if (menu !== submenu) {
            menu.style.display = 'none';
          }
        });
        
        // Toggle del submenu actual
        submenu.style.display = submenu.style.display === 'block' ? 'none' : 'block';
      });
    });

    // Manejo de clicks en filtros
    document.querySelectorAll('.submenu-item').forEach(item => {
      item.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const valorSeleccionado = item.getAttribute('href');
        const textoSeleccionado = item.textContent.trim();
        
        // Determinar tipo de filtro basado en el submenu padre
        const submenuParent = item.closest('.dropdown-item');
        const tipoFiltro = submenuParent.querySelector('span').textContent.toLowerCase().includes('estado') ? 'estado' : 'tipo';
        
        await aplicarFiltro(tipoFiltro, valorSeleccionado, textoSeleccionado);
        
        // Cerrar dropdown
        filterDropdown.classList.remove('show');
        document.querySelectorAll('.submenu').forEach(submenu => {
          submenu.style.display = 'none';
        });
      });
    });

    // Configurar evento del botón limpiar filtros
    configurarBotonLimpiarFiltros();
  }

  function configurarBotonLimpiarFiltros() {
    if (clearFiltersBtn) {
      // Botón siempre habilitado y visible
      clearFiltersBtn.addEventListener('click', async () => {
        await limpiarFiltros();
      });
    }
  }

  async function aplicarFiltro(tipo, valor, textoMostrar) {
    try {
      filtroActivo = tipo;
      valorFiltro = valor;
      paginaActual = 1;

      // Actualizar UI del botón de filtro
      const filterToggle = document.getElementById('filter-toggle');
      
      filterToggle.innerHTML = `${textoMostrar} <i class="fa-solid fa-filter"></i>`;
      filterToggle.classList.add('filter-active');
      
      // El botón no necesita cambios de estado
      // Siempre está presente y funcional

      // Cargar datos con filtro
      await cargarReportesFiltrados();
      
    } catch (error) {
      console.error('Error al aplicar filtro:', error);
      tablaContenedor.innerHTML = `<p>Error al aplicar filtro: ${error.message}</p>`;
    }
  }

  async function limpiarFiltros() {
    try {
      filtroActivo = null;
      valorFiltro = null;
      paginaActual = 1;

      // Restaurar UI
      const filterToggle = document.getElementById('filter-toggle');
      
      filterToggle.innerHTML = 'Filtros <i class="fa-solid fa-filter"></i>';
      filterToggle.classList.remove('filter-active');
      
      // Deshabilitar botón de limpiar filtros
      if (clearFiltersBtn) {
        clearFiltersBtn.disabled = true;
        clearFiltersBtn.classList.add('disabled');
        clearFiltersBtn.classList.remove('active');
      }

      // Cargar todos los reportes
      await inicializarPaginacion();
      await cargarReportesPagina(1);
      
    } catch (error) {
      console.error('Error al limpiar filtros:', error);
    }
  }

  async function cargarDatosIniciales() {
    const [seccionesRes, usuariosRes, ubicacionesRes, callesRes] = await Promise.all([
      fetch('http://107.22.248.129:7001/secciones'),
      fetch('http://107.22.248.129:7001/usuarios'),
      fetch('http://107.22.248.129:7001/ubicaciones'),
      fetch('http://107.22.248.129:7001/calles')
    ]);

    const seccionesData = await seccionesRes.json();
    const usuariosData = await usuariosRes.json();
    const ubicacionesData = await ubicacionesRes.json();
    const callesData = await callesRes.json();

    seccionesData.forEach(s => {
      secciones[s.id_seccion] = s.nombre_seccion || `Sección ${s.id_seccion}`;
    });

    usuariosData.forEach(u => {
      usuarios[u.id_usuario] = u.nombre || 'Usuario';
    });

    ubicacionesData.forEach(u => {
      ubicaciones[u.id_ubicacion] = {
        id_calle: u.id_calle,
        id_seccion: u.id_seccion
      };
    });

    callesData.forEach(c => {
      calles[c.id_calle] = c.nombre_calle || 'Calle sin nombre';
    });
  }

  async function obtenerTotalReportes() {
    try {
      let url;
      
      if (filtroActivo === "estado") {
        url = `http://107.22.248.129:7001/reportes/total/estado/${valorFiltro}`;
      } else if (filtroActivo === "tipo") {
        url = `http://107.22.248.129:7001/reportes/total/tipo/${valorFiltro}`;
      } else {
        url = 'http://107.22.248.129:7001/reportes/total';
      }
      
      const response = await fetch(url);
      const data = await response.json();
      return typeof data === 'number' ? data : data.total || 0;
    } catch (error) {
      console.error('Error al obtener total de reportes:', error);
      return 0;
    }
  }
  async function cargarReportesFiltrados() {
    try {
      tablaContenedor.innerHTML = '<p>Cargando reportes...</p>';
      
      let urlReportes;
      
      if (filtroActivo === "estado") {
        urlReportes = `http://107.22.248.129:7001/reportes/estado-paginado?id_estado=${valorFiltro}&page=${paginaActual}&limit=${reportesPorPagina}`;
      } else if (filtroActivo === "tipo") {
        urlReportes = `http://107.22.248.129:7001/reportes/tipo-paginado?id_tipo=${valorFiltro}&page=${paginaActual}&limit=${reportesPorPagina}`;
      }
      
      if (!urlReportes) {
        throw new Error('URL de filtro no definida');
      }
      const response = await fetch(urlReportes);
      const data = await response.json();
      const reportes = Array.isArray(data) ? data : data.reportes || [];

      // Actualizar paginación
      totalReportes = await obtenerTotalReportes();
      const totalPaginas = Math.ceil(totalReportes / LIMIT);
      paginacionComponent.setAttribute('total-pages', totalPaginas);
      paginacionComponent.setAttribute('current-page', paginaActual);

      // Renderizar reportes
      renderizarReportes(reportes);
      
    } catch (error) {
      console.error('Error al cargar reportes filtrados:', error);
      tablaContenedor.innerHTML = `<p>Error al cargar reportes: ${error.message}</p>`;
    }
  }
  async function cargarReportesPagina(pagina) {
    paginaActual = pagina;
    
    if (filtroActivo) {
      await cargarReportesFiltrados();
      return;
    }
    tablaContenedor.innerHTML = '<p>Cargando reportes...</p>';

    const response = await fetch(`http://107.22.248.129:7001/reportes?page=${pagina}&limit=${LIMIT}`);
    const data = await response.json();
    const reportes = Array.isArray(data) ? data : data.reportes || [];

    renderizarReportes(reportes);
    paginacionComponent.setAttribute('current-page', pagina);
  }

  function renderizarReportes(reportes) {
    tablaContenedor.innerHTML = '';

    if (reportes.length === 0) {
      tablaContenedor.innerHTML = '<p>No hay reportes que coincidan con los filtros aplicados.</p>';
      return;
    }

    reportes.forEach(rep => {
      if (rep.activo === false) return;

      const idReporte = rep.id_reporte;
      const nombreUsuario = usuarios[rep.id_usuario] || 'Usuario';
      const estadoTexto = estados[rep.id_estado] || 'Desconocido';
      const claseEstado = clasesEstado[estadoTexto] || '';
      const tipoTexto = tipos[rep.id_tipo] || 'Tipo desconocido';
      const idUrgencia = urgenciaPorTipo[rep.id_tipo] || 3;
      const urgenciaInfo = urgencias[idUrgencia];

      const ubicacionObj = ubicaciones[rep.id_ubicacion];
      const idCalle = ubicacionObj?.id_calle;
      const nombreCalle = calles[idCalle] || 'Ubicación no disponible';

      const idSeccion = ubicacionObj?.id_seccion;
      const seccionTexto = secciones[idSeccion] || 'Sección desconocida';

      const fila = document.createElement('div');
      fila.className = 'report-row';

      fila.innerHTML = `
        <button class="btn btn-secondary show-report-btn" data-id="${idReporte}">RPT-${String(idReporte).padStart(3, '0')}</button>
        <div>${nombreUsuario}</div>
        <div class="status-cell"><span class="status-badge ${claseEstado}">${estadoTexto}</span></div>
        <div>${tipoTexto}</div>
        <div><span class="urgency-badge ${urgenciaInfo.clase}">${urgenciaInfo.texto}</span></div>
        <div>${nombreCalle}</div>
        <div>${seccionTexto}</div>
        <div class="action-cell">
          <select class="form-select form-select-sm status-select" data-id="${idReporte}">
            <option value="1" ${rep.id_estado === 1 ? 'selected' : ''}>Pendiente</option>
            <option value="2" ${rep.id_estado === 2 ? 'selected' : ''}>Resuelto</option>
          </select>
          <button class="btn btn-icon delete-report-btn" data-id="${idReporte}">
            <i class="fa-regular fa-trash-can"></i>
          </button>
        </div>
      `;

      tablaContenedor.appendChild(fila);

      const btnMostrar = fila.querySelector('.show-report-btn');
      btnMostrar.addEventListener('click', () => {
        mostrarDetalleReporte(rep);
        reportsPanel.classList.add('is-visible');
        reportsPanel.classList.add('open');
        togglePanel();
      });
    });
  }

  function mostrarDetalleReporte(rep) {
    const nombreUsuario = usuarios[rep.id_usuario] || 'Usuario';
    const estadoTexto = estados[rep.id_estado] || 'Desconocido';
    const claseEstado = clasesEstado[estadoTexto] || '';
    const tipoTexto = tipos[rep.id_tipo] || 'Tipo desconocido';
    const idUrgencia = urgenciaPorTipo[rep.id_tipo] || 3;
    const urgenciaInfo = urgencias[idUrgencia];

    const ubicacionObj = ubicaciones[rep.id_ubicacion];
    const idCalle = ubicacionObj?.id_calle;
    const nombreCalle = calles[idCalle] || 'Ubicación no disponible';

    const idSeccion = ubicacionObj?.id_seccion;
    const seccionTexto = secciones[idSeccion] || 'Sección desconocida';

    document.getElementById('report-author').textContent = nombreUsuario;

    const statusSpan = document.querySelector('.panel-status .status-badge');
    statusSpan.textContent = estadoTexto;
    statusSpan.className = `status-badge ${claseEstado}`;

    document.getElementById('report-type').textContent = tipoTexto;

    const urgencySpan = document.querySelector('.panel-urgency .urgency-badge');
    urgencySpan.textContent = urgenciaInfo.texto;
    urgencySpan.className = `urgency-badge ${urgenciaInfo.clase}`;

    document.getElementById('report-location').textContent = nombreCalle;
    document.getElementById('report-section').textContent = seccionTexto;

    document.getElementById('report-referency').textContent = rep.referencia || 'Sin referencia';
    document.getElementById('report-description').textContent = rep.descripcion || 'Sin descripción';
  }

  async function inicializarPaginacion() {
    totalReportes = await obtenerTotalReportes();
    const totalPaginas = Math.ceil(totalReportes / LIMIT);
    paginacionComponent.setAttribute('total-pages', totalPaginas);
    paginacionComponent.setAttribute('current-page', 1);
  }

  paginacionComponent.addEventListener('page-change', e => {
    const pagina = e.detail.page;
    cargarReportesPagina(pagina).catch(err => {
      tablaContenedor.innerHTML = `<p>Error: ${err.message}</p>`;
      console.error(err);
    });
  });

  // --- Panel de Reportes (código original) ---
  const reportsPanel = document.getElementById('reports-panel');
  const closeReportsBtn = document.getElementById('close-reports-btn');

  if (reportsPanel && closeReportsBtn) {
    const closePanel = () => {
      reportsPanel.classList.remove('is-visible');
      reportsPanel.classList.remove('open');
      togglePanel();
    };

    closeReportsBtn.addEventListener('click', closePanel);
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && reportsPanel.classList.contains('is-visible')) closePanel();
    });
  }

  const btn = document.querySelector('.close-reports-btn');
  const panel = document.querySelector('.reports-panel');
  function togglePanel() {
    if (panel?.classList.contains('open')) {
      btn?.classList.add('panel-open');
      btn?.classList.remove('panel-closed');
    } else {
      btn?.classList.add('panel-closed');
      btn?.classList.remove('panel-open');
    }
  }

  try {
    await cargarDatosIniciales();
    inicializarFiltros(); 
    await inicializarPaginacion();
    await cargarReportesPagina(1);
  } catch (error) {
    tablaContenedor.innerHTML = `<p>Error al cargar reportes: ${error.message}</p>`;
    console.error(error);
  }
});