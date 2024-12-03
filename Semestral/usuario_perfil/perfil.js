const baseURL = "https://localhost:7003";

async function cargarContenido() {
    const evento = await getLatestEvento();
    const factura = await getLatestFactura();
    const detallesServicios = await getAllDetallesServiciosByEvento(evento.iD_Evento);
    const serviciosAdReservados = await getServiciosReservadosByEvento(evento.iD_Evento, detallesServicios);

    document.getElementById("reserva__locacion").textContent = evento.tipo_Evento || "No especificado";
    document.getElementById("reserva__fecha").textContent = evento.fecha_Evento || "No especificada";
    document.getElementById("reserva__hora").textContent = evento.hora_Evento || "No especificada";
    document.getElementById("reserva__pago").textContent = factura.método_Pago || "No especificado";
    document.getElementById("reserva__estado").textContent = factura.estado_Pago || "No especificado";

    const servicesList = document.getElementById("reserva__servicios");
    console.log({servicesList});
    servicesList.innerHTML = "";
    if (serviciosAdReservados.length > 0) {
        serviciosAdReservados.forEach(servicio => {
            const li = document.createElement("li");
            li.textContent = servicio.nombre_Servicio.replaceAll('_', ' ') || "Servicio sin nombre";
            servicesList.appendChild(li);
        });
    } else {
        const li = document.createElement("li");
        li.textContent = "No hay servicios reservados.";
        servicesList.appendChild(li);
    }
}

async function getLatestEvento() {
    const iDUsuario = JSON.parse(localStorage.getItem("usuarioEnSession")).iD_Usuario
    const getAllEventosResponse = await fetch(`${baseURL}/Eventos`);
    const eventos = await getAllEventosResponse.json();
    const eventoMasReciente = eventos
        .filter(evento => evento.iD_Usuario ===iDUsuario)
        .reduce(function(prev, current) {
        return prev.iD_Evento > current.iD_Evento ? prev : current
    }, {});
    return eventoMasReciente;
}

async function getLatestFactura() {
    const getAllFacturasResponse = await fetch(`${baseURL}/Facturas`);
    const facturas = await getAllFacturasResponse.json();
    const facturaMasReciente = facturas.reduce(function(prev, current) {
        return prev.iD_Factura > current.iD_Factura ? prev : current
    }, {});
    return facturaMasReciente;
}

async function getAllDetallesServiciosByEvento(idEvento) {
    const getAllDetallesServiciosResponse = await fetch(`${baseURL}/DetallesServicios`);
    const detallesServicios = await getAllDetallesServiciosResponse.json();
    return detallesServicios.filter(detalleServicio => detalleServicio.iD_Eventos === idEvento);
}

async function getServiciosReservadosByEvento(idEvento, detallesServicios) {
    const getAllServiciosAdResponse = await fetch(`${baseURL}/ServiciosAd`);
    const serviciosAd = await getAllServiciosAdResponse.json();
    const idsServiciosReservados = new Set(detallesServicios.map(detallesServicio => detallesServicio.iD_Servicio));
    return serviciosAd.filter(servicioAd => idsServiciosReservados.has(servicioAd.iD_Servicio));
}

window.onload = cargarContenido();