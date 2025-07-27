const statusConfirmModal = document.getElementById('status-confirm-modal');
const confirmStatusBtn = document.getElementById('confirm-status-btn');
const closeModalBtns = document.querySelectorAll('.close-modal-btn');

let selectToUpdate = null;
let previousStatus = null;
let idReporteSeleccionado = null;

// Escuchar cambios en los selects de estado
document.addEventListener('change', (e) => {
  if (e.target.classList.contains('status-select')) {
    const selectedValue = e.target.value;
    const idReporte = e.target.dataset.id;

    if (selectedValue === "2") {
      // Guardar valores temporales
      selectToUpdate = e.target;
      previousStatus = "1";
      idReporteSeleccionado = idReporte;

      // Mostrar modal
      statusConfirmModal.classList.add('show');
    }
  }
});

// Botón Cancelar: revertir el select y cerrar modal
closeModalBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    if (selectToUpdate) {
      selectToUpdate.value = previousStatus;
    }
    statusConfirmModal.classList.remove('show');
  });
});

// Botón Confirmar: enviar POST y recargar página
confirmStatusBtn.addEventListener('click', async () => {
  if (idReporteSeleccionado) {
    try {
      const response = await fetch(`http://107.22.248.129:7001/reportes/${idReporteSeleccionado}/resolver`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id_estado: 2 })
      });

      if (!response.ok) throw new Error(`Error al actualizar: ${response.status}`);

      alert('Estado actualizado con éxito');
      location.reload(); // 🔁 Recarga automática de la página

    } catch (error) {
      console.error('Error al actualizar el estado:', error);
      if (selectToUpdate) {
        selectToUpdate.value = previousStatus;
      }
      alert('No se pudo actualizar el estado. Verifica si el servidor permite POST en lugar de PATCH.');
    } finally {
      statusConfirmModal.classList.remove('show');
      selectToUpdate = null;
      idReporteSeleccionado = null;
    }
  }
});
