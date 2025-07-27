document.addEventListener('DOMContentLoaded', () => {
    const createNoticeBtn = document.getElementById('create-notice-btn');
    const createNoticeModal = document.getElementById('crear-anuncio');
    const createNoticeForm = document.getElementById('crear-anuncio-form');

    // Sincroniza id_admin con id_usuario si no existe
    function sincronizarIdAdminConUsuario() {
        const idUsuario = localStorage.getItem('id_usuario');
        const idAdmin = localStorage.getItem('id_admin');

        if (!idAdmin && idUsuario) {
            localStorage.setItem('id_admin', idUsuario);
            console.log(`id_admin no existía y se asignó el valor de id_usuario: ${idUsuario}`);
        }
    }

    // Obtener id_admin desde localStorage
    function obtenerIdAdmin() {
        const id = localStorage.getItem('id_admin');
        return id ? Number(id) : null;
    }

    // Mostrar alertas en consola y en pantalla
    function mostrarAlerta(mensaje, tipo = 'info') {
        console.log(`[${tipo.toUpperCase()}] ${mensaje}`);
        alert(mensaje);
    }

    sincronizarIdAdminConUsuario();

    // Abrir modal al hacer clic en el botón
    if (createNoticeBtn && createNoticeModal) {
        createNoticeBtn.addEventListener('click', () => {
            createNoticeModal.classList.add('show');
        });
    }

    // Cerrar modal con botones
    if (createNoticeModal) {
        const closeModalBtns = createNoticeModal.querySelectorAll('.close-modal-btn');
        closeModalBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                createNoticeModal.classList.remove('show');
                if (createNoticeForm) createNoticeForm.reset();
            });
        });
    }

    // Enviar anuncio al backend
    if (createNoticeForm && createNoticeModal) {
        createNoticeForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const tituloInput = document.getElementById('anuncio-titulo');
            const contenidoInput = document.getElementById('anuncio-descripcion');

            if (!tituloInput || !contenidoInput) {
                mostrarAlerta('Los campos del formulario no existen.', 'error');
                return;
            }

            const titulo = tituloInput.value.trim();
            const contenido = contenidoInput.value.trim();
            const idAdmin = obtenerIdAdmin();

            if (!titulo || !contenido) {
                mostrarAlerta('Por favor, completa todos los campos.', 'error');
                return;
            }

            if (!idAdmin) {
                mostrarAlerta('No se encontró el ID de administrador. Por favor inicia sesión nuevamente.', 'error');
                return;
            }

            const payload = {
                titulo,
                contenido,
                id_admin: idAdmin
            };

            console.log('Enviando datos al backend:', payload);

            try {
                const response = await fetch('http://107.22.248.129:7001/mensajes-admin', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const result = await response.text();
                console.log('Respuesta del servidor:', result);

                if (!response.ok) {
                    mostrarAlerta('Error al crear el aviso: ' + result, 'error');
                    return;
                }

                createNoticeForm.reset();
                createNoticeModal.classList.remove('show');
                mostrarAlerta('Aviso creado con éxito.', 'success');

                // Si tienes una función para recargar avisos, puedes llamarla aquí
                // Por ejemplo: cargarAnuncios();

            } catch (error) {
                console.error('Error de red:', error);
                mostrarAlerta('No se pudo conectar con el servidor.', 'error');
            }

            setTimeout(() => {
                location.reload(); // Puedes eliminar esta línea si no quieres recargar
            }, 1500);
        });
    } else {
        console.warn('No se encontró el formulario o el modal. El envío de anuncios no estará disponible.');
    }
});

