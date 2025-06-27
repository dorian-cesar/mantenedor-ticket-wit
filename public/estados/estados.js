let estados = []
let editingEstado = null

const tabla = document.getElementById("tablaEstados")
const searchInput = document.getElementById("searchInput")
const mensajeVacio = document.getElementById("mensajeVacio")
const modal = new bootstrap.Modal(document.getElementById("modalEstado"))

async function cargarEstadosDesdeAPI() {
  try {
    const token = localStorage.getItem("token")
    if (!token) throw new Error("Token no encontrado")

    const res = await fetch("https://tickets.dev-wit.com/api/estados", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!res.ok) throw new Error("Error al obtener las estados")

    estados = await res.json()
    filtrar()
  } catch (error) {
    console.error("Error al cargar áreas:", error)
    mensajeVacio.textContent = "Error al cargar los estados"
    mensajeVacio.style.display = "block"
  }
}

function renderTabla(filtradas) {
  tabla.innerHTML = ""
  if (filtradas.length === 0) {
    mensajeVacio.style.display = "block"
    return
  }
  mensajeVacio.style.display = "none"
  filtradas.forEach((estado, index) => {
    const tr = document.createElement("tr")
    tr.innerHTML = `
      <td>${estado.id}</td>
      <td>${estado.nombre}</td>
      <td>${estado.descripcion || "Sin descripción"}</td>
      <td>${new Date(estado.fechaCreacion || Date.now()).toLocaleDateString("es-ES")}</td>
      <td>
        <button class="btn btn-sm btn-outline-primary me-2" onclick="editarEstado(${estado.id})">
          <i class="bi bi-pencil"></i>
        </button>
        <button class="btn btn-sm btn-outline-danger" onclick="eliminarEstado(${estado.id})">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    `
    tabla.appendChild(tr)
  })
}

function filtrar() {
  const term = searchInput.value.toLowerCase()
  const resultado = estados.filter(
    (a) =>
      a.nombre.toLowerCase().includes(term) ||
      (a.descripcion && a.descripcion.toLowerCase().includes(term))
  )
  renderTabla(resultado)
}

document.getElementById("btnNuevoEstado").addEventListener("click", () => {
  editingEstado = null
  document.getElementById("formEstado").reset()
  document.getElementById("modalEstadoLabel").textContent = "Crear Estado"
  modal.show()
})

document.getElementById("formEstado").addEventListener("submit", async (e) => {
  e.preventDefault()
  const nombre = document.getElementById("nombre").value.trim()
  const descripcion = document.getElementById("descripcion").value.trim()
  const token = localStorage.getItem("token")

  try {
    if (editingEstado) {
      // PUT: actualizar
      const res = await fetch(`https://tickets.dev-wit.com/api/estados/${editingEstado.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ nombre, descripcion }),
      })

      showToast("Éxito", "Estado editado exitosamente.")

      if (!res.ok) throw new Error("Error al actualizar el área")

      // Refrescar áreas
      await cargarEstadosDesdeAPI()
    } else {
      // POST: crear
      const res = await fetch("https://tickets.dev-wit.com/api/estados", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ nombre, descripcion }),
        
      })

      if (!res.ok) throw new Error("Error al crear estado")

      showToast("Éxito", "Estado creado exitosamente.")
      await cargarEstadosDesdeAPI()
    }

    modal.hide()
  } catch (error) {
    console.error(error)
    showToast("Error", "Ocurrió un error al guardar el estado", true);    
  }
})


function editarEstado(id) {
  const estado = estados.find((a) => a.id === id)
  if (!estado) return
  editingEstado = estado
  document.getElementById("nombre").value = estado.nombre
  document.getElementById("descripcion").value = estado.descripcion || ""
  document.getElementById("modalEstadoLabel").textContent = "Editar Estado"
  modal.show()
}

function eliminarEstado(id) {
  document.getElementById("eliminarEstadoId").value = id;
  document.getElementById("passwordEliminarEstado").value = "";
  new bootstrap.Modal(document.getElementById("modalEliminarEstado")).show();
}

document.getElementById("formEliminarEstado").addEventListener("submit", async (e) => {
  e.preventDefault();

  const id = parseInt(document.getElementById("eliminarEstadoId").value);
  const password = document.getElementById("passwordEliminarEstado").value.trim();
  const currentUser = JSON.parse(localStorage.getItem("usuario"));
  const email = currentUser?.email;
  const token = localStorage.getItem("token");

  if (!password || !email) {
    document.getElementById("toastEliminarEstadoError").style.display = 'block';
    return;
  }

  try {
    // Validar credenciales
    const loginRes = await fetch("https://tickets.dev-wit.com/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    if (!loginRes.ok) {
      showToast("Error", "Contraseña incorrecta", true);
      return;
    }

    // Eliminar el área
    const res = await fetch(`https://tickets.dev-wit.com/api/estados/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ password })
    });

    showToast("Éxito", "Estado eliminado correctamente"); 

    if (!res.ok) {
      showToast("Error", "Hubo un problema al eliminar", true);
      return;
    }

    await cargarEstadosDesdeAPI();
    bootstrap.Modal.getInstance(document.getElementById("modalEliminarEstado")).hide();
  } catch (error) {
    console.error("Error al eliminar estado:", error);
    showToast("Error", "Ocurrió un error inesperado", true);
  }
});

searchInput.addEventListener("input", filtrar)

window.onload = () => {
  cargarEstadosDesdeAPI()
}
