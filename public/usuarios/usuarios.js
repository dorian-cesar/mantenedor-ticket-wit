document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "../index.html";
  }

  let usuarios = [];

  const tablaUsuarios = document.getElementById("tablaUsuarios");
  const searchInput = document.getElementById("searchInput");
  const mensajeVacio = document.getElementById("mensajeVacio");
  const toastEl = document.getElementById("toastPassword");

  function renderUsuarios(data) {
    tablaUsuarios.innerHTML = "";
    if (data.length === 0) {
      mensajeVacio.style.display = "block";
      return;
    } else {
      mensajeVacio.style.display = "none";
    }

    data.forEach(usuario => {
      if (!usuario || !usuario.nombre || !usuario.email || !usuario.rol) return;

      const fila = document.createElement("tr");
      fila.innerHTML = `
        <td>${usuario.nombre}</td>
        <td>${usuario.email}</td>
        <td><span class="badge bg-${getRolColor(usuario.rol)}">${usuario.rol || 'Sin rol'}</span></td>
        <td>
          <button class="btn btn-sm btn-outline-primary me-1 btn-editar" data-id="${usuario.id}" data-nombre="${usuario.nombre}" data-email="${usuario.email}" data-rol="${usuario.rol}"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-sm btn-outline-warning me-1"><i class="bi bi-arrow-clockwise"></i></button>          
          <button class="btn btn-sm btn-outline-danger btn-eliminar" data-id="${usuario.id}">
            <i class="bi bi-trash"></i>
          </button>

        </td>
      `;
      tablaUsuarios.appendChild(fila);
    });

    document.querySelectorAll(".btn-editar").forEach(btn => {
      btn.addEventListener("click", () => {
        document.getElementById("editarId").value = btn.dataset.id;
        document.getElementById("editarNombre").value = btn.dataset.nombre;
        document.getElementById("editarEmail").value = btn.dataset.email;
        document.getElementById("editarRol").value = btn.dataset.rol;
        new bootstrap.Modal(document.getElementById("modalEditarUsuario")).show();
            }); 
        });  

        document.querySelectorAll(".btn-eliminar").forEach(btn => {
            btn.addEventListener("click", () => {
                const id = parseInt(btn.dataset.id);
                const currentUser = JSON.parse(localStorage.getItem("usuario"));

                if (id === currentUser.id) {
                document.getElementById("toastAutoEliminar").style.display = 'block';
                return;
                }

                document.getElementById("eliminarId").value = id;
                document.getElementById("passwordEliminar").value = "";
                new bootstrap.Modal(document.getElementById("modalEliminarUsuario")).show();
            });
        });

    }

    document.getElementById("formEliminarUsuario").addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = parseInt(document.getElementById("eliminarId").value);
    const password = document.getElementById("passwordEliminar").value.trim();
    const currentUser = JSON.parse(localStorage.getItem("usuario"));
    const email = currentUser?.email;

    if (!password || !email) {
        document.getElementById("toastEliminarError").style.display = 'block';
        return;
    }

    try {
        // Paso 1: Validar credenciales
        const loginRes = await fetch("https://tickets.dev-wit.com/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
        });

        if (!loginRes.ok) {
        document.getElementById("toastEliminarError").style.display = 'block';
        return;
        }

        // Paso 2: Proceder con eliminación
        const res = await fetch(`https://tickets.dev-wit.com/api/users/${id}`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ password })
        });

        if (!res.ok) {
        document.getElementById("toastEliminarError").style.display = 'block';
        return;
        }

        document.getElementById("toastEliminarExito").style.display = 'block';
        await cargarUsuariosDesdeAPI();
        searchInput.dispatchEvent(new Event("input"));

        setTimeout(() => {
        bootstrap.Modal.getInstance(document.getElementById("modalEliminarUsuario")).hide();
        document.getElementById("toastEliminarExito").style.display = 'none';
        }, 1500);

    } catch (error) {
        console.error("Error al eliminar usuario:", error);
        document.getElementById("toastEliminarError").style.display = 'block';
    }
    });


  function getRolColor(rol) {
    if (!rol) return "secondary";
    switch (rol.toLowerCase()) {
      case "admin": return "danger";
      case "soporte": return "primary";
      case "usuario": return "success";
      case "ejecutor": return "info";
      case "solicitante": return "warning";
      default: return "secondary";
    }
  }

  searchInput.addEventListener("input", () => {
    const term = searchInput.value.toLowerCase();
    const filtrados = usuarios.filter(u =>
      (u.nombre || "").toLowerCase().includes(term) ||
      (u.email || "").toLowerCase().includes(term) ||
      (u.rol || "").toLowerCase().includes(term)
    );
    renderUsuarios(filtrados);
  });

  document.getElementById("formUsuario").addEventListener("submit", async (e) => {
    e.preventDefault();

    const nombre = document.getElementById("nombre").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const confirmarPassword = document.getElementById("confirmarPassword").value.trim();
    const rol = document.getElementById("rol").value;

    if (!nombre || !email || !password || !confirmarPassword || !rol) {
      alert("Todos los campos son obligatorios.");
      return;
    }

    if (password.length < 8 || password !== confirmarPassword) {
      toastEl.style.display = 'block';
      return;
    }

    const nuevoUsuario = { nombre, email, password, rol };

    try {
      const res = await fetch("https://tickets.dev-wit.com/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(nuevoUsuario)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData?.message || `Error ${res.status}`);
      }

      const creado = await res.json();
      usuarios.push(creado);
      renderUsuarios(usuarios);

      const toastExito = document.getElementById("toastExito");
      toastExito.style.display = 'block';

      setTimeout(() => {
        bootstrap.Modal.getInstance(document.getElementById("modalUsuario")).hide();
        toastExito.style.display = 'none';
        e.target.reset();
      }, 3500);

    } catch (error) {
      console.error("Error al crear usuario:", error);
      alert("No se pudo crear el usuario. " + error.message);
    }
  });

  document.getElementById("formEditarUsuario").addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = document.getElementById("editarId").value;
    const nombre = document.getElementById("editarNombre").value.trim();
    const email = document.getElementById("editarEmail").value.trim();
    const rol = document.getElementById("editarRol").value;

    if (!id || !nombre || !email || !rol) {
      alert("Todos los campos son obligatorios.");
      return;
    }

    try {
      const res = await fetch(`https://tickets.dev-wit.com/api/users/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ nombre, email, rol })
      });

      if (!res.ok) {
        let errorData = await res.json();
        document.getElementById("toastEditarError").style.display = 'block';
        throw new Error(errorData?.message || `Error ${res.status}`);
      }

      const actualizado = await res.json();
        // Mostrar toast de éxito
        document.getElementById("toastEditarExito").style.display = 'block';

        // Cargar nuevamente todos los usuarios desde la API
        await cargarUsuariosDesdeAPI();

        // Reaplicar el filtro actual (si existe)
        searchInput.dispatchEvent(new Event("input"));


      // Cerrar modal tras 1.5s
      setTimeout(() => {
        bootstrap.Modal.getInstance(document.getElementById("modalEditarUsuario")).hide();
        document.getElementById("toastEditarExito").style.display = 'none';
      }, 1500);

    } catch (error) {
      console.error("Error al actualizar usuario:", error);
    }
  });

  async function cargarUsuariosDesdeAPI() {
    if (!token) {
      alert("No hay token. Debes iniciar sesión.");
      window.location.href = "index.html";
      return;
    }

    try {
      const res = await fetch("https://tickets.dev-wit.com/api/users", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error(`Error ${res.status}`);

      usuarios = await res.json();
      renderUsuarios(usuarios);

    } catch (error) {
      console.error("Error al cargar usuarios:", error);
      mensajeVacio.textContent = "Error al cargar usuarios.";
      mensajeVacio.style.display = "block";
    }
  }

  cargarUsuariosDesdeAPI();
});
