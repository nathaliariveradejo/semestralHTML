const baseURL = "https://localhost:7003";

async function iniciarSesion(){
    var correoInicio = document.getElementById("correo").value;
    var contraseñaInicio = document.getElementById("password").value;

    const usuario = await verificarCorreoYPassword(correoInicio, contraseñaInicio);

    if(correoInicio == "" || contraseñaInicio == ""){
        alert("Porfavor, llena los espacios solicitados...");
    } else if(usuario !== undefined ){
        alert("Bienvenido de vuelta...")
        // Guardar usuario en la memoria del navegador para mantener la sesion
        localStorage.setItem("usuarioEnSession", JSON.stringify(usuario));
        window.location.href = '../index.html';
    }else{
        alert("Correo o contraseña incorrecta.");
    }
}

async function verificarCorreoYPassword(correo, password) {
    console.log(correo, password)
    const usuarios = await getTodosLosUsuarios();
    const usuarioExistente = usuarios.find((usuario) => usuario.correo_Electrónico === correo);
    console.log({usuarioExistente});

    if (usuarioExistente !== undefined && usuarioExistente.contraseña === password) {
        return usuarioExistente;
    }
}

function irRegistro(){
    document.getElementById("registro").style.display = "initial";
    document.getElementById("login").style.display = "none";
}

function irLogin(){
    document.getElementById("login").style.display = "initial";
    document.getElementById("registro").style.display = "none";
}

async function getTodosLosUsuarios() {
    const getAllUsersResponse = await fetch(`${baseURL}/User`);
    return await getAllUsersResponse.json();
}

async function crearCuenta(){
    var nombre1 = document.getElementById("registro_nombre").value;
    var apellido1 = document.getElementById("registro_apellido").value;
    var correo1 = document.getElementById("registro_correo").value;
    var direccion1 = document.getElementById("registro_direccion").value;
    var telefono1 = document.getElementById("registro_telefono").value;
    var contraseña1 = document.getElementById("registro_contraseña").value;
    if(nombre1 == ""|| apellido1== "" || correo1 == "" || direccion1 == "" || telefono1 == "" || contraseña1 == ""){
        alert("Porfavor, llena los espacios solicitados...");
    }else{
        var postUserBody = {
            nombre : nombre1,
            apellido : apellido1,
            correo_Electrónico : correo1,
            dirección : direccion1,
            teléfono : telefono1,
            contraseña : contraseña1,
            tipo: 'Cliente' // Cambiar cuando agreguemos vistas de Administrador
        };

        var continuarCrearCuenta;
        var usuario;

        try {
            const postUserResponse = await crearUsuario(postUserBody);
            usuario = await postUserResponse.json();
            continuarCrearCuenta = true;
        } catch(err) {
            alert("Ya existe una cuenta con el correo electrónico introducido. Favor de ingresar uno nuevo.")
            continuarCrearCuenta = false;
        }

        if (continuarCrearCuenta === true) {
            document.getElementById("correo").value = usuario.correo_Electrónico;
            document.getElementById("password").value = usuario.contraseña;
            alert("Felicidades!, tu cuenta fue creada con exito...");
            document.getElementById("registro").style.display ="none";
            document.getElementById("login").style.display ="initial";
        }
    }
}

async function crearUsuario(postUserBody){
    return await fetch(`${baseURL}/User`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(postUserBody),
    });
}



function cambiarContraseña(){
    var correo2 = document.getElementById("recovery_correo").value;
    var contraseñaNew = document.getElementById("nueva_contraseña").value;

    if(correo2 == "" || contraseñaNew == ""){
        alert("Porfavor, llena los espacios solicitados...");
    }else if(correo2 != datos.correo){
        alert("El correo es incorrecto...");
    }else{
        datos.contraseña = contraseñaNew;   

        alert("Tu contraseña fue actualizada con exito...");
    }

}

document.getElementById('mostrar/ocultar').addEventListener('click', function () {
    const contraseña = document.getElementById('password');
    const visible = contraseña.getAttribute('type') === 'password';
 
    // Alternar el tipo de input entre 'password' y 'text'
    contraseña.setAttribute('type', visible ? 'text' : 'password');
  
    // Cambiar el icono del botón
    document.getElementById("mostrar").style.display = visible ? 'none' : 'inline';
    document.getElementById("ocultar").style.display = visible ? 'inline' : 'none';;
  });