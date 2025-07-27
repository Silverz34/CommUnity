document.addEventListener('DOMContentLoaded', () => {
  const deleteConfirmModal = document.getElementById('delete-confirm-modal');
  const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
  const closeModalBtns = document.querySelectorAll('.close-modal-btn');
  let selectedReportId = null;

  // Abrir modal al hacer clic en botón eliminar
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.delete-report-btn');
    if (btn) {
      selectedReportId = btn.dataset.id;
      if (!selectedReportId) {
        alert('ID del reporte no encontrado');
        return;
      }
      deleteConfirmModal.classList.add('show');
    }
  });

  // Cerrar modal con botones cancelar
  closeModalBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      deleteConfirmModal.classList.remove('show');
      selectedReportId = null;
    });
  });

  // Confirmar eliminación usando DELETE
  confirmDeleteBtn.addEventListener('click', async () => {
    if (!selectedReportId) {
      alert('No se seleccionó ningún reporte');
      return;
    }

    try {
      const response = await fetch(`http://107.22.248.129:7001/reportes/${selectedReportId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error(`Error: ${response.status}`);

      deleteConfirmModal.classList.remove('show');
      alert('Reporte eliminado con éxito');

      // Opcional: Recargar página o eliminar visualmente
      setTimeout(() => window.location.reload(), 1000);

    } catch (error) {
      console.error('Error al eliminar el reporte:', error);
      alert('Error al eliminar el reporte');
    }
  });
});
