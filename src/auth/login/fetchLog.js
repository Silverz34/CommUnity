document.addEventListener('DOMContentLoaded', () => {
    const formulario = document.getElementById('formulario');
    const inputs = document.querySelectorAll('#formulario input');
    const btnLogin = document.querySelector('.btn-login'); 

    if (!formulario || !btnLogin) {
        console.error("No se encontró el formulario o el botón de login.");
        return;
    }
    const expresiones = {
        correo: /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.com$/,
        contraseña: /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,15}$/,
    };

    const campos = {
        correo: false,
        contraseña: false
    };
    const limpiarInput = (valor) => {
        let valorLimpio = valor.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA70}-\u{1FAFF}]/gu, '');
        valorLimpio = valorLimpio.replace(/\s/g, '');
        return valorLimpio;
    };

    const validarCampo = (expresion, input, campo) => {
        const grupo = document.getElementById(`group_${campo === 'contraseña' ? 'password' : campo}`);
        if (!grupo) return;

        if (expresion.test(input.value)) {
            grupo.classList.remove('formulario_grupo-incorrecto');
            grupo.classList.add('formulario_grupo-correcto');
            campos[campo] = true;
        } else {
            grupo.classList.add('formulario_grupo-incorrecto');
            grupo.classList.remove('formulario_grupo-correcto');
            campos[campo] = false;
        }
    };

    const validarFormulario = (e) => {
        switch (e.target.name) {
            case 'correo':
                validarCampo(expresiones.correo, e.target, 'correo');
                break;
            case 'contraseña':
                validarCampo(expresiones.contraseña, e.target, 'contraseña');
                break;
        }
    };

    inputs.forEach((input) => {
        // Limpiar contenido en tiempo real
        input.addEventListener('input', (e) => {
            const valorOriginal = e.target.value;
            const valorLimpio = limpiarInput(valorOriginal);
            
            if (valorOriginal !== valorLimpio) {
                e.target.value = valorLimpio;
                // Disparar evento de validación después de limpiar
                validarFormulario(e);
            }
        });

        input.addEventListener('paste', (e) => {
            e.preventDefault();
            const pastedText = (e.clipboardData || window.clipboardData).getData('text');
            const textoLimpio = limpiarInput(pastedText);
            
            e.target.value += textoLimpio;
            // Disparar evento de input después del pegado
            e.target.dispatchEvent(new Event('input'));
        });

        input.addEventListener('keyup', validarFormulario);
        input.addEventListener('blur', validarFormulario);
    });

    const mostrarMensaje = (tipo, texto) => {
        const mensajeElemento = document.getElementById('formulario_mensaje');
        const mensajeTexto = document.getElementById('mensaje_texto');
        const mensajeExito = document.getElementById('formulario_mensaje_exito');

        if (!mensajeElemento || !mensajeTexto) return;

        if (tipo === 'error') {
            mensajeTexto.textContent = texto;
            mensajeElemento.classList.add('formulario_mensaje-activo');
            if (mensajeExito) mensajeExito.classList.remove('formulario-mensaje-exito-activo');
        } else if (tipo === 'exito') {
            mensajeTexto.textContent = texto;
            if (mensajeExito) mensajeExito.classList.add('formulario-mensaje-exito-activo');
            mensajeElemento.classList.remove('formulario_mensaje-activo');
        }
    };

    formulario.addEventListener('submit', async (e) => {
        e.preventDefault();

        btnLogin.disabled = true;
        const textoOriginal = btnLogin.textContent;
        btnLogin.textContent = 'Iniciando...';

        const todosCamposValidos = Object.values(campos).every(campo => campo === true);
        if (!todosCamposValidos) {
            mostrarMensaje('error', 'Por favor, completa todos los campos correctamente.');
            btnLogin.disabled = false;
            btnLogin.textContent = textoOriginal;
            return;
        }

        const correo = document.getElementById('correo').value;
        const contraseña = document.getElementById('contraseña').value;

        try {
            const response = await fetch('http://107.22.248.129:7001/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ correo, contraseña })
            });

            const responseText = await response.text();
            console.log("Respuesta cruda del backend:", responseText);

            if (!response.ok) {
                try {
                    const errorData = JSON.parse(responseText);
                    const errorMessage = errorData.message || errorData.error || 'Credenciales incorrectas';
                    mostrarMensaje('error', errorMessage);
                } catch {
                    mostrarMensaje('error', 'Correo o contraseña incorrectos');
                }
                return;
            }

            let data;
            try {
                data = JSON.parse(responseText);
                console.log("Respuesta parseada:", data);
            } catch (error) {
                console.error("Error al parsear JSON:", error);
                mostrarMensaje('error', 'Error en la respuesta del servidor');
                return;
            }

            if (!data.id || isNaN(data.id)) {
                mostrarMensaje('error', 'El servidor no devolvió un ID de usuario válido.');
                return;
            }

            localStorage.setItem("id_usuario", data.id);
            localStorage.setItem("usuario", JSON.stringify(data));
            console.log("ID del usuario logueado:", data.id);

            mostrarMensaje('exito', '¡Inicio de sesión exitoso!');

            setTimeout(() => {
                if (data.es_admin) {
                    window.location.href = "/src/features/Gestion/index_admin.html";
                } else {
                    window.location.href = "/src/features/Reportes/reportes.html";
                }
            }, 2000);

        } catch (error) {
            console.error("Error al intentar iniciar sesión:", error);
            mostrarMensaje('error', 'Error de conexión. Intenta nuevamente.');
        } finally {
            btnLogin.disabled = false;
            btnLogin.textContent = textoOriginal;
        }
    });

    inputs.forEach(input => {
        input.addEventListener('input', () => {
            const mensajeElemento = document.getElementById('formulario_mensaje');
            const mensajeExito = document.getElementById('formulario_mensaje_exito');

            if (mensajeElemento) mensajeElemento.classList.remove('formulario_mensaje-activo');
            if (mensajeExito) mensajeExito.classList.remove('formulario-mensaje-exito-activo');
        });
    });
});