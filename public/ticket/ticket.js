document.getElementById("searchInputActivos")?.addEventListener("input", filtrarTickets);
document.getElementById("searchInputListos")?.addEventListener("input", filtrarTickets);

let tickets = [];
let todosLosTickets = [];
let tipos = [];
let usuarios = [];
let estados = [];

let ticketsActivos = [];
let ticketsListos = [];

let ticketsFiltradosActivos = [];
let ticketsFiltradosListos = [];

let paginaActualActivos = 1;
let paginaActualListos = 1;


const token = localStorage.getItem("token");
const usuario = JSON.parse(localStorage.getItem("usuario"));
const tabla = document.getElementById("statusTableBody");
const mensajeVacio = document.querySelector(".tab-pane.active #mensajeVacio");
const ticketModal = new bootstrap.Modal(document.getElementById("ticketModal"));

function getSearchInputActivo() {
  const activeTab = document.querySelector(".tab-pane.active")?.id;
  if (activeTab === "activos") {
    return document.getElementById("searchInputActivos");
  } else if (activeTab === "cerrados") {
    return document.getElementById("searchInputListos");
  }
  return null;
}

let paginaActual = 1;
const registrosPorPagina = 15;
let ticketsFiltrados = [];

if (!token || !usuario) {
  mostrarError("No autorizado. Inicia sesión.");
} else {
  cargarTicketsDesdeAPI();
}

async function cargarTicketsDesdeAPI() {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("TOKEN_INVALIDO");
    }

    const headers = { Authorization: `Bearer ${token}` };

    const [ticketsRes, tiposRes, usuariosRes, estadosRes] = await Promise.all([
      fetch("https://tickets.dev-wit.com/api/tickets", { headers }),
      fetch("https://tickets.dev-wit.com/api/tipos", { headers }),
      fetch("https://tickets.dev-wit.com/api/users", { headers }),
      fetch("https://tickets.dev-wit.com/api/estados", { headers })
    ]);

    // Verificar errores 401 en cualquiera de las respuestas
    if ([ticketsRes, tiposRes, usuariosRes, estadosRes].some(res => res.status === 401)) {
      throw new Error("TOKEN_INVALIDO");
    }

    if (!ticketsRes.ok || !tiposRes.ok || !usuariosRes.ok || !estadosRes.ok) {
      throw new Error("Error al obtener datos del servidor");
    }

    const [datosTickets, tiposData, usuariosData, estadosData] = await Promise.all([
      ticketsRes.json(),
      tiposRes.json(),
      usuariosRes.json(),
      estadosRes.json()
    ]);

    // Verificar mensajes de token inválido en las respuestas
    if ([datosTickets, tiposData, usuariosData, estadosData].some(data => data.message === "Token inválido")) {
      throw new Error("TOKEN_INVALIDO");
    }

    tipos = tiposData;
    usuarios = usuariosData;
    estados = estadosData;

    todosLosTickets = datosTickets.map(ticket => enriquecerTicket(ticket));
    tickets = todosLosTickets
      .sort((a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion))
      .slice(0, 200);

    ticketsActivos = tickets.filter(t => t.estado.toLowerCase() !== "listo");
    ticketsListos = tickets.filter(t => t.estado.toLowerCase() === "listo");

    ticketsFiltradosActivos = [...ticketsActivos];
    ticketsFiltradosListos = [...ticketsListos];

    filtrarTickets();

  } catch (error) {
    if (error.message === "TOKEN_INVALIDO") {
      // Limpiar almacenamiento y redirigir
      localStorage.removeItem("token");
      localStorage.removeItem("usuario");
      window.location.href = "../index.html";
    } else {
      console.error("Error al cargar tickets:", error);
      mostrarError("Error al obtener datos del servidor");
    }
  }
}

function enriquecerTicket(ticket) {
  const tipo = tipos.find(t => t.nombre === ticket.tipo_atencion);
  const estadoObj = estados.find(e => e.id === ticket.id_estado);

  let ejecutorNombre = "-";
  let correoEjecutor = "-";

  if (tipo) {
    ejecutorNombre = tipo.ejecutor_nombre || "-";
    const ejecutorUsuario = usuarios.find(u => String(u.id) === String(tipo.ejecutor_id));
    correoEjecutor = ejecutorUsuario?.email || "-";
  }

  return {
    ...ticket,
    ejecutor: ejecutorNombre,
    corre_ejecutor: correoEjecutor,
    estado: estadoObj?.nombre || "-"
  };
}

document.querySelectorAll('#statusTabs .nav-link').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#statusTabs .nav-link').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    const target = btn.getAttribute('data-bs-target');
    document.querySelector(target).classList.add('active');
    getSearchInputActivo()?.dispatchEvent(new Event("input"));



    if (target === "#activos") {
      renderizarTicketsActivos();
      actualizarPaginacionActivos();
    } else if (target === "#cerrados") {
      renderizarTicketsListos();
      actualizarPaginacionListos();
    }
  });
});

function filtrarTickets() {
  const searchInput = getSearchInputActivo();
  const termino = searchInput?.value.toLowerCase().trim() || "";
  const activeTab = document.querySelector(".tab-pane.active")?.id;

  if (activeTab === "activos") {
    ticketsFiltradosActivos = ticketsActivos.filter(ticket =>
      ticket.id.toString().includes(termino) ||
      ticket.observaciones?.toLowerCase().includes(termino) ||
      ticket.estado?.toLowerCase().includes(termino) ||
      ticket.solicitante?.toLowerCase().includes(termino) ||
      ticket.area?.toLowerCase().includes(termino) ||
      ticket.tipo_atencion?.toLowerCase().includes(termino) ||
      ticket.ejecutor?.toLowerCase().includes(termino)
    );
    paginaActualActivos = 1;
    renderizarTicketsActivos();
    actualizarPaginacionActivos();

  } else if (activeTab === "cerrados") {
    ticketsFiltradosListos = ticketsListos.filter(ticket =>
      ticket.id.toString().includes(termino) ||
      ticket.observaciones?.toLowerCase().includes(termino) ||
      ticket.estado?.toLowerCase().includes(termino) ||
      ticket.solicitante?.toLowerCase().includes(termino) ||
      ticket.area?.toLowerCase().includes(termino) ||
      ticket.tipo_atencion?.toLowerCase().includes(termino) ||
      ticket.ejecutor?.toLowerCase().includes(termino)
    );
    paginaActualListos = 1;
    renderizarTicketsListos();
    actualizarPaginacionListos();
  }
}

function renderizarTicketsActivos() {
  const tabla = document.getElementById("statusTableBody");
  tabla.innerHTML = "";
  const inicio = (paginaActualActivos - 1) * registrosPorPagina;
  const fin = inicio + registrosPorPagina;
  const ticketsPagina = ticketsFiltradosActivos.slice(inicio, fin);

  if (ticketsPagina.length === 0) {
    mostrarMensajeVacio("No se encontraron tickets");
    return;
  }

  ticketsPagina.forEach(ticket => {
    const row = crearFilaTicket(ticket);
    tabla.appendChild(row);
  });

  document.getElementById("paginacion-info").textContent = `Mostrando ${ticketsPagina.length} de ${ticketsFiltradosActivos.length} tickets`;
}

function renderizarTicketsListos() {
  const tabla = document.getElementById("statusTableBodyCerrados");
  tabla.innerHTML = "";
  const inicio = (paginaActualListos - 1) * registrosPorPagina;
  const fin = inicio + registrosPorPagina;
  const ticketsPagina = ticketsFiltradosListos.slice(inicio, fin);

  if (ticketsPagina.length === 0) {
    mostrarMensajeVacioCerrados("No se encontraron tickets listos");
    return;
  }

  ticketsPagina.forEach(ticket => {
    const row = crearFilaTicket(ticket);
    tabla.appendChild(row);
  });

  document.getElementById("paginacion-info-cerrados").textContent = `Mostrando ${ticketsPagina.length} de ${ticketsFiltradosListos.length} tickets`;
}

function actualizarPaginacionActivos() {
  const totalPaginas = Math.ceil(ticketsFiltradosActivos.length / registrosPorPagina);
  const contenedor = document.getElementById("paginacion-control");
  contenedor.innerHTML = "";
  if (totalPaginas <= 1) return;

  const crear = (texto, deshabilitado, click) => {
    const li = document.createElement("li");
    li.className = `page-item ${deshabilitado ? "disabled" : ""}`;
    li.innerHTML = `<a class="page-link" href="#">${texto}</a>`;
    li.addEventListener("click", e => {
      e.preventDefault();
      if (!deshabilitado) click();
    });
    contenedor.appendChild(li);
  };

  crear("«", paginaActualActivos === 1, () => { paginaActualActivos--; renderizarTicketsActivos(); actualizarPaginacionActivos(); });
  for (let i = 1; i <= totalPaginas; i++) {
    crear(i, i === paginaActualActivos, () => { paginaActualActivos = i; renderizarTicketsActivos(); actualizarPaginacionActivos(); });
  }
  crear("»", paginaActualActivos === totalPaginas, () => { paginaActualActivos++; renderizarTicketsActivos(); actualizarPaginacionActivos(); });
}

function actualizarPaginacionListos() {
  const totalPaginas = Math.ceil(ticketsFiltradosListos.length / registrosPorPagina);
  const contenedor = document.getElementById("paginacion-control-cerrados");
  contenedor.innerHTML = "";
  if (totalPaginas <= 1) return;

  const crear = (texto, deshabilitado, click) => {
    const li = document.createElement("li");
    li.className = `page-item ${deshabilitado ? "disabled" : ""}`;
    li.innerHTML = `<a class="page-link" href="#">${texto}</a>`;
    li.addEventListener("click", e => {
      e.preventDefault();
      if (!deshabilitado) click();
    });
    contenedor.appendChild(li);
  };

  crear("«", paginaActualListos === 1, () => { paginaActualListos--; renderizarTicketsListos(); actualizarPaginacionListos(); });
  for (let i = 1; i <= totalPaginas; i++) {
    crear(i, i === paginaActualListos, () => { paginaActualListos = i; renderizarTicketsListos(); actualizarPaginacionListos(); });
  }
  crear("»", paginaActualListos === totalPaginas, () => { paginaActualListos++; renderizarTicketsListos(); actualizarPaginacionListos(); });
}

function crearFilaTicket(ticket) {
  const row = document.createElement("tr");
  row.innerHTML = `
    <td>${ticket.id}</td>
    <td>${ticket.observaciones || '-'}</td>
    <td>
      <div class="d-flex justify-content-between align-items-center">
        <span class="badge ${getBadgeClass(ticket.estado)}">${ticket.estado || '-'}</span>
        <img src="/img/ojo.png" alt="Ver observación" style="width: 20px; cursor: pointer;" class="ms-2 view-details">
      </div>
    </td>
    <td class="text-center">
      <div class="d-inline-flex gap-2">
        <button class="btn btn-sm btn-outline-primary" onclick="editarEstado()">
          <i class="bi bi-pencil"></i>
        </button>
        <button class="btn btn-sm btn-outline-danger" onclick="eliminarEstado()">
          <i class="bi bi-trash"></i>
        </button>
      </div>
    </td>
  `;
  row.querySelector(".view-details").addEventListener("click", () => mostrarDetallesTicket(ticket));
  return row;
}

function actualizarPaginacion() {
  const totalPaginas = Math.ceil(ticketsFiltrados.length / registrosPorPagina);
  const paginacionControl = document.getElementById("paginacion-control");
  paginacionControl.innerHTML = "";

  if (totalPaginas <= 1) return;

  const crearBoton = (text, disabled, onClick) => {
    const li = document.createElement("li");
    li.className = `page-item ${disabled ? 'disabled' : ''}`;
    li.innerHTML = `<a class="page-link" href="#">${text}</a>`;
    li.addEventListener("click", e => {
      e.preventDefault();
      if (!disabled) onClick();
    });
    paginacionControl.appendChild(li);
  };

  crearBoton("&laquo;", paginaActual === 1, () => { paginaActual--; renderizarTickets(); actualizarPaginacion(); });

  for (let i = Math.max(1, paginaActual - 2); i <= Math.min(totalPaginas, paginaActual + 2); i++) {
    crearBoton(i, i === paginaActual, () => { paginaActual = i; renderizarTickets(); actualizarPaginacion(); });
  }

  crearBoton("&raquo;", paginaActual === totalPaginas, () => { paginaActual++; renderizarTickets(); actualizarPaginacion(); });
}

function mostrarDetallesTicket(ticket) {
  document.getElementById("modalTicketId").textContent = ticket.id;
  document.getElementById("modalSolicitante").textContent = ticket.solicitante || "-";
  document.getElementById("modalArea").textContent = ticket.area || "-";
  document.getElementById("modalTipoAtencion").textContent = ticket.tipo_atencion || "-";
  document.getElementById("modalEjecutor").textContent = ticket.ejecutor || "-";
  document.getElementById("modalCorreoEjecutor").textContent = ticket.corre_ejecutor || "-";
  document.getElementById("modalFechaCreacion").textContent = new Date(ticket.fecha_creacion).toLocaleString();
  document.getElementById("modalObservaciones").textContent = ticket.observaciones || "-";

  const archivoContainer = document.getElementById("modalArchivoPdf");
  archivoContainer.innerHTML = "";

  if (ticket.archivo_pdf) {
    const fullURL = `https://tickets.dev-wit.com/uploads/${encodeURIComponent(ticket.archivo_pdf)}`;
    const enlace = document.createElement("a");
    enlace.href = fullURL;
    enlace.target = "_blank";
    enlace.rel = "noopener noreferrer";
    enlace.textContent = "Ver PDF";
    enlace.classList.add("btn", "btn-sm", "btn-outline-primary");
    archivoContainer.appendChild(enlace);
  } else {
    archivoContainer.textContent = "No hay archivo adjunto";
  }

  ticketModal.show();
}

function mostrarError(mensaje) {
  tabla.innerHTML = `<tr><td colspan="4" class="text-danger text-center">${mensaje}</td></tr>`;
}

function mostrarMensajeVacio(mensaje) {
  if (mensajeVacio) {
    mensajeVacio.style.display = "block";
    mensajeVacio.textContent = mensaje;
  } else {
    tabla.innerHTML = `<tr><td colspan="4" class="text-center text-muted">${mensaje}</td></tr>`;
  }
}

function mostrarMensajeVacioCerrados(mensaje) {
  const mensajeVacio = document.getElementById("mensajeVacioCerrados");
  const tabla = document.getElementById("statusTableBodyCerrados");
  if (mensajeVacio) {
    mensajeVacio.style.display = "block";
    mensajeVacio.textContent = mensaje;
  } else {
    tabla.innerHTML = `<tr><td colspan="4" class="text-center text-muted">${mensaje}</td></tr>`;
  }
}

function getBadgeClass(estado) {
  if (!estado) return "bg-secondary";
  const normalized = estado.trim().toLowerCase();
  if (normalized === "pendiente pa") return "badge-estado-pendientepa";
  if (normalized === "asignado") return "badge-estado-asignado";
  if (normalized === "en ejecución") return "badge-estado-enejecucion";
  if (normalized === "pendiente pp") return "badge-estado-pendientepp";
  if (normalized === "cancelado") return "badge-estado-cancelado";
  if (normalized === "listo") return "badge-estado-listo";  
  if (normalized === "rechazado") return "badge-estado-rechazado";
  return "bg-secondary";
}

const btnActualizar = document.getElementById("btn-actualizar");
if (btnActualizar) {
  btnActualizar.addEventListener("click", async () => {
    const btn = btnActualizar;
    const icono = btn.querySelector("i");

    btn.disabled = true;
    icono.classList.add("spinner-border", "spinner-border-sm");
    icono.classList.remove("bi", "bi-arrow-clockwise");
    btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Actualizando...`;

    await cargarTicketsDesdeAPI();    
    showToast("Éxito", "Lista de tickets actualizada.");

    setTimeout(() => {
      btn.disabled = false;
      icono.className = "bi bi-arrow-clockwise me-1";
      btn.innerHTML = `<i class="bi bi-arrow-clockwise me-1"></i>Actualizar`;
    }, 800);
  });
}
