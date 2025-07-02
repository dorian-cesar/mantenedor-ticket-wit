let categorias = []
let editingCategorias = null

const tabla = document.getElementById("tablaCategorias")
const searchInput = document.getElementById("searchInput")
const mensajeVacio = document.getElementById("mensajeVacio")
const modal = new bootstrap.Modal(document.getElementById("modalCategoria"))

async function cargarCategoriasDesdeAPI() {
  try {
    const token = localStorage.getItem("token")
    if (!token) throw new Error("Token no encontrado")

    const res = await fetch("https://tickets.dev-wit.com/api/categorias", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!res.ok) throw new Error("Error al obtener las categorias")

    categorias = await res.json()
    filtrar()
  } catch (error) {
    console.error("Error al cargar categorias:", error)
    mensajeVacio.textContent = "Error al cargar las categorias"
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
  filtradas.forEach((categoria) => {
    const tr = document.createElement("tr")
    tr.innerHTML = `
      <td>${categoria.nombre}</td>
      <td>${categoria.descripcion || "Sin descripción"}</td>
      <td>${new Date(categoria.fechaCreacion || Date.now()).toLocaleDateString("es-ES")}</td>
      <td class="text-center">
        <div class="d-inline-flex gap-2">
          <button class="btn btn-sm btn-outline-primary me-2" onclick="editarCategoria(${categoria.id})">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger" onclick="eliminarCategoria(${categoria.id})">
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
  const resultado = categorias.filter(
    (a) =>
      a.nombre.toLowerCase().includes(term) ||
      (a.descripcion && a.descripcion.toLowerCase().includes(term))
  )
  renderTabla(resultado)
}

document.getElementById("btnNuevaCategoria").addEventListener("click", () => {
  editingCategorias = null
  document.getElementById("formCategoria").reset()
  document.getElementById("modalCategoriaLabel").textContent = "Crear Categoria"
  modal.show()
})

document.getElementById("formCategoria").addEventListener("submit", async (e) => {
  e.preventDefault()
  const nombre = document.getElementById("nombre").value.trim()
  const descripcion = document.getElementById("descripcion").value.trim()
  const token = localStorage.getItem("token")

  try {
    if (editingCategorias) {
      // PUT: actualizar
      const res = await fetch(`https://tickets.dev-wit.com/api/categorias/${editingCategorias.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ nombre, descripcion }),
      })

      showToast("Éxito", "Categoría editada exitosamente.")

      if (!res.ok) throw new Error("Error al actualizar el área")

      // Refrescar áreas
      await cargarCategoriasDesdeAPI()
    } else {
      // POST: crear
      const res = await fetch("https://tickets.dev-wit.com/api/categorias", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ nombre, descripcion }),
        
      })

      if (!res.ok) throw new Error("Error al crear categoria")

      showToast("Éxito", "Categoría creada exitosamente.")
      await cargarCategoriasDesdeAPI()
    }

    modal.hide()
  } catch (error) {
    console.error(error)
    showToast("Error", "Ocurrió un error al guardar categoria", true);    
  }
})


function editarCategoria(id) {
  const categoria = categorias.find((a) => a.id === id)
  if (!categoria) return
  editingCategorias = categoria
  document.getElementById("nombre").value = categoria.nombre
  document.getElementById("descripcion").value = categoria.descripcion || ""
  document.getElementById("modalCategoriaLabel").textContent = "Editar categoría"
  modal.show()
}

function eliminarCategoria(id) {
  document.getElementById("eliminarCategoriaId").value = id;
  document.getElementById("passwordEliminarCategoria").value = "";
  new bootstrap.Modal(document.getElementById("modalEliminarCategoria")).show();
}

document.getElementById("formEliminarCategoria").addEventListener("submit", async (e) => {
  e.preventDefault();

  const id = parseInt(document.getElementById("eliminarCategoriaId").value);
  const password = document.getElementById("passwordEliminarCategoria").value.trim();
  const currentUser = JSON.parse(localStorage.getItem("usuario"));
  const email = currentUser?.email;
  const token = localStorage.getItem("token");

  if (!password || !email) {
    document.getElementById("toastEliminarCategoriaError").style.display = 'block';
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
    const res = await fetch(`https://tickets.dev-wit.com/api/categorias/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ password })
    });

    showToast("Éxito", "Categoría eliminada correctamente"); 

    if (!res.ok) {
      showToast("Error", "Hubo un problema al eliminar", true);
      return;
    }

    await cargarCategoriasDesdeAPI();
    bootstrap.Modal.getInstance(document.getElementById("modalEliminarCategoria")).hide();
  } catch (error) {
    console.error("Error al eliminar categoria:", error);
    showToast("Error", "Ocurrió un error inesperado", true);
  }
});

searchInput.addEventListener("input", filtrar)

window.onload = () => {
  cargarCategoriasDesdeAPI()
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

      await cargarCategoriasDesdeAPI();
      searchInput.dispatchEvent(new Event("input"));

      showToast("Éxito", "Lista de categorias actualizada.");

      setTimeout(() => {
        btn.disabled = false;
        icono.className = "bi bi-arrow-clockwise me-1";
        btn.innerHTML = `<i class="bi bi-arrow-clockwise me-1"></i>Actualizar`;
      }, 800);
    });
  }