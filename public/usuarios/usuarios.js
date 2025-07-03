document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "../index.html";
  }  

  let usuarios = [];

  const tablaUsuarios = document.getElementById("tablaUsuarios");
  const searchInput = document.getElementById("searchInput");
  const mensajeVacio = document.getElementById("mensajeVacio");
 

  function renderUsuarios(data) {
  const currentUser = JSON.parse(localStorage.getItem("usuario"));
  tablaUsuarios.innerHTML = "";
    if (data.length === 0) {
      mensajeVacio.style.display = "block";
      return;
    } else {
      mensajeVacio.style.display = "none";
    }

    const mapaUsuarios = {};
    data.forEach(u => {
      if (u?.id) {
        mapaUsuarios[u.id] = u.nombre;
      }
    });

    data.forEach(usuario => {
      if (!usuario || !usuario.nombre || !usuario.email || !usuario.rol) return;

      const fila = document.createElement("tr");
      fila.innerHTML = `
        <td>${usuario.id}</td>
        <td>${usuario.nombre}</td>
        <td>${usuario.email}</td>
        <td><span class="badge ${getRolBadgeClass(usuario.rol)}">${usuario.rol || 'Sin rol'}</span></td>
        <td>${mapaUsuarios[usuario.id_jefatura] || '-'}</td>
        <td class="text-center">
          <div class="d-inline-flex gap-2">
            <button class="btn btn-sm btn-outline-primary me-1 btn-editar" data-id="${usuario.id}" data-nombre="${usuario.nombre}" data-email="${usuario.email}" data-rol="${usuario.rol}">
              <i class="bi bi-pencil"></i>
            </button>
            ${usuario.id === currentUser.id
              ? `<button class="btn btn-sm btn-secondary" disabled title="No puedes eliminar tu propia cuenta">
                  <i class="bi bi-lock"></i>
                </button>`
              : `<button class="btn btn-sm btn-outline-danger btn-eliminar" data-id="${usuario.id}">
                  <i class="bi bi-trash"></i>
                </button>`
            }
          </div>
        </td>
      `;
      tablaUsuarios.appendChild(fila);
    });      

    document.querySelectorAll(".btn-editar").forEach(btn => {
      btn.addEventListener("click", async () => {
        document.getElementById("editarId").value = btn.dataset.id;
        document.getElementById("editarNombre").value = btn.dataset.nombre;
        document.getElementById("editarEmail").value = btn.dataset.email;
        document.getElementById("editarRol").value = btn.dataset.rol;

        // Llama a cargar supervisores con el ID seleccionado
        const usuarioEditado = usuarios.find(u => u.id === parseInt(btn.dataset.id));
        const idSupervisor = usuarioEditado?.id_jefatura || null;

        await cargarSupervisoresJefatura("editarSupervisor", idSupervisor);

        new bootstrap.Modal(document.getElementById("modalEditarUsuario")).show();
      });
    }); 

    document.querySelectorAll(".btn-eliminar").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = parseInt(btn.dataset.id);

        document.getElementById("eliminarId").value = id;
        document.getElementById("passwordEliminar").value = "";
        new bootstrap.Modal(document.getElementById("modalEliminarUsuario")).show();
      });
    });
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

      await cargarUsuariosDesdeAPI();
      searchInput.dispatchEvent(new Event("input"));

      showToast("Éxito", "Lista de usuarios actualizada.");

      setTimeout(() => {
        btn.disabled = false;
        icono.className = "bi bi-arrow-clockwise me-1";
        btn.innerHTML = `<i class="bi bi-arrow-clockwise me-1"></i>Actualizar`;
      }, 800);
    });
  }

  document.getElementById("formEliminarUsuario").addEventListener("submit", async (e) => {
  e.preventDefault();

  const id = parseInt(document.getElementById("eliminarId").value);
  const password = document.getElementById("passwordEliminar").value.trim();
  const currentUser = JSON.parse(localStorage.getItem("usuario"));
  const email = currentUser?.email;

  if (!password || !email) {
    showToast("Error", "Debes ingresar tu contraseña para confirmar.", true);
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
        showToast("Error", "Contraseña incorrecta.", true);
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
        showToast("Error", "No se pudo eliminar el usuario. Intenta nuevamente o contacta al administrador.", true);
        return;
      }
      
      await cargarUsuariosDesdeAPI();
      searchInput.dispatchEvent(new Event("input"));

      showToast("Éxito", "Usuario eliminado correctamente.");
      setTimeout(() => {
        bootstrap.Modal.getInstance(document.getElementById("modalEliminarUsuario")).hide();
      }, 1500);

  } catch (error) {
      console.error("Error al eliminar usuario:", error);        
    }
  });  

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
      showToast("Error", "La contraseña debe tener al menos 8 caracteres y coincidir con la confirmación.", true);
      return;
    }

    const supervisorId = document.getElementById("supervisor").value;

    if (!supervisorId) {
      showToast("Error", "Debes seleccionar un supervisor.", true);
      return;
    }   

    const nuevoUsuario = {
      nombre,
      email,
      password,
      rol,
      id_jefatura: parseInt(supervisorId)
    };

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
        throw new Error(errorData?.error || errorData?.message || `Error ${res.status}`);
      }     

      const creado = await res.json();
      await cargarUsuariosDesdeAPI();
      searchInput.dispatchEvent(new Event("input"));      

      showToast("Éxito", "Usuario creado exitosamente.");
      setTimeout(() => {
        bootstrap.Modal.getInstance(document.getElementById("modalUsuario")).hide();
        e.target.reset();
      }, 1500);

    } catch (error) {
      console.error("Error al crear usuario:", error);

      if (error.message.includes("correo electrónico ya está registrado")) {
        showToast("Error", "Este correo ya está en uso. Intenta con otro.", true);
      } else {
        showToast("Error", "No se pudo crear el usuario. " + error.message, true);
      }
    }
  });

  document.getElementById("formEditarUsuario").addEventListener("submit", async (e) => {
      e.preventDefault();

      const id = document.getElementById("editarId").value;
      const nombre = document.getElementById("editarNombre").value.trim();
      const email = document.getElementById("editarEmail").value.trim();
      const rol = document.getElementById("editarRol").value;
      const password = document.getElementById("editarPassword").value.trim();
      const confirmar = document.getElementById("confirmarEditarPassword").value.trim();
      const supervisorId = document.getElementById("editarSupervisor").value;

      // Validar contraseña solo si se proporcionó
      if (password || confirmar) {
          if (password.length < 8 || password !== confirmar) {
              showToast("Error", "La nueva contraseña debe tener al menos 8 caracteres y coincidir.", true);
              return;
          }
      }

      // Luego crear el objeto payload
      const payload = { nombre, email };
      if (rol) payload.rol = rol;

      
      // Agregar campos condicionales
      if (password) payload.password = password;
      if (supervisorId) payload.id_jefatura = parseInt(supervisorId);

      try {
          const res = await fetch(`https://tickets.dev-wit.com/api/users/${id}`, {
              method: "PUT",
              headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${token}`
              },
              body: JSON.stringify(payload)
          });

          if (!res.ok) {
              const errorData = await res.json();        
              throw new Error(errorData?.message || `Error ${res.status}`);
          }
          
          await cargarUsuariosDesdeAPI();
          searchInput.dispatchEvent(new Event("input"));

          showToast("Éxito", "Usuario actualizado correctamente.");
          setTimeout(() => {
              bootstrap.Modal.getInstance(document.getElementById("modalEditarUsuario")).hide();
          }, 1500);

      } catch (error) {
          console.error("Error al actualizar usuario:", error);
          showToast("Error", "No se pudo actualizar el usuario. " + error.message, true);
      }
  });

  async function cargarUsuariosDesdeAPI() {
    if (!token) {      
        window.location.href = "index.html";
        return;
    }

    try {
        const res = await fetch("https://tickets.dev-wit.com/api/users", {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        // Manejo centralizado de errores de autenticación (401)
        if (res.status === 401) {
            throw new Error("TOKEN_INVALIDO");
        }

        if (!res.ok) {
            throw new Error(`Error ${res.status}`);
        }

        usuarios = await res.json();
        renderUsuarios(usuarios);

    } catch (error) {
        if (error.message === "TOKEN_INVALIDO") {
            // Limpiar datos y redirigir al login
            localStorage.removeItem("token");
            localStorage.removeItem("usuario");
            window.location.href = "../index.html";
        } else {
            console.error("Error al cargar usuarios:", error);
            mensajeVacio.textContent = "Error al cargar usuarios.";
            mensajeVacio.style.display = "block";
        }
    }
  }

  cargarUsuariosDesdeAPI();

  document.getElementById("modalUsuario").addEventListener("show.bs.modal", () => {
    cargarSupervisoresJefatura();
  })
    
  const urlParams = new URLSearchParams(window.location.search);
  const crearDesdeDashboard = urlParams.get("crear") === "1";

  // Solo abrir modal si viene el parámetro
  if (crearDesdeDashboard) {
    // Solo si NO se ha usado en esta navegación
    if (!sessionStorage.getItem("modalUsuarioAbierto")) {
      const modalCrear = new bootstrap.Modal(document.getElementById("modalUsuario"));
      modalCrear.show();

      // Eliminar el flag apenas se abra el modal
      sessionStorage.setItem("modalUsuarioAbierto", "true");

      // Limpieza inmediata del parámetro para futuras entradas
      window.history.replaceState({}, document.title, window.location.pathname);
      setTimeout(() => {
        sessionStorage.removeItem("modalUsuarioAbierto");
      }, 100); // pequeña demora para asegurar apertura
    }
  }

  async function cargarSupervisoresJefatura(targetSelectId = "supervisor", selectedId = null) {
    const select = document.getElementById(targetSelectId);

    try {
      const res = await fetch("https://tickets.dev-wit.com/api/users", {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!res.ok) throw new Error("Error al cargar supervisores");

      const data = await res.json();
      const jefes = data.filter(user => user.rol === "jefatura");

      select.innerHTML = '<option value="">Seleccione un supervisor</option>';

      jefes.forEach(jefe => {
        const option = document.createElement("option");
        option.value = jefe.id;
        option.textContent = `${jefe.nombre} (${jefe.email})`;
        if (selectedId && jefe.id === parseInt(selectedId)) {
          option.selected = true;
        }
        select.appendChild(option);
      });

    } catch (error) {
      console.error("Error al cargar supervisores jefatura:", error);
    }
  }

  function getRolBadgeClass(rol) {
    if (!rol) return "bg-secondary";

    const normalized = rol.trim().toLowerCase();

    if (normalized === "ejecutor") return "badge-usuario-ejecutor";
    if (normalized === "solicitante") return "badge-usuario-solicitante";
    if (normalized === "admin") return "badge-usuario-admin";
    if (normalized === "jefatura") return "badge-usuario-jefatura";
    if (normalized === "superuser") return "badge-usuario-superuser";

    return "bg-secondary"; // fallback
  }

});