const formulario = document.getElementById('formulario');
const inputs = document.querySelectorAll('#formulario input, #formulario select');

const expresiones = {
    nombre: /^[a-zA-ZÀ-ÿ\s]{1,18}$/,
    apellido_paterno: /^[a-zA-ZÀ-ÿ\s]{1,18}$/,
    apellido_materno: /^[a-zA-ZÀ-ÿ\s]{1,18}$/,
    correo: /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.com$/, 
    password: /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,15}$/,
    confirm_password: /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,15}$/,
    seccion: /^[1-9][0-9]*$/, 
    calle: /^[1-9][0-9]*$/
};

const campos = {
    nombre: false,
    apellido_paterno: false,
    apellido_materno: false,
    correo: false,
    password: false,
    confirm_password: false,
    seccion: false,
    calle: false
};

const validarCampo = (expresion, input, campo) => {
    if (expresion.test(input.value)) {
        document.getElementById(`group_${campo}`).classList.remove('formulario_grupo-incorrecto');
        document.getElementById(`group_${campo}`).classList.add('formulario_grupo-correcto');
        campos[campo] = true;
    } else {
        document.getElementById(`group_${campo}`).classList.add('formulario_grupo-incorrecto');
        document.getElementById(`group_${campo}`).classList.remove('formulario_grupo-correcto');
        campos[campo] = false;
    }
};

const validarSelects = () => {
    const seccionSelect = document.getElementById('seccion');
    const calleSelect = document.getElementById('calle');
    const grupoSelect = document.getElementById('group_seleccion');

    const seccionValida = expresiones.seccion.test(seccionSelect.value);
    const calleValida = expresiones.calle.test(calleSelect.value);

    if (seccionValida && calleValida) {
        grupoSelect.classList.remove('formulario_grupo-incorrecto');
        grupoSelect.classList.add('formulario_grupo-correcto');
        campos['seccion'] = true;
        campos['calle'] = true;
    } else {
        grupoSelect.classList.add('formulario_grupo-incorrecto');
        grupoSelect.classList.remove('formulario_grupo-correcto');
        campos['seccion'] = false;
        campos['calle'] = false;
    }
};

const validarPassword2 = () => {
    const inputPassword1 = document.getElementById('password');
    const inputPassword2 = document.getElementById('confirm_password');

    if (inputPassword1.value !== inputPassword2.value) {
        document.getElementById('group_confirm_password').classList.add('formulario_grupo-incorrecto');
        document.getElementById('group_confirm_password').classList.remove('formulario_grupo-correcto');
        campos['confirm_password'] = false;
    } else {
        document.getElementById('group_confirm_password').classList.remove('formulario_grupo-incorrecto');
        document.getElementById('group_confirm_password').classList.add('formulario_grupo-correcto');
        campos['confirm_password'] = true;
    }
};

const validarFormulario = (e) => {
    switch (e.target.name) {
        case "nombre":
            validarCampo(expresiones.nombre, e.target, 'nombre');
            break;
        case "apellido_paterno":
            validarCampo(expresiones.apellido_paterno, e.target, 'apellido_paterno');
            break;
        case "apellido_materno":
            validarCampo(expresiones.apellido_materno, e.target, 'apellido_materno');
            break;
        case "correo":
            validarCampo(expresiones.correo, e.target, 'correo');
            break;
        case "password":
            validarCampo(expresiones.password, e.target, 'password');
            validarPassword2();
            break;
        case "confirm_password":
            validarPassword2();
            break;
        case "seccion":
        case "calle":
            validarSelects();
            break;
    }
};

inputs.forEach(input => {
    input.addEventListener('keyup', validarFormulario);
    input.addEventListener('blur', validarFormulario);
});

// Además agrega validación al cambiar selects
document.getElementById('seccion').addEventListener('change', validarFormulario);
document.getElementById('calle').addEventListener('change', validarFormulario);

formulario.addEventListener('submit', (e) => {
    e.preventDefault();

    validarSelects(); // validar selects en submit también

    const todosCamposValidos = Object.values(campos).every(campo => campo === true);

    if (todosCamposValidos) {
        document.getElementById('formulario_mensaje').classList.remove('formulario_mensaje-activo');
        document.getElementById('formulario_mensaje_exito').classList.add('formulario-mensaje-exito-activo');

        setTimeout(() => {
            formulario.reset();
            // Limpiar clases
            Object.keys(campos).forEach(campo => {
                const group = document.getElementById(`group_${campo}`);
                if (group) group.classList.remove('formulario_grupo-correcto', 'formulario_grupo-incorrecto');
                campos[campo] = false;
            });
            document.getElementById('formulario_mensaje_exito').classList.remove('formulario-mensaje-exito-activo');
        }, 3000);
    } else {
        document.getElementById('formulario_mensaje').classList.add('formulario_mensaje-activo');
        document.getElementById('formulario_mensaje_exito').classList.remove('formulario-mensaje-exito-activo');

        inputs.forEach(input => {
            if (input.value.trim() !== '') {
                validarFormulario({ target: input });
            }
        });
    }
});
