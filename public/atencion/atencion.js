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
        <td>${srv.categoria}</td>
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
      s.categoria.toLowerCase().includes(term) ||
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

      // Cargar categorías
      const resCategorias = await fetch("https://tickets.dev-wit.com/api/categorias", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const categorias = await resCategorias.json();
      const selectCategoria = document.getElementById("categoria_id");
      selectCategoria.innerHTML = '<option value="">Seleccione una categoría</option>';
      categorias.forEach(categoria => {
        const option = document.createElement("option");
        option.value = categoria.id;
        option.textContent = categoria.nombre;
        selectCategoria.appendChild(option);
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

  // Formulario de creación atención
  document.getElementById("formServicio").addEventListener("submit", async (e) => {
    e.preventDefault();

    const submitBtn = document.querySelector("#formServicio button[type='submit']");
    const originalBtnText = submitBtn.innerHTML;
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Guardando...`;

    const nombre = document.getElementById("nombre").value.trim();
    const categoria_id = parseInt(document.getElementById("categoria_id").value);
    const area_id = parseInt(document.getElementById("area_id").value);
    const ejecutor_id = parseInt(document.getElementById("ejecutor_id").value);

    if (!nombre || isNaN(area_id) || isNaN(ejecutor_id)) {
      showToast("Error", "Todos los campos son obligatorios.", true);
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
        body: JSON.stringify({ nombre, categoria_id, area_id, ejecutor_id })
      });

      if (!res.ok) throw new Error("No se pudo guardar la atención");

      const mensaje = isEditing
        ? "Atención editada exitosamente"
        : "Atención creada exitosamente";

      showToast("Éxito", mensaje);

      await cargarAtencionesDesdeAPI();

      setTimeout(() => {
        modalServicio.hide();
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      }, 2000);

    } catch (err) {
      console.error("Error al guardar atención:", err);      
      showToast("Error", err.message || "Ocurrió un error al guardar la atención.", true);
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
      document.getElementById("categoria_id").value = atencion.categoria_id;
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

  // Formulario de eliminar atención
  document.getElementById("formEliminarAtencion").addEventListener("submit", async (e) => {
    e.preventDefault()
    e.stopPropagation()

    const password = document.getElementById("passwordConfirm").value.trim()
    const usuario = JSON.parse(localStorage.getItem("usuario"))

    if (!usuario || !password) {
      showToast("Error", "Debe ingresar su contraseña para confirmar", true);
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
        showToast("Error", "Contraseña incorrecta", true);
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
        showToast("Error", "Hubo un error al eliminar la atención", true);
        throw new Error(errorData.message || "Hubo un error al eliminar la atención")
      }

      showToast("Éxito", "Atención eliminada correctamente");
      await cargarAtencionesDesdeAPI()

      // mantener desactivado el botón hasta cerrar el modal
      setTimeout(() => {
        bootstrap.Modal.getInstance(document.getElementById("modalEliminar")).hide()
        confirmBtn.disabled = false
        confirmBtn.innerHTML = originalText
      }, 2000)

    } catch (error) {
      console.error("Error en eliminación:", error)      
      confirmBtn.disabled = false
      confirmBtn.innerHTML = originalText
    }
  })

  // Inicialización
  searchInput.addEventListener("input", filtrar);
  cargarAtencionesDesdeAPI();

});