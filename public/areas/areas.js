let areas = []
let editingArea = null

const tabla = document.getElementById("tablaAreas")
const searchInput = document.getElementById("searchInput")
const mensajeVacio = document.getElementById("mensajeVacio")
const modal = new bootstrap.Modal(document.getElementById("modalArea"))

async function cargarAreasDesdeAPI() {
  try {
    const token = localStorage.getItem("token")
    if (!token) throw new Error("Token no encontrado")

    const res = await fetch("https://tickets.dev-wit.com/api/areas", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!res.ok) throw new Error("Error al obtener las áreas")

    areas = await res.json()
    filtrar()
  } catch (error) {
    console.error("Error al cargar áreas:", error)
    mensajeVacio.textContent = "Error al cargar las áreas"
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
  filtradas.forEach((area) => {
    const tr = document.createElement("tr")
    tr.innerHTML = `
      <td>${area.nombre}</td>
      <td>${area.descripcion || "Sin descripción"}</td>
      <td>${new Date(area.fechaCreacion || Date.now()).toLocaleDateString("es-ES")}</td>
      <td>
        <button class="btn btn-sm btn-outline-primary me-2" onclick="editarArea(${area.id})">
          <i class="bi bi-pencil"></i>
        </button>
        <button class="btn btn-sm btn-outline-danger" onclick="eliminarArea(${area.id})">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    `
    tabla.appendChild(tr)
  })
}

function filtrar() {
  const term = searchInput.value.toLowerCase()
  const resultado = areas.filter(
    (a) =>
      a.nombre.toLowerCase().includes(term) ||
      (a.descripcion && a.descripcion.toLowerCase().includes(term))
  )
  renderTabla(resultado)
}

document.getElementById("btnNuevaArea").addEventListener("click", () => {
  editingArea = null
  document.getElementById("formArea").reset()
  document.getElementById("modalAreaLabel").textContent = "Crear Área"
  modal.show()
})

document.getElementById("formArea").addEventListener("submit", async (e) => {
  e.preventDefault()
  const nombre = document.getElementById("nombre").value.trim()
  const descripcion = document.getElementById("descripcion").value.trim()
  const token = localStorage.getItem("token")

  try {
    if (editingArea) {
      // PUT: actualizar
      const res = await fetch(`https://tickets.dev-wit.com/api/areas/${editingArea.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ nombre, descripcion }),
      })

      if (!res.ok) throw new Error("Error al actualizar el área")

      // Refrescar áreas
      await cargarAreasDesdeAPI()
    } else {
      // POST: crear
      const res = await fetch("https://tickets.dev-wit.com/api/areas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ nombre, descripcion }),
      })

      if (!res.ok) throw new Error("Error al crear el área")

      await cargarAreasDesdeAPI()
    }

    modal.hide()
  } catch (error) {
    console.error(error)
    alert("Ocurrió un error al guardar el área")
  }
})


function editarArea(id) {
  const area = areas.find((a) => a.id === id)
  if (!area) return
  editingArea = area
  document.getElementById("nombre").value = area.nombre
  document.getElementById("descripcion").value = area.descripcion || ""
  document.getElementById("modalAreaLabel").textContent = "Editar Área"
  modal.show()
}

async function eliminarArea(id) {
  if (!confirm("¿Estás seguro de que deseas eliminar esta área?")) return

  const token = localStorage.getItem("token")

  try {
    const res = await fetch(`https://tickets.dev-wit.com/api/areas/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!res.ok) throw new Error("Error al eliminar el área")

    await cargarAreasDesdeAPI()
  } catch (error) {
    console.error(error)
    alert("No se pudo eliminar el área.")
  }
}


searchInput.addEventListener("input", filtrar)

window.onload = () => {
  cargarAreasDesdeAPI()
}
