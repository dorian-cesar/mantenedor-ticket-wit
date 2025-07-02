let actividades = []
let editingActividad = null

const tabla = document.getElementById("tablaActividad")
const searchInput = document.getElementById("searchInput")
const mensajeVacio = document.getElementById("mensajeVacio")
const modal = new bootstrap.Modal(document.getElementById("modalActividad"))

async function cargarActividadesDesdeAPI() {
  try {
    const token = localStorage.getItem("token")
    if (!token) throw new Error("Token no encontrado")

    const res = await fetch("https://tickets.dev-wit.com/api/actividades", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!res.ok) throw new Error("Error al obtener actividades")

    actividades = await res.json()
    filtrar()
  } catch (error) {
    console.error("Error al cargar actividades:", error)
    mensajeVacio.textContent = "Error al cargar las actividades"
    mensajeVacio.style.display = "block"
  }
}

function renderTabla(filtradas) {
  tabla.innerHTML = "";
  if (filtradas.length === 0) {
    mensajeVacio.style.display = "block";
    return;
  }
  mensajeVacio.style.display = "none";

  filtradas.forEach((actividad, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${actividad.nombre}</td>
      <td class="text-muted">No disponible</td>
      <td class="text-muted">No disponible</td>
      <td class="text-center">
        <div class="d-inline-flex gap-2">
          <button class="btn btn-sm btn-outline-primary me-2" onclick="editarActividad(${actividad.id})">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger" onclick="eliminarActividad(${actividad.id})">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </td>
    `;
    tabla.appendChild(tr);
  });
}


function filtrar() {
  const term = searchInput.value.toLowerCase()
  const resultado = actividades.filter(
    (a) => a.nombre.toLowerCase().includes(term)
  )
  renderTabla(resultado)
}

document.getElementById("btnNuevaActividad").addEventListener("click", () => {
  editingActividad = null
  document.getElementById("formActividad").reset()
  document.getElementById("modalActividadLabel").textContent = "Crear Actividad"
  modal.show()
})

document.getElementById("formActividad").addEventListener("submit", async (e) => {
  e.preventDefault()
  const nombre = document.getElementById("nombre").value.trim()
  const token = localStorage.getItem("token")

  try {
    if (editingActividad) {
      const res = await fetch(`https://tickets.dev-wit.com/api/actividades/${editingActividad.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ nombre }),
      })
      showToast("Éxito", "Actividad editada correctamente"); 

      if (!res.ok) throw new Error("Error al actualizar la actividad")

      await cargarActividadesDesdeAPI()
    } else {
      const res = await fetch("https://tickets.dev-wit.com/api/actividades", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ nombre }),
      })
      showToast("Éxito", "Actividad creada correctamente"); 

      if (!res.ok) throw new Error("Error al crear la actividad")

      await cargarActividadesDesdeAPI()
    }

    modal.hide()
  } catch (error) {
    console.error(error)
    alert("Ocurrió un error al guardar la actividad")
  }
})

function editarActividad(id) {
  const actividad = actividades.find((a) => a.id === id)
  if (!actividad) return
  editingActividad = actividad
  document.getElementById("nombre").value = actividad.nombre
  document.getElementById("descripcion").value = "" // opcional
  document.getElementById("modalActividadLabel").textContent = "Editar Actividad"
  modal.show()
}

function eliminarActividad(id) {
  document.getElementById("eliminarActividadId").value = id;
  document.getElementById("passwordEliminarActividad").value = "";
  new bootstrap.Modal(document.getElementById("modalEliminarActividad")).show();
}

document.getElementById("formEliminarActividad").addEventListener("submit", async (e) => {
  e.preventDefault()

  const id = parseInt(document.getElementById("eliminarActividadId").value)
  const password = document.getElementById("passwordEliminarActividad").value.trim()
  const currentUser = JSON.parse(localStorage.getItem("usuario"))
  const email = currentUser?.email
  const token = localStorage.getItem("token")

  if (!password || !email) {
    document.getElementById("toastEliminarActividadError").style.display = 'block'
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

    const res = await fetch(`https://tickets.dev-wit.com/api/actividades/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ password })
    })
    showToast("Éxito", "Actividad eliminada correctamente");

    if (!res.ok) {
      showToast("Error", "Hubo un problema al eliminar", true);
      return
    }

    await cargarActividadesDesdeAPI()
    bootstrap.Modal.getInstance(document.getElementById("modalEliminarActividad")).hide()
  } catch (error) {
    console.error("Error al eliminar actividad:", error)
    document.getElementById("toastEliminarActividadError").style.display = 'block'
  }
})

searchInput.addEventListener("input", filtrar)

window.onload = () => {
  cargarActividadesDesdeAPI()
}

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

    await cargarActividadesDesdeAPI();
    searchInput.dispatchEvent(new Event("input"));

    showToast("Éxito", "Lista de actividades actualizada.");

    setTimeout(() => {
      btn.disabled = false;
      icono.className = "bi bi-arrow-clockwise me-1";
      btn.innerHTML = `<i class="bi bi-arrow-clockwise me-1"></i>Actualizar`;
    }, 800);
  });
}