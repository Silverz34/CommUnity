document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('confirm-delete-modal');
  const closeModalBtn = document.getElementById('modal-close-btn');
  const confirmDeleteBtn = document.getElementById('confirm-delete-btn');

  let idAEliminar = null;
  let targetCard = null;

  // Función para mostrar mensaje toast
  function mostrarToast(mensaje, duracion = 3000) {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.textContent = mensaje;
    toast.style.background = '#4BB543'; // verde éxito
    toast.style.color = '#fff';
    toast.style.padding = '12px 20px';
    toast.style.marginTop = '10px';
    toast.style.borderRadius = '8px';
    toast.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
    toast.style.fontWeight = '600';
    toast.style.fontSize = '14px';
    toast.style.opacity = '1';
    toast.style.transition = 'opacity 0.5s ease';

    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => {
        toast.remove();
      }, 500);
    }, duracion);
  }

  // Delegación de evento para botones eliminar en las cards
  document.body.addEventListener('click', (e) => {
    const deleteBtn = e.target.closest('.delete-notice-btn');
    if (deleteBtn) {
      idAEliminar = deleteBtn.getAttribute('data-id');
      targetCard = deleteBtn.closest('.col-md-4'); // Asegúrate de que este selector '.col-md-4' es el contenedor correcto de tu tarjeta
      console.log('ID a eliminar:', idAEliminar);
      modal.style.display = 'block';
    }
  });

  // Cerrar modal
  closeModalBtn.addEventListener('click', () => {
    modal.style.display = 'none';
    idAEliminar = null;
    targetCard = null;
  });

  // Confirmar eliminación
  confirmDeleteBtn.addEventListener('click', async () => {
    if (!idAEliminar) {
      console.warn('No hay ID para eliminar');
      return;
    }

    try {
      const response = await fetch(`http://107.22.248.129:7001/mensajes-admin/${idAEliminar}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        console.log(`Aviso con ID ${idAEliminar} eliminado.`);
        if (targetCard) targetCard.remove(); // Elimina la tarjeta visualmente
        mostrarToast('Aviso eliminado con éxito');

        // Refrescar después de 1.5 segundos
        setTimeout(() => {
          location.reload();
        }, 1500);

      } else {
        const error = await response.json();
        console.error('Error al eliminar:', error);
      }
    } catch (err) {
      console.error('Error de red:', err);
    } finally {
      modal.style.display = 'none';
      idAEliminar = null;
      targetCard = null;
    }
  });
});