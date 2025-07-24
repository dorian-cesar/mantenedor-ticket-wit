let direcciones = []
let editingDireccion = null
let mapaDirecciones = {};
let paginaActual = 1;
const registrosPorPagina = 15;
let direccionesFiltradas = [];


const tabla = document.getElementById("tablaDireccion")
const searchInput = document.getElementById("searchInput")
const mensajeVacio = document.getElementById("mensajeVacio")
const modal = new bootstrap.Modal(document.getElementById("modalDireccion"))

async function cargarDireccionesDesdeAPI() {
  try {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("TOKEN_INVALIDO");

    const res = await fetch("https://tickets.dev-wit.com/api/direcciones", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.status === 401) throw new Error("TOKEN_INVALIDO");
    if (!res.ok) throw new Error("Error al obtener direcciones");

    direcciones = await res.json();
    filtrar();

  } catch (error) {
    if (error.message === "TOKEN_INVALIDO") {
      localStorage.removeItem("token");
      localStorage.removeItem("usuario");
      window.location.href = "../index.html";
    } else {
      console.error("Error al cargar direcciones:", error);
      mensajeVacio.textContent = "Error al cargar las direcciones";
      mensajeVacio.style.display = "block";
    }
  }
}

function renderPaginacion(totalPaginas) {
  const paginacion = document.getElementById("paginacionDireccion");
  paginacion.innerHTML = "";

  if (totalPaginas <= 1) return;

  const ul = document.createElement("ul");
  ul.className = "pagination justify-content-center mt-3";

  for (let i = 1; i <= totalPaginas; i++) {
    const li = document.createElement("li");
    li.className = `page-item ${i === paginaActual ? "active" : ""}`;
    const a = document.createElement("a");
    a.className = "page-link";
    a.href = "#";
    a.textContent = i;
    a.addEventListener("click", (e) => {
      e.preventDefault();
      paginaActual = i;
      renderTabla();
    });
    li.appendChild(a);
    ul.appendChild(li);
  }

  paginacion.appendChild(ul);
}

function renderTabla() {
  tabla.innerHTML = "";

  const total = direccionesFiltradas.length;
  if (total === 0) {
    mensajeVacio.style.display = "block";
    renderPaginacion(0); // limpiar controles de paginación
    return;
  }

  mensajeVacio.style.display = "none";

  const inicio = (paginaActual - 1) * registrosPorPagina;
  const fin = inicio + registrosPorPagina;
  const direccionesPagina = direccionesFiltradas.slice(inicio, fin);

  direccionesPagina.forEach((direccion, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `      
      <td>${direccion.id}</td>
      <td>${direccion.name}</td>  
      <td>${direccion.ubicacion}</td>    
      <td class="text-center">
        <div class="d-inline-flex gap-2">
          <button class="btn btn-sm btn-outline-primary me-2" onclick="editarDireccion(${direccion.id})">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger" onclick="eliminarDireccion(${direccion.id})">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </td>
    `;
    tabla.appendChild(tr);
  });

  renderPaginacion(Math.ceil(total / registrosPorPagina));
}

function filtrar() {
  const term = searchInput.value.toLowerCase();
  direccionesFiltradas = direcciones.filter((a) =>
    (a.name || "").toLowerCase().includes(term) ||
    (a.ubicacion || "").toLowerCase().includes(term)
  );
  paginaActual = 1;
  renderTabla();
}

document.getElementById("btnNuevaDireccion").addEventListener("click", () => {
  editingDireccion = null;
  document.getElementById("formDireccion").reset();
  document.getElementById("modalDireccionLabel").textContent = "Crear Dirección";
  modal.show(); 
});

document.getElementById("formDireccion").addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("name").value.trim();
  const ubicacion = document.getElementById("ubicacion").value;
  const token = localStorage.getItem("token");

  try {
    const payload = JSON.stringify({ name, ubicacion });

    if (editingDireccion) {
      const res = await fetch(`https://tickets.dev-wit.com/api/direcciones/${editingDireccion.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: payload,
      });
      showToast("Éxito", "Dirección editada correctamente");

      if (!res.ok) throw new Error("Error al actualizar la dirección");
    } else {
      const res = await fetch("https://tickets.dev-wit.com/api/direcciones", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: payload,
      });
      showToast("Éxito", "Dirección creada correctamente");

      if (!res.ok) throw new Error("Error al crear la dirección");
    }

    await cargarDireccionesDesdeAPI();
    modal.hide();
    e.target.reset();
  } catch (error) {
    console.error(error);
    alert("Ocurrió un error al guardar la dirección: " + error.message);
  }
});

function editarDireccion(id) {
  const direccion = direcciones.find((a) => a.id === id);
  if (!direccion) return;

  editingDireccion = direccion;
  document.getElementById("name").value = direccion.name;
  document.getElementById("ubicacion").value = direccion.ubicacion;
  document.getElementById("modalDireccionLabel").textContent = "Editar Direccion";
  modal.show();  
}

function eliminarDireccion(id) {
  document.getElementById("eliminarDireccionId").value = id;
  document.getElementById("passwordEliminarDireccion").value = "";
  new bootstrap.Modal(document.getElementById("modalEliminarDireccion")).show();
}

document.getElementById("formEliminarDireccion").addEventListener("submit", async (e) => {
  e.preventDefault()

  const id = parseInt(document.getElementById("eliminarDireccionId").value)
  const password = document.getElementById("passwordEliminarDireccion").value.trim()
  const currentUser = JSON.parse(localStorage.getItem("usuario"))
  const email = currentUser?.email
  const token = localStorage.getItem("token")

  if (!password || !email) {
    document.getElementById("toastEliminarDireccionError").style.display = 'block'
    return
  }

  try {
    const loginRes = await fetch("https://tickets.dev-wit.com/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    })

    if (!loginRes.ok) {
      showToast("Error", "Contraseña incorrecta", true); 
      return
    }

    const res = await fetch(`https://tickets.dev-wit.com/api/direcciones/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ password })
    })
    showToast("Éxito", "Dirección eliminada correctamente");

    if (!res.ok) {
      showToast("Error", "Hubo un problema al eliminar", true);
      return
    }

    await cargarDireccionesDesdeAPI()
    bootstrap.Modal.getInstance(document.getElementById("modalEliminarDireccion")).hide()
  } catch (error) {
    console.error("Error al eliminar dirección:", error)
    document.getElementById("toastEliminarDireccionError").style.display = 'block'
  }
})

searchInput.addEventListener("input", filtrar)

window.onload = async () => {
  await cargarDireccionesDesdeAPI();
  filtrar();
};

// Botón actualizar
const btnActualizar = document.getElementById("btn-actualizar");
if (btnActualizar) {
  btnActualizar.addEventListener("click", async () => {
    const btn = btnActualizar;
    const icono = btn.querySelector("i");
    const textoOriginal = btn.innerHTML;

    btn.disabled = true;
    icono.classList.add("spinner-border", "spinner-border-sm");
    icono.classList.remove("bi", "bi-arrow-clockwise");
    btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Actualizando...`;

    await cargarDireccionesDesdeAPI();
    searchInput.dispatchEvent(new Event("input"));

    showToast("Éxito", "Lista de direcciones actualizada.");

    setTimeout(() => {
      btn.disabled = false;
      icono.className = "bi bi-arrow-clockwise me-1";
      btn.innerHTML = `<i class="bi bi-arrow-clockwise me-1"></i>Actualizar`;
    }, 800);
  });
}