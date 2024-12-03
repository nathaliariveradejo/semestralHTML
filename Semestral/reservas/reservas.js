//Reservas
const baseURL = "https://localhost:7003";
var locaciones = [];
var serviciosAd = [];
var locacionEnCotizacion = undefined;
var evento;

// Navegación entre páginas


// Inicializar
document.addEventListener('DOMContentLoaded', () => {
  
    const firstPage = document.querySelector('.main__reservas');
    if (firstPage) {
        firstPage.classList.add('active');
        firstPage.style.display = 'flex'; 
    }
});

function mostrarPagina(pagina) {

    document.querySelectorAll('.main__reservas').forEach(p => {
        p.classList.remove('active'); 
        p.style.display = 'none';   
    });


    const selectedPage = document.getElementById(pagina);
    selectedPage.classList.add('active'); 
    selectedPage.style.display = 'flex'; 
}

async function cambiarAServiciosAdicionales() {
    locaciones = [...await getAllLocaciones()];
    serviciosAd = [...await getAllServiciosAd()];
    actualizarCotizacionConLocacion()
    mostrarPagina('servicios-adicionales')
}

async function getAllLocaciones() {
    const getAllLocacionesResponse = await fetch(`${baseURL}/Locacion`, {
        method: 'GET',
    });
    return await getAllLocacionesResponse.json();
}

async function getAllServiciosAd() {
    const getAllServiciosAdResponse = await fetch(`${baseURL}/ServiciosAd`);
    return await getAllServiciosAdResponse.json();
}

// Actualizar cotización
function actualizarCotizacionConServicioAd(checkbox) {
    const valueServicioAd = checkbox.value;
    const textoServicioAd = checkbox.parentElement.textContent.trim()
    const precio = serviciosAd.find(servicio => servicio.nombre_Servicio === valueServicioAd).precio_Servicio;
    actualizarCotizacion(textoServicioAd, precio, checkbox.checked);
}

function actualizarCotizacionConLocacion() {
    var locacionSeleccionada = document.getElementById("locaciones__select");
    var valorLocacion = locacionSeleccionada.value;
    var textoLocacion = locacionSeleccionada.options[locacionSeleccionada.selectedIndex].text;
    const precio = locaciones.find((locacion) => locacion.tipo_Locacion === valorLocacion).precio_Base;
    if (locacionEnCotizacion === undefined) {
        locacionEnCotizacion = { valorLocacion, textoLocacion };
        actualizarCotizacion(textoLocacion, precio, true);
    } else if (locacionEnCotizacion.valorLocacion !== valorLocacion) {
        reemplazarLocacionEnCotizacion(textoLocacion, locacionEnCotizacion.textoLocacion, precio);
        locacionEnCotizacion = { valorLocacion, textoLocacion };
    }
}

function actualizarCotizacion(nombre, precio, appendChild) {
    const fila = document.createElement('tr');
    fila.innerHTML = `
        <td>${nombre}</td>
        <td>
            <input 
                type="number" 
                value="1" 
                min="1" 
                oninput="actualizarCantidad(this, ${precio})" 
                style="width: 50px; text-align: center;">
        </td>
        <td>${precio}</td>
        <td class="total">${precio}</td>
    `;
    const tabla = document.querySelector('#tabla-cotizacion tbody');
    if (appendChild) {
        tabla.appendChild(fila);
    } else {
        [...tabla.rows].forEach(row => {
            if (row.cells[0].innerText === nombre) row.remove();
        });
    }
    calcularTotales();
}

// Actualizar total de una fila al cambiar la cantidad
function actualizarCantidad(input, precioUnitario) {
    const cantidad = parseInt(input.value, 10) || 1; 
    input.value = cantidad; 
    const totalCell = input.closest('tr').querySelector('.total');
    const nuevoTotal = (cantidad * precioUnitario).toFixed(2);
    totalCell.innerText = nuevoTotal;

    calcularTotales();
}

function reemplazarLocacionEnCotizacion(nuevaLocacion, viejaLocacion, precio) {
    const table = document.getElementById("tabla-cotizacion");
    const trs = table.getElementsByTagName("tr");
    for (let i = 0; i < trs.length; i++) {
        if (trs[i].textContent.includes(viejaLocacion)) {
            table.deleteRow(i);
            break;
        }
    }
    actualizarCotizacion(nuevaLocacion, precio, true);
}

// Calcular subtotales
function calcularTotales() {
    const filas = document.querySelectorAll('#tabla-cotizacion tbody tr');
    let subtotal = 0;

    filas.forEach(fila => {
        const total = parseFloat(fila.querySelector('.total').innerText);
        subtotal += total;
    });

    const itbms = (subtotal * 0.07).toFixed(2);
    const totalFinal = (subtotal + parseFloat(itbms)).toFixed(2);

    document.getElementById('subtotal').innerText = subtotal.toFixed(2);
    document.getElementById('itbms').innerText = itbms;
    document.getElementById('total').innerText = totalFinal;
}

function procesarPagoReservacion() {
    if (localStorage.getItem("usuarioEnSession") !== null) {
        mostrarPagina('pagos');
    } else {
        alert("Favor de iniciar sesión.")
    }
}


async function pagar() {
    const eventoCreado = await crearEvento();
    evento = eventoCreado;
    await crearDetalleServicio(eventoCreado.iD_Evento);
    await crearFactura(eventoCreado.iD_Evento);
    exportarPDF();
}

async function crearEvento() {
    const tipoEventoSelect = document.getElementById("tipo-evento");
    const userId = JSON.parse(localStorage.getItem("usuarioEnSession")).iD_Usuario;
    const locacionId = locaciones.find(locacion => locacion.tipo_Locacion === locacionEnCotizacion.valorLocacion).iD_Locacion;
    const fecha = document.getElementById("fecha").value;
    const hora = document.getElementById("hora").value;
    const cantidadPersonas = document.getElementById("cantidad-personas").value;
    const postEventoResponse = await fetch(`${baseURL}/Eventos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            tipo_Evento: tipoEventoSelect.value,
            fecha_Evento: fecha,
            hora_Evento: hora,
            número_Personas: cantidadPersonas,
            iD_Usuario: userId,
            iD_Locacion: locacionId,
        }),
    });
    return await postEventoResponse.json();
}

async function crearDetalleServicio(eventoId) {
    const listaServicios = document.querySelector('.lista-servicios');
    const serviciosAdSeleccionados = listaServicios.querySelectorAll('input[type="checkbox"]:checked');
    Array.from(serviciosAdSeleccionados).map(async (servicioAdSeleccionado) => {
        const servicioAd = servicioAdSeleccionado.value;
        const idServicioAd = serviciosAd.find(servicio => servicio.nombre_Servicio === servicioAd).iD_Servicio;
        const postDetallesServiciosResponse = await fetch(`${baseURL}/DetallesServicios`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                iD_Eventos: eventoId,
                iD_Servicio: idServicioAd,
                notas_Adicionales: 'Esto es una nota adicional',
            }),
        });
        const createdDetallesServicios = await postDetallesServiciosResponse.json();
    });
}

async function crearFactura(idEvento) {
    var metodoDePago = document.getElementById("metodo__pago").value;
    const total = parseFloat(document.getElementById('total').innerText);
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0'); // JavaScript months are 0-indexed
    const day = String(today.getDate()).padStart(2, '0');
    const fecha = `${year}-${month}-${day}`;
    const postFacturaResponse = await fetch(`${baseURL}/Facturas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            iD_Evento: idEvento,
            fecha_Factura: fecha,
            método_Pago: metodoDePago,
            estado_Pago: 'Pendiente',
            monto_Total: total,
        }),
    });
    return await postFacturaResponse.json();
}

// Exportar factura como PDF
function exportarPDF() {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();

    // Título del PDF
    pdf.setFontSize(18);
    pdf.text("Factura de Cotización - Magnolia Eventos", 10, 10);

    // Encabezado
    pdf.setFontSize(12);
    pdf.text("Fecha: " + new Date().toLocaleDateString(), 10, 20);

    // Tabla de cotización
    const filas = document.querySelectorAll('#tabla-cotizacion tbody tr');
    let tablaDatos = [];
    filas.forEach(fila => {
        const servicio = fila.cells[0].innerText;
        const cantidad = fila.cells[1].innerText;
        const precio = fila.cells[2].innerText;
        const total = fila.cells[3].innerText;
        tablaDatos.push([servicio, cantidad, `$${precio}`, `$${total}`]);
    });

    // Subtotal, ITBMS y Total
    const subtotal = document.getElementById('subtotal').innerText;
    const itbms = document.getElementById('itbms').innerText;
    const total = document.getElementById('total').innerText;

    // Añadir tabla al PDF
    pdf.autoTable({
        head: [["Servicio", "Cantidad", "Precio Unitario", "Total"]],
        body: tablaDatos,
        startY: 30,
    });

    // Resumen de totales
    const finalY = pdf.autoTable.previous.finalY + 10;
    pdf.text(`Subtotal: $${subtotal}`, 10, finalY);
    pdf.text(`ITBMS (7%): $${itbms}`, 10, finalY + 10);
    pdf.text(`Total: $${total}`, 10, finalY + 20);

    // Guardar el PDF
    pdf.save("Factura_Cotizacion.pdf");
}


//cambio de interfaz


// Cambiar fondo para todas las secciones y locación
document.addEventListener("DOMContentLoaded", function () {
    const selectElement = document.querySelector("#locaciones__select");
    const reservaSections = document.querySelectorAll(".main__reservas");
    const locationText = document.querySelector(".formulario__locacion span");

    // Estado inicial: Aire Libre
    selectElement.innerHTML = `
        <option value="Playa">Playa</option>
        <option value="Lago">Lago</option>
        <option value="Bosque">Bosque</option>
        <option value="Jardín">Jardín</option>
        <option value="Piscina">Piscina</option>
    `;
    // Cambiar fondo y texto inicial
    reservaSections.forEach(section => {
        section.style.backgroundImage = "url('../img/BG_IMGS/reservas.pn')";
    });
    locationText.textContent = "Aire Libre (Baño Incluido)";
});

// Cambiar a Bajo Techo
document.getElementById("bajo-techo-btn").addEventListener("click", function () {
    const selectElement = document.querySelector("#locaciones__select");
    const reservaSections = document.querySelectorAll(".main__reservas");
    const locationText = document.querySelector(".formulario__locacion span");

    // Cambiar opciones de locación para Bajo Techo
    selectElement.innerHTML = `
        <option value="Vista_al_Mar">Vista al Mar</option>
        <option value="Vista_al_Lago">Vista al lago</option>
        <option value="Vista_a_la_Montaña">Vista a la Montaña</option>
        <option value="Capilla">Capilla</option>
        <option value="Terraza">Salón</option>
    `;

    // Cambiar fondo a Bajo Techo para todas las secciones
    reservaSections.forEach(section => {
        section.style.backgroundImage = "url('../img/BG_IMGS/reservas__bajotecho.jpg')";
    });
    locationText.textContent = "Bajo Techo";
});

// Cambiar a Aire Libre
document.getElementById("aire-libre-btn").addEventListener("click", function () {
    const selectElement = document.querySelector("#locaciones__select");
    const reservaSections = document.querySelectorAll(".main__reservas");
    const locationText = document.querySelector(".formulario__locacion span");

    // Restaurar opciones de locación para Aire Libre
    selectElement.innerHTML = `
        <option value="Playa">Playa</option>
        <option value="Lago">Lago</option>
        <option value="Bosque">Bosque</option>
        <option value="Jardín">Jardín</option>
        <option value="Piscina">Piscina</option>
    `;
    // Cambiar fondo a Aire Libre para todas las secciones
    reservaSections.forEach(section => {
        section.style.backgroundImage = "url('../img/BG_IMGS/reservas.pn')";
    });
    locationText.textContent = "Aire Libre";
});


document.addEventListener("DOMContentLoaded", function () {
    const formularioReserva = document.querySelector(".formulario__reservas");
    const cantidadPersonasInput = document.getElementById("cantidad-personas");
    const tipoEventoSelect = document.getElementById("tipo-evento");

    // Obtener el valor de cantidad de personas y tipo de evento
    function obtenerDatosReserva() {
        const cantidadPersonas = cantidadPersonasInput.value;
        const tipoEvento = tipoEventoSelect.value;

        // Asegurarse de que la cantidad de personas no supere 100


        // Puedes hacer algo con estos datos (por ejemplo, agregarlo a la cotización)
        console.log(`Cantidad de personas: ${cantidadPersonas}`);
        console.log(`Tipo de evento: ${tipoEvento}`);

        // Aquí puedes continuar con la lógica de cotización o redirigir a la siguiente página
    }

    // Para capturar los datos al hacer clic en el botón "Siguiente"
    document.querySelector(".reserva__next__button").addEventListener("click", function () {
        obtenerDatosReserva();
    });
});

function cambiarLocacion(){
    var locacion = document.getElementById("locaciones__select").value;
    const locationText = document.getElementById("nombre-locacion");

    switch(locacion){
        case "Playa":            
            locationText.innerText = 'Playa📍';
            break;
        case "Lago":
            locationText.innerText = 'Lago📍';
            break;
        case "Bosque":
            locationText.innerText = 'Bosque📍';
            break;
        case "Jardín":
            locationText.innerText = 'Jardín📍';
            break;
        case "Piscina":
            locationText.innerText = 'Piscina📍';
            break;
        case "Vista_al_Mar":
            locationText.innerText = 'Vista a la playa📍';
            break;
        case "Vista_al_Lago":
            locationText.innerText = 'Vista al lago📍';
            break;
        case "Vista_a_la_Montaña":
            locationText.innerText = 'Vista al bosque📍';
            break;
        case "Capilla":
            locationText.innerText = 'Capilla📍';
            break;
        case "Invernadero":
            locationText.innerText = 'Salón📍';
            break;
    }
}


document.getElementById("bajo-techo-btn").addEventListener("click", function () {
    const selectElement = document.querySelector("#locaciones__select");
    const reservaSections = document.querySelectorAll(".main__reservas");
    const locationText = document.querySelector(".formulario__locacion span");

    // Cambiar opciones de locación para Bajo Techo
    selectElement.innerHTML = `
        <option value="Vista_al_Mar">Vista al Mar</option>
        <option value="Vista_al_Lago">Vista al lago</option>
        <option value="Vista_a_la_Montaña">Vista a la Montaña</option>
        <option value="Capilla">Capilla</option>
        <option value="Invernadero">Salón</option>
    `;

    // Cambiar fondo a Bajo Techo para todas las secciones
    reservaSections.forEach(section => {
        section.style.backgroundImage = "url('../img/BG_IMGS/reservas__bajotecho.jpg')";
    });
    locationText.textContent = "Bajo Techo";
    // Si ya hay una locación seleccionada, cambiar la de acuerdo al nuevo contexto
    cambiarLocacion();
});

// Cambiar a Aire Libre
document.getElementById("aire-libre-btn").addEventListener("click", function () {
    const selectElement = document.querySelector("#locaciones__select");
    const reservaSections = document.querySelectorAll(".main__reservas");
    const locationText = document.querySelector(".formulario__locacion span");

    // Restaurar opciones de locación para Aire Libre
    selectElement.innerHTML = `
        <option value="Playa">Playa</option>
        <option value="Lago">Lago</option>
        <option value="Bosque">Bosque</option>
        <option value="Jardin">Jardín</option>
        <option value="Piscina">Piscina</option>
    `;
    // Cambiar fondo a Aire Libre para todas las secciones
    reservaSections.forEach(section => {
        section.style.backgroundImage = "url('../img/BG_IMGS/reservas.pn')";
    });
    locationText.textContent = "Aire Libre (Baño Incluido)";
    // Si ya hay una locación seleccionada, cambiar la de acuerdo al nuevo contexto
    cambiarLocacion();
});

function cambiarFecha() {
    const fecha = document.getElementById("fecha").value;

    const [year, month, day] = fecha.split("-");

    const meses = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    const fechaNueva = `${parseInt(day)} de ${meses[parseInt(month) - 1]} ${year}`;

    document.getElementById("fecha-mostrada").innerText = fechaNueva;
}

function cambiarHora(){
    document.getElementById("hora-mostrada").innerText = document.getElementById("hora").value;
}



document.addEventListener("DOMContentLoaded", function () {
    const cantidadPersonasInput = document.getElementById("cantidad-personas");
    const tipoEventoSelect = document.getElementById("tipo-evento");
    const siguienteBtn = document.querySelector(".reserva__next__button"); // Botón siguiente
    const cantidadPersonasCotizacion = document.getElementById("cantidad-personas-cotizacion");
    const tipoEventoCotizacion = document.getElementById("tipo-evento-cotizacion");

    // Función para habilitar o deshabilitar el botón siguiente
    function validarCantidadPersonas() {
        const cantidadPersonas = cantidadPersonasInput.value;
        
        // Deshabilitar el botón si la cantidad de personas no es válida
        if (cantidadPersonas < 1 || cantidadPersonas > 100) {
            siguienteBtn.disabled = true;
        } else {
            siguienteBtn.disabled = false;
        }
    }

    // Llamamos a la validación al cargar la página y cada vez que el usuario cambia el valor
    cantidadPersonasInput.addEventListener("input", validarCantidadPersonas);

    // Validar inicialmente en caso de que haya un valor en el campo
    validarCantidadPersonas();

    // Guardar los datos de la reserva al hacer clic en "Siguiente"
    document.querySelector(".reserva__next__button").addEventListener("click", function () {
        const cantidadPersonas = cantidadPersonasInput.value;
        const tipoEvento = tipoEventoSelect.value;

        // Asegurarse de que la cantidad de personas no supere 100
        if (cantidadPersonas < 1 || cantidadPersonas > 100) {
            alert("La cantidad de personas debe estar entre 1 y 100.");
            return;
        }

        // Mostrar la cantidad de personas y el tipo de evento en la cotización
        cantidadPersonasCotizacion.innerText = cantidadPersonas;
        tipoEventoCotizacion.innerText = tipoEvento;
    });
});



document.addEventListener("DOMContentLoaded", function () {
    const fechaInput = document.getElementById("fecha");
    
    // Obtener la fecha de hoy y calcular la fecha límite (14 días después)
    const hoy = new Date();
    const limiteFecha = new Date(hoy);
    limiteFecha.setDate(hoy.getDate() + 14);
    
    // Formatear la fecha límite en formato YYYY-MM-DD
    const year = limiteFecha.getFullYear();
    const month = String(limiteFecha.getMonth() + 1).padStart(2, '0'); // Mes de 2 dígitos
    const day = String(limiteFecha.getDate()).padStart(2, '0'); // Día de 2 dígitos
    
    // Establecer el valor mínimo para el campo de fecha
    fechaInput.setAttribute('min', `${year}-${month}-${day}`);
});

// Mostrar modal al hacer clic en "Pagar"
document.getElementById('paymentForm').addEventListener('submit', function (event) {
    event.preventDefault(); // Prevenir el envío del formulario
    document.getElementById('modalExito').style.display = 'flex'; // Mostrar modal
});

// Función para redirigir a la sección de reservas
function redireccionarAReservas() {
    window.location.href = '../usuario_perfil/perfil.html'; // Redirige a la página de reservas
}

// Función para volver al inicio
function volverAlInicio() {
    window.location.href = '../index.html'; // Redirige al inicio
}

// Función para cancelar el pago y cerrar el formulario
function cancelarPago() {
    window.location.href = "reserva.html"; // Redirige a la página de inicio
}

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('modalExito').style.display = 'none'; // Ocultar el modal al cargar la página
});

document.getElementById('paymentForm').addEventListener('submit', function (event) {
    event.preventDefault(); // Prevenir el envío del formulario
    document.getElementById('modalExito').style.display = 'flex'; // Mostrar modal
});