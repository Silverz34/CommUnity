document.addEventListener('DOMContentLoaded', function() {
    const filterToggle = document.getElementById('filter-toggle');
    const filterDropdown = document.getElementById('filter-dropdown');
    const reportsContainer = document.getElementById('reports-grid');
    const clearFiltersBtn = document.getElementById('limpiarFiltros');    
    const paginacionComponent = document.querySelector('dynamic-pagination');
    
    let filtroActivo = null; 
    let valorFiltro = null;
    let paginaActual = 1;
    const reportesPorPagina = 9;
    let activeFilterElement = null;

    let secciones = {};
    let estados = {};
    let incidentes = {};
    let usuarios = {};
    let ubicaciones = {};
    let calles = [];

    // Inicializar
    setupFilters();
    loadAuxiliaryData().then(() => {
        cargarReportes(); 
    });

    async function loadAuxiliaryData() {
        try {
            const [seccionesRes, usuariosRes, ubicacionesRes, callesRes] = await Promise.all([
                fetch('http://107.22.248.129:7001/secciones'),
                fetch('http://107.22.248.129:7001/usuarios'),
                fetch('http://107.22.248.129:7001/ubicaciones'),
                fetch('http://107.22.248.129:7001/calles')
            ]);

            // Procesar secciones
            if (seccionesRes.ok) {
                const seccionesData = await seccionesRes.json();
                secciones = {};
                seccionesData.forEach(sec => {
                    secciones[sec.id_seccion] = sec.nombre_seccion;
                });
            }

            // Procesar usuarios
            if (usuariosRes.ok) {
                const usuariosData = await usuariosRes.json();
                usuarios = {};
                usuariosData.forEach(user => {
                    usuarios[user.id_usuario] = {
                        id_usuario: user.id_usuario,
                        nombre: user.nombre || user.nombre_usuario || 'Usuario',
                        es_admin: user.es_admin || false
                    };
                });
            }

            // Procesar ubicaciones
            if (ubicacionesRes.ok) {
                const ubicacionesData = await ubicacionesRes.json();
                ubicaciones = {};
                ubicacionesData.forEach(ubi => {
                    ubicaciones[ubi.id_ubicacion] = {
                        id_seccion: ubi.id_seccion,
                        nombre_seccion: secciones[ubi.id_seccion] || 'Sección desconocida'
                    };
                });
            }

            if (callesRes.ok) {
                calles = await callesRes.json();
            }

            estados = {
                1: 'Pendiente',
                2: 'Resuelto',
            };

            incidentes = {
                1: "Ruido excesivo",
                2: "Problema de alcohol", 
                3: "Basura",
                4: "Asalto",
                5: "Alumbrado Público",
                6: "Fuga de agua",
                7: "Drenaje tapado"
            };

        } catch (error) {
            console.error('Error cargando datos auxiliares:', error);
        }
    }

    async function cargarReportes() {
        let urlReportes = "";
        let urlTotal = "";

        if (filtroActivo === "estado") {
            urlReportes = `http://107.22.248.129:7001/reportes/estado-paginado?id_estado=${valorFiltro}&page=${paginaActual}&limit=${reportesPorPagina}`;
            urlTotal = `http://107.22.248.129:7001/reportes/total/estado/${valorFiltro}`;
        } else if (filtroActivo === "tipo") {
            urlReportes = `http://107.22.248.129:7001/reportes/tipo-paginado?id_tipo=${valorFiltro}&page=${paginaActual}&limit=${reportesPorPagina}`;
            urlTotal = `http://107.22.248.129:7001/reportes/total/tipo/${valorFiltro}`;
        } else if (filtroActivo === "seccion") {
            urlReportes = `http://107.22.248.129:7001/reportes/seccion-paginado?id_seccion=${valorFiltro}&page=${paginaActual}&limit=${reportesPorPagina}`;
            urlTotal = `http://107.22.248.129:7001/reportes/total/seccion/${valorFiltro}`;
        } else {
            urlReportes = `http://107.22.248.129:7001/reportes?page=${paginaActual}&limit=${reportesPorPagina}`;
            urlTotal = `http://107.22.248.129:7001/reportes/total`;
        }

        try {
            // Fetch de los reportes paginados
            const responseReportes = await fetch(urlReportes);
            const reportes = await responseReportes.json();

            // Fetch del total
            const responseTotal = await fetch(urlTotal);
            const dataTotal = await responseTotal.json();
            const totalReportes = dataTotal.total || 0;

            const totalPaginas = Math.ceil(totalReportes / reportesPorPagina);


            // Renderizar reportes y actualizar paginación
            renderCards(reportes);
            actualizarPaginacion(paginaActual, totalPaginas);

        } catch (error) {
            console.error("Error al cargar reportes:", error);
            reportsContainer.innerHTML = `<p class="error">Error al cargar reportes: ${error.message}</p>`;
        }
    }

    // Configurar eventos de los filtros
    function setupFilters() {
        // Toggle del dropdown principal
        if (filterToggle && filterDropdown) {
            filterToggle.addEventListener('click', function(e) {
                e.stopPropagation();
                filterDropdown.classList.toggle('show');
            });
        }

        // Cerrar al hacer clic fuera
        document.addEventListener('click', function(e) {
            if (!filterDropdown.contains(e.target) && e.target !== filterToggle) {
                filterDropdown.classList.remove('show');
                closeAllSubmenus();
            }
        });

        // Configurar submenús
        const dropdownItems = document.querySelectorAll('.has-submenu');
        dropdownItems.forEach(item => {
            const span = item.querySelector('span');
            const submenu = item.querySelector('.submenu');
            
            if (span && submenu) {
                span.addEventListener('click', function(e) {
                    e.stopPropagation();
                    toggleSubmenu(submenu);
                });
            }
        });

        const filterItems = document.querySelectorAll('.submenu-item');
        filterItems.forEach(item => {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                applyFilter(this);
            });
        });

        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', clearFilters);
        }

        if (paginacionComponent) {
            paginacionComponent.addEventListener('page-change', e => {
                paginaActual = e.detail.page;
                cargarReportes();
            });
        }
    }


    function applyFilter(filterElement) {
        if (!filterElement || !reportsContainer) return;
        
        // Remover activo del item anterior
        if (activeFilterElement) {
            activeFilterElement.classList.remove('active');
        }
        
        // Marcar nuevo item como activo
        filterElement.classList.add('active');
        activeFilterElement = filterElement;
        
        // Obtener la categoría padre para determinar el tipo de filtro
        const categoria = filterElement.closest('.dropdown-item').querySelector('span').textContent.trim();
        
        // Obtener el valor del filtro
        let valor = filterElement.getAttribute('data-value') || 
                   filterElement.getAttribute('data-id') ||
                   filterElement.getAttribute('href');
        if (valor === '#' || !valor || valor.trim() === '') {
            console.warn('Valor de filtro inválido:', valor, 'para elemento:', filterElement);
            return;
        }
        
        // Si viene con #, quitarlo
        if (valor.startsWith('#')) {
            valor = valor.substring(1);
        }
        
        console.log('Aplicando filtro - Categoría:', categoria, 'Valor:', valor);
        
        // Determinar el tipo de filtro
        if (categoria === 'Estados') {
            filtroActivo = "estado";
        } else if (categoria === 'Incidentes') {
            filtroActivo = "tipo";
        } else if (categoria === 'Secciones') {
            filtroActivo = "seccion";
        } else {
            console.warn('Categoría de filtro desconocida:', categoria);
            return;
        }
        
        valorFiltro = valor;
        
        // Reiniciar página y cargar reportes
        paginaActual = 1;
        cargarReportes();
        
        // Cerrar menús
        if (filterDropdown) filterDropdown.classList.remove('show');
        closeAllSubmenus();
    }

    // Actualizar componente de paginación
    function actualizarPaginacion(paginaActual, totalPaginas) {
        if (paginacionComponent) {
            console.log("Actualizar paginación:", { paginaActual, totalPaginas });
            paginacionComponent.setAttribute('total-pages', totalPaginas);
            paginacionComponent.setAttribute('current-page', paginaActual);
        }
    }

    function obtenerNombreSeccion(id_ubicacion) {
        const ubicacion = ubicaciones[id_ubicacion];
        if (!ubicacion) return 'Sección desconocida';
        const seccion = Object.keys(secciones).find(key => key == ubicacion.id_seccion);
        if (!seccion) return 'Sección desconocida';

        // Mapeo personalizado del primer script
        if (ubicacion.id_seccion === 1) return 'Sección 3';
        if (ubicacion.id_seccion === 2) return 'Sección 4';

        return `Sección ${ubicacion.id_seccion}`;
    }

    function obtenerRutaAvatar(id_usuario) {
        const usuario = usuarios[id_usuario];
        if (!usuario) {
            console.warn(`Usuario con id ${id_usuario} no encontrado, usando imagen por defecto.`);
            return '/img/usuario-verificado.png'; // Imagen por defecto
        }
        return usuario.es_admin === true
            ? '/img/icono-admin.png'
            : '/img/usuario-verificado.png';
    }

    // Renderizar cards de reportes
    function renderCards(reportes) {
        if (!reportsContainer) return;
        
        reportsContainer.innerHTML = '';

        const listaReportes = Array.isArray(reportes) ? reportes : (reportes.reportes || []);
        const reportesActivos = listaReportes.filter(r => r.activo !== false);

        if (reportesActivos.length === 0) {
            reportsContainer.innerHTML = '<p>No hay reportes para mostrar en esta página.</p>';
            return;
        }

        reportesActivos.forEach(rep => {
            // Formatear fecha
            const fecha = new Date(rep.fecha_creacion).toLocaleDateString('es-MX', {
                day: '2-digit', 
                month: 'short', 
                year: 'numeric'
            });

            const usuario = usuarios[rep.id_usuario];
            const nombreUsuario = usuario ? usuario.nombre : `Usuario #${rep.id_usuario}`;
            
            const nombreSeccion = obtenerNombreSeccion(rep.id_ubicacion);
            const tipoIncidente = incidentes[rep.id_tipo] || 'Tipo desconocido';
            const estadoTexto = estados[rep.id_estado] || 'Desconocido';
            
            const estadoClase =
                estadoTexto === 'Resuelto' ? 'tag-resolved' :
                estadoTexto === 'Pendiente' ? 'tag-pending' : 'tag-review';

            const avatarUrl = obtenerRutaAvatar(rep.id_usuario);
            
            const descripcionCorta = rep.descripcion.length > 100
                ? `${rep.descripcion.substring(0, 100)}...`
                : rep.descripcion;
            
            // Crear elemento del reporte
            const cardElement = document.createElement('article');
            cardElement.className = 'card';
            cardElement.dataset.descripcion = encodeURIComponent(rep.descripcion);
            cardElement.style.cursor = 'pointer';
            
            cardElement.innerHTML = `
                <div class="card-header">
                    <span class="card-profile">
                        <img src="${avatarUrl}" alt="Avatar" class="user-avatar" />
                    </span>
                    <span class="card-author">${nombreUsuario}</span>
                    <span class="card-date">${fecha}</span>
                    <span class="card-section">${nombreSeccion}</span>
                </div>
                <div class="card-body">
                    <p>${descripcionCorta}</p>
                </div>
                <div class="card-footer">
                    <span class="tag ${estadoClase}">${estadoTexto}</span>
                    <span class="tag tag-category">${tipoIncidente}</span>
                </div>
            `;
            
            // Hacer toda la card clickeable para mostrar el modal
            cardElement.addEventListener('click', function() {
                mostrarModalDescripcion(this.dataset.descripcion);
            });
            
            reportsContainer.appendChild(cardElement);
        });
    }

    // Mostrar modal con descripción completa
    function mostrarModalDescripcion(descripcionCodificada) {
        if (!document.getElementById('modal-leer-mas')) {
            const modal = document.createElement('div');
            modal.id = 'modal-leer-mas';
            modal.className = 'modal-overlay';
            modal.style.display = 'none';
            modal.innerHTML = `
                <div class="modal-content" style="margin: auto; max-width: 500px; margin-top: 10rem;">
                    <h3>Descripción completa</h3>
                    <p id="modal-descripcion"></p>
                    <button id="cerrar-modal-leer-mas" class="btn btn-secondary">Cerrar</button>
                </div>
            `;
            document.body.appendChild(modal);
            document.getElementById('cerrar-modal-leer-mas').addEventListener('click', () => {
                modal.style.display = 'none';
            });
        }

        const textoCompleto = decodeURIComponent(descripcionCodificada);
        document.getElementById('modal-descripcion').textContent = textoCompleto;
        document.getElementById('modal-leer-mas').style.display = 'block';
    }

    // Limpiar filtros y volver a reportes generales
    function clearFilters() {
        // Remover clase active del elemento activo
        if (activeFilterElement) {
            activeFilterElement.classList.remove('active');
            activeFilterElement = null;
        }
        
        // Resetear variables de filtro
        filtroActivo = null;
        valorFiltro = null;
        paginaActual = 1;
        
        // Cargar reportes generales
        cargarReportes();
        
        // Cerrar dropdown
        if (filterDropdown) filterDropdown.classList.remove('show');
        closeAllSubmenus();
    }

    // Funciones auxiliares para el manejo de submenús
    function toggleSubmenu(submenu) {
        if (!submenu) return;
        closeAllSubmenus();
        submenu.style.display = submenu.style.display === 'block' ? 'none' : 'block';
        const icon = submenu.closest('.has-submenu')?.querySelector('i');
        if (icon) {
            icon.style.transform = submenu.style.display === 'block' ? 'rotate(90deg)' : 'rotate(0)';
        }
    }

    function closeAllSubmenus() {
        document.querySelectorAll('.submenu').forEach(submenu => {
            if (submenu) {
                submenu.style.display = 'none';
                const icon = submenu.closest('.has-submenu')?.querySelector('i');
                if (icon) icon.style.transform = 'rotate(0)';
            }
        });
    }
});