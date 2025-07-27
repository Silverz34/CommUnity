document.addEventListener('DOMContentLoaded', () => {
  const seccionSelect = document.getElementById('seccion');
  const calleSelect = document.getElementById('calle');
  const reportForm = document.getElementById('reportForm');
  const reportModal = document.getElementById('reportModal');
  const createReportBtn = document.getElementById('create-report-btn');
  const closeReportBtn = document.getElementById('close-report-btn');

  let idUbicacionActual = null;
  const idUsuario = localStorage.getItem("id_usuario");

  if (!idUsuario) {
    alert("⚠️ No estás logueado. Por favor inicia sesión.");
    window.location.href = "/src/login.html";
    return;
  }

  console.log("✅ Usuario logueado con id:", idUsuario);

  // Abrir modal
  if (createReportBtn && reportModal) {
    createReportBtn.addEventListener('click', () => {
      reportModal.classList.add('show');
    });
  }

  // Cerrar modal
  if (closeReportBtn) {
    closeReportBtn.addEventListener('click', () => {
      reportForm.reset();
      calleSelect.innerHTML = '<option value="">Primero selecciona una sección</option>';
      idUbicacionActual = null;
      reportModal.classList.remove('show');
    });
  }

  // Cargar secciones
  async function cargarSecciones() {
    try {
      const response = await fetch('http://107.22.248.129:7001/secciones');
      if (!response.ok) throw new Error('No se pudieron cargar las secciones');

      const secciones = await response.json();
      seccionSelect.innerHTML = '<option value="">Selecciona una sección</option>';

      secciones.forEach(seccion => {
        const option = document.createElement('option');
        option.value = seccion.id_seccion;
        option.textContent = seccion.nombre_seccion;
        seccionSelect.appendChild(option);
      });
    } catch (error) {
      console.error('Error al cargar secciones:', error);
      seccionSelect.innerHTML = '<option value="">Error al cargar secciones</option>';
    }
  }

  cargarSecciones();

  // Cargar calles por sección
  seccionSelect.addEventListener('change', async () => {
    const idSeccion = seccionSelect.value;
    idUbicacionActual = null;
    calleSelect.innerHTML = '<option value="">Cargando calles...</option>';

    if (!idSeccion) {
      calleSelect.innerHTML = '<option value="">Primero selecciona una sección</option>';
      return;
    }

    try {
      const response = await fetch(`http://107.22.248.129:7001/calles-por-seccion/${idSeccion}`);
      if (!response.ok) throw new Error('No se pudieron cargar las calles');

      const calles = await response.json();

      if (!calles || calles.length === 0) {
        calleSelect.innerHTML = '<option value="">No hay calles disponibles</option>';
        return;
      }

      calleSelect.innerHTML = '<option value="">Selecciona una calle</option>';
      calles.forEach(calle => {
        const option = document.createElement('option');
        option.value = calle.id_calle;
        option.textContent = calle.nombre_calle;
        calleSelect.appendChild(option);
      });

    } catch (error) {
      console.error('Error al obtener calles:', error);
      calleSelect.innerHTML = '<option value="">Error al cargar calles</option>';
    }
  });

  // Obtener id_ubicacion por sección + calle
  calleSelect.addEventListener('change', async () => {
    const idSeccion = seccionSelect.value;
    const idCalle = calleSelect.value;
    idUbicacionActual = null;

    if (!idSeccion || !idCalle) return;

    try {
      const response = await fetch(`http://107.22.248.129:7001/id-ubicacion/${idSeccion}/${idCalle}`);
      if (!response.ok) throw new Error('No se pudo obtener la ubicación');

      const data = await response.json();
      idUbicacionActual = data.id_ubicacion;

      if (!idUbicacionActual) {
        alert('❌ No se encontró una ubicación válida para esta combinación.');
      } else {
        console.log('✅ id_ubicacion obtenida:', idUbicacionActual);
      }
    } catch (error) {
      console.error('❌ Error al obtener id_ubicacion:', error);
      alert('❌ No se pudo obtener la ubicación. Intenta de nuevo.');
    }
  });

  // Enviar el reporte
  reportForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const incidente = document.getElementById('incidente');
    const seccion = document.getElementById('seccion');
    const calle = document.getElementById('calle');
    const referencia = document.getElementById('referencia');
    const descripcion = document.getElementById('descripcion');

    // Reset feedback
    [incidente, seccion, calle, referencia].forEach(input => {
      input.classList.remove('is-invalid');
    });

    let valid = true;

    if (!incidente.value) {
      incidente.classList.add('is-invalid');
      valid = false;
    }

    if (!seccion.value) {
      seccion.classList.add('is-invalid');
      valid = false;
    }

    if (!calle.value) {
      calle.classList.add('is-invalid');
      valid = false;
    }

    if (!referencia.value.trim()) {
      referencia.classList.add('is-invalid');
      valid = false;
    }

    if (!idUbicacionActual) {
      alert('⚠️ No se puede enviar: no se obtuvo una ubicación válida.');
      valid = false;
    }

    if (!valid) return;

    const data = {
      id_tipo: parseInt(incidente.value),
      id_ubicacion: idUbicacionActual,
      referencia: referencia.value.trim(),
      descripcion: descripcion.value.trim(),
      id_usuario: parseInt(idUsuario)
    };

    console.log('🟡 Datos enviados:', JSON.stringify(data, null, 2));

    try {
      const res = await fetch('http://107.22.248.129:7001/reportes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Error del servidor: ${errText}`);
      }

      alert('✅ Reporte enviado correctamente');
      reportForm.reset();
      document.getElementById('contador-descripcion').textContent = '0 / 255 caracteres';
      reportModal.classList.remove('show');

    } catch (err) {
      console.error('❌ Error al enviar el reporte:', err);
      alert('❌ No se pudo enviar el reporte. Revisa la consola.');
    }

    // Refrescar después de 1.5 segundos
    setTimeout(() => {
      location.reload();
    }, 1500);
  });
});
