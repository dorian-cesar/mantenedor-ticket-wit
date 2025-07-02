let tickets = [];
let todosLosTickets = [];
let tipos = [];
let usuarios = [];
let estados = [];

const token = localStorage.getItem("token");
const usuario = JSON.parse(localStorage.getItem("usuario"));
const tabla = document.getElementById("statusTableBody");
const searchInput = document.querySelector(".tab-pane.active input[type='text']");
const mensajeVacio = document.querySelector(".tab-pane.active #mensajeVacio");
const ticketModal = new bootstrap.Modal(document.getElementById("ticketModal"));

let paginaActual = 1;
const registrosPorPagina = 15;
let ticketsFiltrados = [];

if (!token || !usuario) {
  mostrarError("No autorizado. Inicia sesión.");
} else {
  cargarTicketsDesdeAPI();
}

async function cargarTicketsDesdeAPI() {
  const headers = { Authorization: `Bearer ${token}` };

  const [ticketsRes, tiposRes, usuariosRes, estadosRes] = await Promise.all([
    fetch("https://tickets.dev-wit.com/api/tickets", { headers }),
    fetch("https://tickets.dev-wit.com/api/tipos", { headers }),
    fetch("https://tickets.dev-wit.com/api/users", { headers }),
    fetch("https://tickets.dev-wit.com/api/estados", { headers })
  ]);

  if (!ticketsRes.ok || !tiposRes.ok || !usuariosRes.ok || !estadosRes.ok) {
    mostrarError("Error al obtener datos del servidor");
    return;
  }

  const datosTickets = await ticketsRes.json();
  tipos = await tiposRes.json();
  usuarios = await usuariosRes.json();
  estados = await estadosRes.json();

  todosLosTickets = datosTickets.map(ticket => enriquecerTicket(ticket));
  tickets = todosLosTickets
    .sort((a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion))
    .slice(0, 200);

  ticketsFiltrados = [...tickets];
  filtrarTickets();
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

    paginaActual = 1;
    filtrarTickets();
  });
});

function filtrarTickets() {
  const termino = searchInput.value.toLowerCase().trim();
  const origen = termino === "" ? tickets : todosLosTickets;

  ticketsFiltrados = origen.filter(ticket =>
    ticket.id.toString().includes(termino) ||
    ticket.observaciones?.toLowerCase().includes(termino) ||
    ticket.estado?.toLowerCase().includes(termino) ||
    ticket.solicitante?.toLowerCase().includes(termino) ||
    ticket.area?.toLowerCase().includes(termino) ||
    ticket.tipo_atencion?.toLowerCase().includes(termino) ||
    ticket.ejecutor?.toLowerCase().includes(termino)
  );

  paginaActual = 1;
  renderizarTickets();
  actualizarPaginacion();
}

function renderizarTickets() {
  tabla.innerHTML = "";
  const inicio = (paginaActual - 1) * registrosPorPagina;
  const fin = inicio + registrosPorPagina;
  const ticketsPagina = ticketsFiltrados.slice(inicio, fin);

  if (ticketsPagina.length === 0) {
    mostrarMensajeVacio("No se encontraron tickets");
    return;
  }

  ticketsPagina.forEach(ticket => {
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
          <button class="btn btn-sm btn-outline-primary" onclick="editarEstado">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger" onclick="eliminarEstado">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </td>
      `
    row.querySelector(".view-details").addEventListener("click", () => mostrarDetallesTicket(ticket));
    tabla.appendChild(row);
  });

  document.getElementById("paginacion-info").textContent = `Mostrando ${ticketsPagina.length} de ${ticketsFiltrados.length} tickets`;
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

if (searchInput) {
  searchInput.addEventListener("input", filtrarTickets);
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
    searchInput.dispatchEvent(new Event("input"));
    showToast("Éxito", "Lista de tickets actualizada.");

    setTimeout(() => {
      btn.disabled = false;
      icono.className = "bi bi-arrow-clockwise me-1";
      btn.innerHTML = `<i class="bi bi-arrow-clockwise me-1"></i>Actualizar`;
    }, 800);
  });
}
