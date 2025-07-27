// --- Crear y Eliminar Avisos ---
    const createNoticeBtn = document.getElementById('create-notice-btn');
    const createNoticeModal = document.getElementById('crear-anuncio');
    const createNoticeForm = document.getElementById('crear-anuncio-form');
    const avisosGrid = document.getElementById('avisos-grid');
    const deleteConfirmModal = document.getElementById('delete-confirm-modal');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    let cardToDelete = null;

    // Abrir modal de crear aviso
    if (createNoticeBtn && createNoticeModal) {
        createNoticeBtn.addEventListener('click', () => {
            createNoticeModal.classList.add('show');
        });
    }

    // Crear aviso
    if (createNoticeForm && avisosGrid && createNoticeModal) {
        createNoticeForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const title = document.getElementById('notice-title').value.trim();
            const description = document.getElementById('notice-description').value.trim();
            if (title === '' || description === '') {
                showToast('Por favor, completa todos los campos.', 'error');
                return;
            }
            const newNoticeCard = document.createElement('div');
            newNoticeCard.className = 'col-12 col-md-6 col-lg-4';
            newNoticeCard.dataset.category = 'General';
            newNoticeCard.dataset.title = title;
            newNoticeCard.innerHTML = `
                <div class="card notice-card h-100">
                    <div class="card-body">
                        <div class="d-flex align-items-center mb-3">
                            <i class="fa-solid fa-user-shield notice-author-icon"></i>
                            <span class="notice-author">Administrador</span>
                        </div>
                        <h5 class="card-title">${title}</h5>
                        <p class="card-text">${description} <a href="#">Leer más</a></p>
                    </div>
                    <div class="card-footer notice-card-footer">
                        <div class="d-flex align-items-center text-muted">
                            <i class="fa-regular fa-calendar me-2"></i>
                            <small>${new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</small>
                        </div>
                        <button class="btn btn-icon btn-icon-danger delete-notice-btn"><i class="fa-regular fa-trash-can"></i></button>
                    </div>
                </div>
            `;
            avisosGrid.prepend(newNoticeCard);
            createNoticeForm.reset();
            createNoticeModal.classList.remove('show');
            showToast('Aviso enviado con éxito', 'success');
        });
    }

    

    // --- Datos de ejemplo para ambas gráficas ---
    const chartData = {
        Incident: {
            labels: [
                "Alumbrado", "Fuga de agua", "Basura", "Asalto", "Ruido excesivo", "Alcohol", "Drenaje tapado"
            ],
            values: [11, 17, 30, 16, 30, 7, 7],
            colors: [
                "#1CA1C1", "#1DC6E6", "#1FC8E6", "#4DD7A7", "#7BE495", "#F7D774", "#F7B801"
            ]
        },
        Section: {
            labels: [
                "Sección 1", "Sección 2", "Sección 3", "Sección 4"
            ],
            values: [22, 18, 25, 15],
            colors: [
                "#596CFF", "#32C4C4", "#55D4B4", "#A0DD9F"
            ]
        }
    };

    // --- Función para renderizar la gráfica ---
    function renderBarChart(type = "Incident", chartId = "bar-chart", labelsId = "x-labels-row") {
        const chart = chartData[type];
        const max = Math.max(...chart.values, 40);
        const barChart = document.getElementById(chartId);
        const xLabelsRow = document.getElementById(labelsId);
        if (!barChart || !xLabelsRow) return;

        // Calcula el número de barras para flexibilidad
        const barCount = chart.values.length;

        // Genera las barras con flex: 1 para simetría
        barChart.innerHTML = chart.values.map((val, i) => `
            <div class="bar-wrapper" style="flex:1 1 0; max-width:110px; min-width:60px;">
                <div class="bar" style="height: ${Math.round((val / max) * 100)}%; background-color: ${chart.colors[i]};">
                    <span class="data-label">${val}</span>
                </div>
            </div>
        `).join("");

        // Genera las etiquetas X con flex: 1 para simetría
        xLabelsRow.innerHTML = chart.labels.map(() => `
            <span class="x-label"></span>
        `).join("");
        // Ahora rellena las etiquetas con el texto centrado
        chart.labels.forEach((label, i) => {
            xLabelsRow.children[i].textContent = label;
        });
    }

    // --- Evento para cambiar entre Incidente y Sección ---
    const filterSelect = document.getElementById("filter-select");
    if (filterSelect) {
        renderBarChart(filterSelect.value);
        filterSelect.addEventListener("change", (e) => {
            renderBarChart(e.target.value);
        });
    }



// ==============================================================
// ==   LÓGICA PARA CONFIRMACIONES EN TABLA ADMIN DE REPORTES  ==
// ==============================================================
const reportTable = document.getElementById('report-table');

// Ejecutar solo si estamos en la página de admin con la tabla de reportes
if (reportTable) {
    // Elementos del DOM para los modales
    const statusConfirmModal = document.getElementById('status-confirm-modal');
    const deleteConfirmModal = document.getElementById('delete-confirm-modal');
    const confirmStatusBtn = document.getElementById('confirm-status-btn');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    const statusConfirmText = document.getElementById('status-confirm-text');
    
    // Variables para guardar el estado temporalmente
    let rowToModify = null;
    let newStatus = '';
    let originalStatus = '';

    // Usar delegación de eventos para manejar clics y cambios en toda la tabla
    reportTable.addEventListener('click', (event) => {
        const deleteButton = event.target.closest('.delete-report-btn');
        if (deleteButton) {
            rowToModify = deleteButton.closest('.report-row'); // Guardar la fila a borrar
            deleteConfirmModal.classList.add('show');
        }
    });

    reportTable.addEventListener('change', (event) => {
        const statusSelect = event.target.closest('.status-select');
        if (statusSelect) {
            rowToModify = statusSelect.closest('.report-row');
            newStatus = statusSelect.value;
            // Guardamos el estado original por si el usuario cancela
            originalStatus = rowToModify.querySelector('.status-badge').textContent;

            statusConfirmText.innerHTML = `El estado del reporte cambiará a <strong>${newStatus}</strong>. ¿Deseas continuar?`;
            statusConfirmModal.classList.add('show');
        }
    });

    // --- Lógica de los botones de confirmación ---

    // Confirmar cambio de estado
    confirmStatusBtn.addEventListener('click', () => {
        if (rowToModify && newStatus) {
            const statusBadge = rowToModify.querySelector('.status-badge');
            statusBadge.textContent = newStatus;
            
            // Cambiar la clase del badge para que cambie de color
            statusBadge.className = 'status-badge'; // Limpiar clases anteriores
            if (newStatus === 'Resuelto') statusBadge.classList.add('status-resuelto');
            else if (newStatus === 'En proceso') statusBadge.classList.add('status-en-proceso');
            else statusBadge.classList.add('status-pendiente');

            statusConfirmModal.classList.remove('show');
            showToast('Estado actualizado con éxito', 'success');
        }
    });

    // Confirmar eliminación
    confirmDeleteBtn.addEventListener('click', () => {
        if (rowToModify) {
            rowToModify.remove();
            deleteConfirmModal.classList.remove('show');
            showToast('Reporte eliminado con éxito', 'success');
        }
    });

    // --- Cerrar los modales y manejar cancelación ---
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        // Cerrar con el botón 'cancelar' o 'x'
        modal.querySelectorAll('.close-modal-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                // Si se cancela el cambio de estado, revertir el select
                if (modal.id === 'status-confirm-modal' && rowToModify) {
                    rowToModify.querySelector('.status-select').value = originalStatus;
                }
                modal.classList.remove('show');
            });
        });
    });
}


// --- Panel de Reportes ---
    const reportsPanel = document.getElementById('reports-panel');
    const showReportsBtn = document.getElementById('show-reports-btn');
    const closeReportsBtn = document.getElementById('close-reports-btn');
    if (reportsPanel && showReportsBtn && closeReportsBtn) {
        const openReports = () => reportsPanel.classList.add('is-visible');
        const closePanel = () => reportsPanel.classList.remove('is-visible');
        showReportsBtn.addEventListener('click', openReports);
        closeReportsBtn.addEventListener('click', closePanel);
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && reportsPanel.classList.contains('is-visible')) closePanel();
        });
    }

    const btn = document.querySelector('.close-reports-btn');
    const panel = document.querySelector('.reports-panel'); // Tu panel

// Cuando abres/cierras el panel
function togglePanel() {
  if (panel.classList.contains('open')) {
    btn.classList.add('panel-open');
    btn.classList.remove('panel-closed');
  } else {
    btn.classList.add('panel-closed');
    btn.classList.remove('panel-open');
  }
}