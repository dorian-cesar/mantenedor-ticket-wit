let actividades = []
let editingActividad = null
let mapaTiposAtencion = {};
let paginaActual = 1;
const registrosPorPagina = 15;
let actividadesFiltradas = [];


const tabla = document.getElementById("tablaActividad")
const searchInput = document.getElementById("searchInput")
const mensajeVacio = document.getElementById("mensajeVacio")
const modal = new bootstrap.Modal(document.getElementById("modalActividad"))

async function cargarActividadesDesdeAPI() {
  try {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("TOKEN_INVALIDO");

    // Primero cargar tipos y mapa
    await cargarTiposAtencion();

    const res = await fetch("https://tickets.dev-wit.com/api/actividades", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.status === 401) throw new Error("TOKEN_INVALIDO");
    if (!res.ok) throw new Error("Error al obtener actividades");

    actividades = await res.json();
    filtrar();

  } catch (error) {
    if (error.message === "TOKEN_INVALIDO") {
      localStorage.removeItem("token");
      localStorage.removeItem("usuario");
      window.location.href = "../index.html";
    } else {
      console.error("Error al cargar actividades:", error);
      mensajeVacio.textContent = "Error al cargar las actividades";
      mensajeVacio.style.display = "block";
    }
  }
}

async function cargarTiposAtencion(seleccionado = "") {
  const token = localStorage.getItem("token");
  const select = document.getElementById("tipoAtencion");

  select.innerHTML = '<option value="">Cargando tipos...</option>';

  try {
    const res = await fetch("https://tickets.dev-wit.com/api/tipos", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const tipos = await res.json();

    // Crear el mapa id → nombre
    mapaTiposAtencion = {};
    tipos.forEach((tipo) => {
      mapaTiposAtencion[tipo.id] = tipo.nombre;
    });

    // Poblamos el select
    select.innerHTML = '<option value="">Seleccione un tipo</option>';
    tipos.forEach((tipo) => {
      const option = document.createElement("option");
      option.value = tipo.id;
      option.textContent = tipo.nombre;
      if (String(tipo.id) === String(seleccionado)) option.selected = true;
      select.appendChild(option);
    });
  } catch (error) {
    console.error("Error al cargar tipos de atención:", error);
    select.innerHTML = '<option value="">Error al cargar</option>';
  }
}

function renderPaginacion(totalPaginas) {
  const paginacion = document.getElementById("paginacionActividad");
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

  const total = actividadesFiltradas.length;
  if (total === 0) {
    mensajeVacio.style.display = "block";
    renderPaginacion(0); // limpiar controles de paginación
    return;
  }

  mensajeVacio.style.display = "none";

  const inicio = (paginaActual - 1) * registrosPorPagina;
  const fin = inicio + registrosPorPagina;
  const actividadesPagina = actividadesFiltradas.slice(inicio, fin);

  actividadesPagina.forEach((actividad, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${inicio + index + 1}</td>
      <td>${actividad.nombre}</td>  
      <td>${mapaTiposAtencion[actividad.tipo_atencion_id] || "Sin tipo"}</td>    
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

  renderPaginacion(Math.ceil(total / registrosPorPagina));
}

function filtrar() {
  const term = searchInput.value.toLowerCase();
  actividadesFiltradas = actividades.filter((a) =>
    a.nombre.toLowerCase().includes(term)
  );
  paginaActual = 1; 
  renderTabla();
}

document.getElementById("btnNuevaActividad").addEventListener("click", () => {
  editingActividad = null;
  document.getElementById("formActividad").reset();
  document.getElementById("modalActividadLabel").textContent = "Crear Actividad";

  cargarTiposAtencion().then(() => {
    modal.show();
  });
});


document.getElementById("formActividad").addEventListener("submit", async (e) => {
  e.preventDefault();
  const nombre = document.getElementById("nombre").value.trim();
  const tipo_atencion_id = document.getElementById("tipoAtencion").value;
  const token = localStorage.getItem("token");

  try {
    const payload = JSON.stringify({ nombre, tipo_atencion_id });

    if (editingActividad) {
      const res = await fetch(`https://tickets.dev-wit.com/api/actividades/${editingActividad.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: payload,
      });
      showToast("Éxito", "Actividad editada correctamente");

      if (!res.ok) throw new Error("Error al actualizar la actividad");
    } else {
      const res = await fetch("https://tickets.dev-wit.com/api/actividades", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: payload,
      });
      showToast("Éxito", "Actividad creada correctamente");

      if (!res.ok) throw new Error("Error al crear la actividad");
    }

    await cargarActividadesDesdeAPI();
    modal.hide();
    e.target.reset();
  } catch (error) {
    console.error(error);
    alert("Ocurrió un error al guardar la actividad");
  }
});

function editarActividad(id) {
  const actividad = actividades.find((a) => a.id === id);
  if (!actividad) return;

  editingActividad = actividad;
  document.getElementById("nombre").value = actividad.nombre;
  document.getElementById("modalActividadLabel").textContent = "Editar Actividad";

  cargarTiposAtencion(actividad.tipo_atencion_id).then(() => modal.show());
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

window.onload = async () => {
  await cargarActividadesDesdeAPI();
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