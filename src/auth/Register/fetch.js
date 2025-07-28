document.addEventListener('DOMContentLoaded', () => {
  const seccionSelect = document.getElementById('seccion');
  const calleSelect = document.getElementById('calle');

  let idUbicacionActual = null;

  // Cargar secciones
  async function cargarSecciones() {
    try {
      const response = await fetch('http://107.22.248.129:7001/secciones');
      if (!response.ok) throw new Error('No se pudieron cargar las secciones');

      const secciones = await response.json();
      seccionSelect.innerHTML = '<option value="" selected disabled>Seleccione una sección</option>';

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

      calleSelect.innerHTML = '<option value="" selected disabled>Selecciona una calle</option>';
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
        console.warn(`⚠️ No se obtuvo id_ubicacion para sección ${idSeccion} y calle ${idCalle}`);
      } else {
        console.log('✅ id_ubicacion obtenida:', idUbicacionActual);
      }
    } catch (error) {
      console.error('❌ Error al obtener id_ubicacion:', error);
      alert('❌ No se pudo obtener la ubicación. Intenta de nuevo.');
    }
  });

  // Manejar el submit del formulario (dentro del DOMContentLoaded para tener acceso a idUbicacionActual)
  document.getElementById("formulario").addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!idUbicacionActual) {
      alert('Por favor selecciona sección y calle válidas antes de enviar.');
      return;
    }

    const nombre = document.getElementById("nombre").value;
    const apellido_paterno = document.getElementById("apellido_paterno").value;
    const apellido_materno = document.getElementById("apellido_materno").value;
    const correo = document.getElementById("correo").value;
    const password = document.getElementById("password").value;

    const userData = {
      nombre: nombre,
      apellido_paterno: apellido_paterno,
      apellido_materno: apellido_materno,
      correo: correo,
      contraseña: password,
      id_ubicacion: idUbicacionActual 
    };

    try {
      const response = await fetch('http://107.22.248.129:7001/usuarios', {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(userData)
      });

      console.log("Status:", response.status);
      console.log("Headers:", response.headers.get("content-type"));

      const responseText = await response.text();
      console.log("Respuesta del servidor:", responseText);

      if (response.ok) {
        try {
          const data = responseText ? JSON.parse(responseText) : {};
          alert("Registro exitoso: " + JSON.stringify(data));
          window.location.href = "/src/auth/login/Login.html";
        } catch (parseError) {
          alert("Registro exitoso: " + responseText);
          window.location.href = "/src/auth/login/Login.html";
        }
      } else {
        try {
          const errorData = responseText ? JSON.parse(responseText) : {};
          alert("Error: " + (errorData.message || errorData.error || "Error desconocido"));
        } catch (parseError) {
          alert("Error: " + responseText);
        }
      }
    } catch (error) {
      console.error("Error al enviar los datos:", error);
      alert("Error de conexión. Intenta nuevamente.");
    }
  });

});
