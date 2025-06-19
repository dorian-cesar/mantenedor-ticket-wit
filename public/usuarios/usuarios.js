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
          <button class="btn btn-sm btn-outline-primary me-1"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-sm btn-outline-warning me-1"><i class="bi bi-arrow-clockwise"></i></button>
          <button class="btn btn-sm btn-outline-danger"><i class="bi bi-trash"></i></button>
        </td>
      `;
      tablaUsuarios.appendChild(fila);
    });
  }

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
      u.nombre.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
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

    const nuevoUsuario = {
      nombre,
      email,
      password,
      rol
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
        let errorData;
        try {
            errorData = await res.json();
        } catch (_) {
            errorData = { message: "Respuesta inválida del servidor" };
        }
        console.error("Detalle error servidor:", errorData);
        throw new Error(errorData?.message || `Error ${res.status}`);
        }


      const creado = await res.json();
        usuarios.push(creado);
        renderUsuarios(usuarios);

        // Mostrar toast de éxito
        const toastExito = document.getElementById("toastExito");
        toastExito.style.display = 'block';

        // Esperar 1.5 segundos y luego cerrar el modal
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

      if (!res.ok) {
        throw new Error(`Error ${res.status}`);
      }

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
