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
  filtradas.forEach((area, index) => {
    const tr = document.createElement("tr")
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${area.nombre}</td>     
      <td class="text-center">
        <div class="d-inline-flex gap-2">
          <button class="btn btn-sm btn-outline-primary me-2" onclick="editarArea(${area.id})">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger" onclick="eliminarArea(${area.id})">
            <i class="bi bi-trash"></i>
          </button>
        </div>
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

      showToast("Éxito", "Aŕea editada exitosamente.")

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

      showToast("Éxito", "Aŕea creada exitosamente.")
      await cargarAreasDesdeAPI()
    }

    modal.hide()
  } catch (error) {
    console.error(error)
    showToast("Error", "Ocurrió un error al guardar el área", true);    
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

function eliminarArea(id) {
  document.getElementById("eliminarAreaId").value = id;
  document.getElementById("passwordEliminarArea").value = "";
  new bootstrap.Modal(document.getElementById("modalEliminarArea")).show();
}

document.getElementById("formEliminarArea").addEventListener("submit", async (e) => {
  e.preventDefault();

  const id = parseInt(document.getElementById("eliminarAreaId").value);
  const password = document.getElementById("passwordEliminarArea").value.trim();
  const currentUser = JSON.parse(localStorage.getItem("usuario"));
  const email = currentUser?.email;
  const token = localStorage.getItem("token");

  if (!password || !email) {
    document.getElementById("toastEliminarAreaError").style.display = 'block';
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
    const res = await fetch(`https://tickets.dev-wit.com/api/areas/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ password })
    });

    showToast("Éxito", "Área eliminada correctamente"); 

    if (!res.ok) {
      showToast("Error", "Hubo un problema al eliminar", true);
      return;
    }

    await cargarAreasDesdeAPI();
    bootstrap.Modal.getInstance(document.getElementById("modalEliminarArea")).hide();
  } catch (error) {
    console.error("Error al eliminar área:", error);
    showToast("Error", "Ocurrió un error inesperado", true);
  }
});

searchInput.addEventListener("input", filtrar)

window.onload = () => {
  cargarAreasDesdeAPI()
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

      await cargarAreasDesdeAPI();
      searchInput.dispatchEvent(new Event("input"));

      showToast("Éxito", "Lista de áreas actualizada.");

      setTimeout(() => {
        btn.disabled = false;
        icono.className = "bi bi-arrow-clockwise me-1";
        btn.innerHTML = `<i class="bi bi-arrow-clockwise me-1"></i>Actualizar`;
      }, 800);
    });
  }