document.querySelectorAll('#statusTabs .nav-link').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#statusTabs .nav-link').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    const target = btn.getAttribute('data-bs-target');
    document.querySelector(target).classList.add('active');
  });
});

// Ticket data loading
const token = localStorage.getItem("token");
const usuario = JSON.parse(localStorage.getItem("usuario"));
const tabla = document.getElementById("statusTableBody");

if (!token || !usuario) {
  tabla.innerHTML = `<tr><td colspan="4" class="text-danger text-center">No autorizado. Inicia sesión.</td></tr>`;
} else {
  fetch("https://tickets.dev-wit.com/api/tickets", {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  })
  .then(res => {
    if (!res.ok) throw new Error("Error al obtener tickets");
    return res.json();
  })
  .then(data => {
    if (!Array.isArray(data) || data.length === 0) {
      tabla.innerHTML = `<tr><td colspan="4" class="text-center text-muted">No hay tickets registrados.</td></tr>`;
      return;
    }

    tabla.innerHTML = ""; // clear table
    data.forEach(ticket => {
      tabla.innerHTML += `
        <tr>
          <td>${ticket.id}</td>
          <td>${ticket.observaciones || '-'}</td>
          <td><span class="badge bg-primary">${ticket.estado || '-'}</span></td>
          <td>
            <button class="btn btn-sm btn-outline-secondary me-2"><i class="bi bi-pencil"></i> Editar</button>
            <button class="btn btn-sm btn-outline-danger"><i class="bi bi-trash"></i> Eliminar</button>
          </td>
        </tr>`;
    });
  })
  .catch(err => {
    console.error(err);
    tabla.innerHTML = `<tr><td colspan="4" class="text-danger text-center">Error al cargar los datos.</td></tr>`;
  });
}