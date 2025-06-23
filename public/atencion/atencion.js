document.addEventListener("DOMContentLoaded", () => {
  // Verificar token al inicio
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "../index.html";
    return; // Salir si no hay token
  }

  // Variables globales
  let atenciones = [];
  let atencionEditando = null;
  let atencionEliminando = null;

  // Elementos del DOM
  const tabla = document.getElementById("tablaServicios");
  const searchInput = document.getElementById("searchInput");
  const mensajeVacio = document.getElementById("mensajeVacio");
  const modalServicio = new bootstrap.Modal(document.getElementById("modalServicio"));
  const modalEliminar = new bootstrap.Modal(document.getElementById("modalEliminar"));

  // Funciones principales
  function renderTabla(filtrados) {
    tabla.innerHTML = "";
    if (filtrados.length === 0) {
      mensajeVacio.style.display = "block";
      return;
    }
    mensajeVacio.style.display = "none";
    
    filtrados.forEach((srv) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${srv.id}</td>
        <td>${srv.nombre}</td>
        <td>${srv.area_nombre}</td>
        <td>${srv.ejecutor_nombre}</td>
        <td>
          <button class="btn btn-sm btn-outline-primary me-2" onclick="editarAtencion(${srv.id})"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-sm btn-outline-danger" onclick="confirmarEliminar(${srv.id})"><i class="bi bi-trash"></i></button>
        </td>
      `;
      tabla.appendChild(tr);
    });
  }

  function filtrar() {
    const term = searchInput.value.toLowerCase();
    const resultado = atenciones.filter((s) =>
      s.nombre.toLowerCase().includes(term) ||
      s.area_nombre.toLowerCase().includes(term) ||
      s.ejecutor_nombre.toLowerCase().includes(term)
    );
    renderTabla(resultado);
  }

  async function cargarAtencionesDesdeAPI() {
    try {
      const res = await fetch("https://tickets.dev-wit.com/api/tipos", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error("Error al obtener tipos de atención");

      atenciones = await res.json();
      filtrar();
    } catch (err) {
      console.error("Error cargando atenciones:", err);
      mensajeVacio.style.display = "block";
      mensajeVacio.textContent = "Error al cargar tipos de atención.";
    }
  }

  async function cargarSelectsDinamicos() {
    try {
      // Cargar áreas
      const resAreas = await fetch("https://tickets.dev-wit.com/api/areas", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const areas = await resAreas.json();
      const selectArea = document.getElementById("area_id");
      selectArea.innerHTML = '<option value="">Seleccione un área</option>';
      areas.forEach(area => {
        const option = document.createElement("option");
        option.value = area.id;
        option.textContent = area.nombre;
        selectArea.appendChild(option);
      });

      // Cargar ejecutores
      const resUsers = await fetch("https://tickets.dev-wit.com/api/users", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const users = await resUsers.json();
      const selectEjecutor = document.getElementById("ejecutor_id");
      selectEjecutor.innerHTML = '<option value="">Seleccione un ejecutor</option>';
      users.filter(u => u.rol === "ejecutor").forEach(user => {
        const option = document.createElement("option");
        option.value = user.id;
        option.textContent = user.nombre;
        selectEjecutor.appendChild(option);
      });

    } catch (err) {
      console.error("Error al cargar selects dinámicos:", err);
    }
  }

  // Event Listeners
  document.getElementById("btnNuevoServicio").addEventListener("click", () => {
    atencionEditando = null;
    document.getElementById("formServicio").reset();
    document.getElementById("modalServicioLabel").textContent = "Crear Atención";
    cargarSelectsDinamicos();
    modalServicio.show();
  });

  document.getElementById("formServicio").addEventListener("submit", async (e) => {
    e.preventDefault();

    const submitBtn = document.querySelector("#formServicio button[type='submit']");
    const originalBtnText = submitBtn.innerHTML;
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Guardando...`;

    const nombre = document.getElementById("nombre").value.trim();
    const area_id = parseInt(document.getElementById("area_id").value);
    const ejecutor_id = parseInt(document.getElementById("ejecutor_id").value);

    if (!nombre || isNaN(area_id) || isNaN(ejecutor_id)) {
      mostrarToast("Todos los campos son obligatorios.", "danger");
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
      return;
    }

    const isEditing = !!atencionEditando;
    const url = isEditing
      ? `https://tickets.dev-wit.com/api/tipos/${atencionEditando.id}`
      : "https://tickets.dev-wit.com/api/tipos";

    const method = isEditing ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ nombre, area_id, ejecutor_id })
      });

      if (!res.ok) throw new Error("No se pudo guardar la atención");

      mostrarToast("Atención guardada exitosamente", "success");
      await cargarAtencionesDesdeAPI();

      setTimeout(() => {
        modalServicio.hide();
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      }, 2000);

    } catch (err) {
      console.error("Error al guardar atención:", err);
      mostrarToast(err.message || "Ocurrió un error al guardar la atención.", "danger");
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
    }
  });

  document.getElementById('modalServicio').addEventListener('hidden.bs.modal', function () {
    const submitBtn = document.querySelector("#formServicio button[type='submit']");
    submitBtn.disabled = false;
    submitBtn.innerHTML = 'Guardar';
  });

  window.editarAtencion = function(id) {
    const atencion = atenciones.find((s) => s.id === id);
    if (!atencion) return;

    atencionEditando = atencion;
    document.getElementById("modalServicioLabel").textContent = "Editar Atención";
    document.getElementById("servicioId").value = atencion.id;
    document.getElementById("nombre").value = atencion.nombre;

    cargarSelectsDinamicos().then(() => {
      document.getElementById("area_id").value = atencion.area_id;
      document.getElementById("ejecutor_id").value = atencion.ejecutor_id;
      modalServicio.show();
    });
  };

  window.confirmarEliminar = function(id) {
    const atencion = atenciones.find((s) => s.id === id);
    if (!atencion) return;

    atencionEliminando = atencion;
    document.getElementById("eliminarId").value = id;
    document.getElementById("textoEliminar").textContent = 
      `¿Estás seguro de que deseas eliminar la atención "${atencion.nombre}"? Esta acción no se puede deshacer.`;
    
    document.getElementById("passwordConfirm").value = "";
    modalEliminar.show();
  };

  document.getElementById("formEliminarAtencion").addEventListener("submit", async (e) => {
    e.preventDefault()
    e.stopPropagation()

    const password = document.getElementById("passwordConfirm").value.trim()
    const usuario = JSON.parse(localStorage.getItem("usuario"))

    if (!usuario || !password) {
      mostrarToast("Debe ingresar su contraseña para confirmar", "danger")
      return
    }

    const confirmBtn = document.getElementById("confirmarEliminar")
    const originalText = confirmBtn.innerHTML
    confirmBtn.disabled = true
    confirmBtn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Eliminando...`

    try {
      const authResponse = await fetch("https://tickets.dev-wit.com/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: usuario.email, 
          password: password 
        })
      })

      if (!authResponse.ok) {
        throw new Error("Contraseña incorrecta")
      }

      confirmBtn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Eliminando...`

      const deleteResponse = await fetch(`https://tickets.dev-wit.com/api/tipos/${atencionEliminando.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ password })
      })

      if (!deleteResponse.ok) {
        const errorData = await deleteResponse.json()
        throw new Error(errorData.message || "Error al eliminar la atención")
      }

      mostrarToast("Atención eliminada correctamente", "success")
      await cargarAtencionesDesdeAPI()

      // mantener desactivado el botón hasta cerrar el modal
      setTimeout(() => {
        bootstrap.Modal.getInstance(document.getElementById("modalEliminar")).hide()
        confirmBtn.disabled = false
        confirmBtn.innerHTML = originalText
      }, 2000)

    } catch (error) {
      console.error("Error en eliminación:", error)
      mostrarToast(error.message, "danger")
      confirmBtn.disabled = false
      confirmBtn.innerHTML = originalText
    }
  })

  // Inicialización
  searchInput.addEventListener("input", filtrar);
  cargarAtencionesDesdeAPI();

  // Función para mostrar toasts
  function mostrarToast(mensaje, tipo = "success") {
    const toastId = `toast-${tipo}`
    let toastEl = document.getElementById(toastId)
    if (!toastEl) {
      toastEl = document.createElement("div")
      toastEl.id = toastId
      toastEl.className = `toast align-items-center text-bg-${tipo} border-0 show position-absolute top-50 start-50 translate-middle`
      toastEl.role = "alert"
      toastEl.style.zIndex = 1060 // encima del modal
      toastEl.innerHTML = `
        <div class="d-flex">
          <div class="toast-body">${mensaje}</div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" aria-label="Cerrar"></button>
        </div>`
      
      const modalBody = document.querySelector(".modal.show .modal-body") || document.body
      modalBody.appendChild(toastEl)

      toastEl.querySelector(".btn-close").addEventListener("click", () => toastEl.remove())
    } else {
      toastEl.querySelector(".toast-body").textContent = mensaje
      toastEl.style.display = "block"
    }

    setTimeout(() => {
      toastEl.remove()
    }, 3500)
  } 
});



// // Mostrar toast
function mostrarToast(mensaje, tipo = "success") {
  const toastId = `toast-${tipo}`
  let toastEl = document.getElementById(toastId)
  if (!toastEl) {
    toastEl = document.createElement("div")
    toastEl.id = toastId
    toastEl.className = `toast align-items-center text-bg-${tipo} border-0 show position-absolute top-50 start-50 translate-middle`
    toastEl.role = "alert"
    toastEl.style.zIndex = 1060 // encima del modal
    toastEl.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">${mensaje}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" aria-label="Cerrar"></button>
      </div>`
    
    const modalBody = document.querySelector(".modal.show .modal-body") || document.body
    modalBody.appendChild(toastEl)

    toastEl.querySelector(".btn-close").addEventListener("click", () => toastEl.remove())
  } else {
    toastEl.querySelector(".toast-body").textContent = mensaje
    toastEl.style.display = "block"
  }

  setTimeout(() => {
    toastEl.remove()
  }, 3500)
}


// --- en submit POST/PUT --- reemplazar alert con:
// mostrarToast("Atención guardada exitosamente", "success")
// mostrarToast("Error al guardar atención", "danger")

// --- en eliminar ---
// mostrarToast("Atención eliminada correctamente", "success")
// mostrarToast("Error al eliminar atención", "danger")
