// Variables globales
let tickets = [];
let todosLosTickets = [];
const token = localStorage.getItem("token");
const usuario = JSON.parse(localStorage.getItem("usuario"));
const tabla = document.getElementById("statusTableBody");
const searchInput = document.querySelector(".tab-pane.active input[type='text']"); // Selector del input de búsqueda
const mensajeVacio = document.querySelector(".tab-pane.active #mensajeVacio"); // Mensaje cuando no hay datos
const ticketModal = new bootstrap.Modal(document.getElementById('ticketModal'));

//Variables de paginación
let paginaActual = 1;
const registrosPorPagina = 15;
let ticketsFiltrados = [];

if (!token || !usuario) {
  mostrarError("No autorizado. Inicia sesión.");
} else {
  cargarTicketsDesdeAPI();
}

// Función principal para cargar tickets
async function cargarTicketsDesdeAPI() {
  const res = await fetch("https://tickets.dev-wit.com/api/tickets", {
    headers: { "Authorization": `Bearer ${token}` }
  });

  if (!res.ok) throw new Error("Error al obtener tickets");

  todosLosTickets = await res.json();
  tickets = todosLosTickets
    .sort((a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion))
    .slice(0, 200);

  ticketsFiltrados = [...tickets];
  filtrarTickets();
}

// Asegurar que se actualice la paginación al cambiar de pestaña
document.querySelectorAll('#statusTabs .nav-link').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#statusTabs .nav-link').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    const target = btn.getAttribute('data-bs-target');
    document.querySelector(target).classList.add('active');
    
    // Resetear paginación al cambiar de pestaña
    paginaActual = 1;
    filtrarTickets();
  });
});

// Función de filtrado
function filtrarTickets() {
  const termino = searchInput.value.toLowerCase().trim();

  const origen = termino === ""
    ? tickets // solo los 200 más recientes
    : todosLosTickets; // todos los registros si hay búsqueda

  ticketsFiltrados = origen.filter(ticket => 
    (ticket.id.toString().includes(termino)) ||
    (ticket.observaciones && ticket.observaciones.toLowerCase().includes(termino)) ||
    (ticket.estado && ticket.estado.toLowerCase().includes(termino)) ||
    (ticket.solicitante && ticket.solicitante.toLowerCase().includes(termino)) ||
    (ticket.area && ticket.area.toLowerCase().includes(termino)) ||
    (ticket.tipo_atencion && ticket.tipo_atencion.toLowerCase().includes(termino)) ||
    (ticket.ejecutor && ticket.ejecutor.toLowerCase().includes(termino))
  );

  paginaActual = 1;
  renderizarTickets();
  actualizarPaginacion();
}

// Función para renderizar tickets
function renderizarTickets() {
  tabla.innerHTML = "";
  
  // Calcular índices para la paginación
  const inicio = (paginaActual - 1) * registrosPorPagina;
  const fin = inicio + registrosPorPagina;
  const ticketsPagina = ticketsFiltrados.slice(inicio, fin);

  if (ticketsPagina.length === 0) {
    mostrarMensajeVacio("No se encontraron tickets");
    return;
  }

  ticketsPagina.forEach(ticket => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${ticket.id}</td>
      <td>${ticket.observaciones || '-'}</td>
      <td>
        <div class="d-flex justify-content-between align-items-center">
          <span class="badge ${getBadgeClass(ticket.estado)}">${ticket.estado || '-'}</span>
          <img src="/img/ojo.png" alt="Ver observación" style="width: 20px; cursor: pointer;" class="ms-2 view-details">
        </div>
      </td>
      <td>
        <button class="btn btn-sm btn-outline-secondary me-2"><i class="bi bi-pencil"></i> Editar</button>
        <button class="btn btn-sm btn-outline-danger"><i class="bi bi-trash"></i> Eliminar</button>
      </td>
    `;
    
    row.querySelector('.view-details').addEventListener('click', () => {
      mostrarDetallesTicket(ticket);
    });
    
    tabla.appendChild(row);
  });

  // Actualizar información de paginación
  document.getElementById('paginacion-info').textContent = 
    `Mostrando ${ticketsPagina.length} de ${ticketsFiltrados.length} tickets`;
}

// Función para actualizar controles de paginación
function actualizarPaginacion() {
  const totalPaginas = Math.ceil(ticketsFiltrados.length / registrosPorPagina);
  const paginacionControl = document.getElementById('paginacion-control');
  paginacionControl.innerHTML = '';

  if (totalPaginas <= 1) return;

  // Botón Anterior
  const liAnterior = document.createElement('li');
  liAnterior.className = `page-item ${paginaActual === 1 ? 'disabled' : ''}`;
  liAnterior.innerHTML = `<a class="page-link" href="#" aria-label="Anterior">&laquo;</a>`;
  liAnterior.addEventListener('click', (e) => {
    e.preventDefault();
    if (paginaActual > 1) {
      paginaActual--;
      renderizarTickets();
      actualizarPaginacion();
    }
  });
  paginacionControl.appendChild(liAnterior);

  // Números de página
  const inicioPaginas = Math.max(1, paginaActual - 2);
  const finPaginas = Math.min(totalPaginas, paginaActual + 2);

  for (let i = inicioPaginas; i <= finPaginas; i++) {
    const li = document.createElement('li');
    li.className = `page-item ${i === paginaActual ? 'active' : ''}`;
    li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
    li.addEventListener('click', (e) => {
      e.preventDefault();
      paginaActual = i;
      renderizarTickets();
      actualizarPaginacion();
    });
    paginacionControl.appendChild(li);
  }

  // Botón Siguiente
  const liSiguiente = document.createElement('li');
  liSiguiente.className = `page-item ${paginaActual === totalPaginas ? 'disabled' : ''}`;
  liSiguiente.innerHTML = `<a class="page-link" href="#" aria-label="Siguiente">&raquo;</a>`;
  liSiguiente.addEventListener('click', (e) => {
    e.preventDefault();
    if (paginaActual < totalPaginas) {
      paginaActual++;
      renderizarTickets();
      actualizarPaginacion();
    }
  });
  paginacionControl.appendChild(liSiguiente);
}

// Función para mostrar detalles del ticket (sin cambios)
function mostrarDetallesTicket(ticket) {
  document.getElementById('modalTicketId').textContent = ticket.id;
  document.getElementById('modalSolicitante').textContent = ticket.solicitante || '-';
  document.getElementById('modalArea').textContent = ticket.area || '-';
  document.getElementById('modalTipoAtencion').textContent = ticket.tipo_atencion || '-';
  document.getElementById('modalEjecutor').textContent = ticket.ejecutor || '-';
  document.getElementById('modalCorreoEjecutor').textContent = ticket.corre_ejecutor || '-';
  document.getElementById('modalFechaCreacion').textContent = new Date(ticket.fecha_creacion).toLocaleString() || '-';
  document.getElementById('modalObservaciones').textContent = ticket.observaciones || '-';
  
  const archivoContainer = document.getElementById('modalArchivoPdf');
  archivoContainer.innerHTML = '';

  if (ticket.archivo_pdf) {
    const fileName = ticket.archivo_pdf;
    const baseURL = "https://tickets.dev-wit.com/uploads/";
    const fullURL = baseURL + encodeURIComponent(fileName);

    const enlace = document.createElement('a');
    enlace.href = fullURL;
    enlace.target = '_blank';
    enlace.rel = 'noopener noreferrer';
    enlace.textContent = 'Ver PDF';
    enlace.classList.add('btn', 'btn-sm', 'btn-outline-primary');
    archivoContainer.appendChild(enlace);
  } else {
    archivoContainer.textContent = 'No hay archivo adjunto';
  }

  ticketModal.show();
}

// Funciones auxiliares
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

// Event listener para el input de búsqueda
if (searchInput) {
  searchInput.addEventListener('input', filtrarTickets);
}

function getBadgeClass(estado) {
  if (!estado) return "bg-secondary";

  const normalized = estado.trim().toLowerCase();

  if (normalized === "en ejecución") return "badge-estado-ejecucion";
  if (normalized === "creado") return "badge-estado-creado";
  if (normalized === "pendiente por presupuesto") return "badge-estado-pendiente";
  if (normalized === "cancelado") return "badge-estado-cancelado";
  if (normalized === "listo") return "badge-estado-listo";
  if (normalized === "Rechazado") return "badge-estado-rechazado";

  return "bg-secondary"; // default
}
