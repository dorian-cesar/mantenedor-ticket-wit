document.querySelectorAll('#statusTabs .nav-link').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#statusTabs .nav-link').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    const target = btn.getAttribute('data-bs-target');
    document.querySelector(target).classList.add('active');
  });
});

// Variables globales
let tickets = [];
const token = localStorage.getItem("token");
const usuario = JSON.parse(localStorage.getItem("usuario"));
const tabla = document.getElementById("statusTableBody");
const searchInput = document.querySelector(".tab-pane.active input[type='text']"); // Selector del input de búsqueda
const mensajeVacio = document.querySelector(".tab-pane.active #mensajeVacio"); // Mensaje cuando no hay datos
const ticketModal = new bootstrap.Modal(document.getElementById('ticketModal'));

if (!token || !usuario) {
  mostrarError("No autorizado. Inicia sesión.");
} else {
  cargarTicketsDesdeAPI();
}

// Función principal para cargar tickets
async function cargarTicketsDesdeAPI() {
  try {
    const res = await fetch("https://tickets.dev-wit.com/api/tickets", {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!res.ok) throw new Error("Error al obtener tickets");

    tickets = await res.json();
    filtrarTickets(); // Filtramos después de cargar

  } catch (err) {
    console.error(err);
    mostrarError("Error al cargar los datos.");
  }
}

// Función de filtrado
function filtrarTickets() {
  const termino = searchInput.value.toLowerCase();
  
  const ticketsFiltrados = tickets.filter(ticket => 
    (ticket.id.toString().includes(termino)) ||
    (ticket.observaciones && ticket.observaciones.toLowerCase().includes(termino)) ||
    (ticket.estado && ticket.estado.toLowerCase().includes(termino)) ||
    (ticket.solicitante && ticket.solicitante.toLowerCase().includes(termino)) ||
    (ticket.area && ticket.area.toLowerCase().includes(termino)) ||
    (ticket.tipo_atencion && ticket.tipo_atencion.toLowerCase().includes(termino)) ||
    (ticket.ejecutor && ticket.ejecutor.toLowerCase().includes(termino))
  );

  renderizarTickets(ticketsFiltrados);
}

// Función para renderizar tickets
function renderizarTickets(ticketsARenderizar) {
  tabla.innerHTML = "";

  if (!ticketsARenderizar || ticketsARenderizar.length === 0) {
    mostrarMensajeVacio("No hay tickets registrados.");
    return;
  }

  ticketsARenderizar.forEach(ticket => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${ticket.id}</td>
      <td>${ticket.observaciones || '-'}</td>
      <td>
        <div class="d-flex justify-content-between align-items-center">
          <span class="badge bg-primary">${ticket.estado || '-'}</span>
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
  document.getElementById('modalArchivoPdf').textContent = ticket.archivo_pdf || 'No hay archivo adjunto';
  
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