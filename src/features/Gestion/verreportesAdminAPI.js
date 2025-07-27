document.addEventListener('DOMContentLoaded', async () => {
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
    1: 2,
    2: 2,
    3: 3,
    4: 1,
    5: 2,
    6: 1,
    7: 1
  };

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
      const response = await fetch('http://107.22.248.129:7001/reportes/total');
      const data = await response.json();
      return typeof data === 'number' ? data : data.total || 0;
    } catch (error) {
      console.error('Error al obtener total de reportes:', error);
      return 0;
    }
  }

  async function cargarReportesPagina(pagina) {
    tablaContenedor.innerHTML = '<p>Cargando reportes...</p>';

    const response = await fetch(`http://107.22.248.129:7001/reportes?page=${pagina}&limit=${LIMIT}`);
    const data = await response.json();
    const reportes = Array.isArray(data) ? data : data.reportes || [];

    tablaContenedor.innerHTML = '';

    if (reportes.length === 0) {
      tablaContenedor.innerHTML = '<p>No hay reportes en esta página.</p>';
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
        togglePanel(); // actualiza clases del botón si tienes diseño dependiente
      });
    });

    paginacionComponent.setAttribute('current-page', pagina);
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
    paginacionComponent.setAttribute('current-page', pagina);
  });

  // --- Panel de Reportes ---
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
    await inicializarPaginacion();
    await cargarReportesPagina(1);
  } catch (error) {
    tablaContenedor.innerHTML = `<p>Error al cargar reportes: ${error.message}</p>`;
    console.error(error);
  }
});
