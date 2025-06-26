function inicializarNavbar() {
  const usuario = JSON.parse(localStorage.getItem("usuario"));

  if (!usuario || !usuario.email) {
    window.location.href = "/index.html";
    return;
  }

  // Esperar a que los elementos estén realmente en el DOM
  const nombreEl = document.getElementById("usuarioNombre");
  const rolEl = document.getElementById("usuarioRol");
  const dropdownNombre = document.getElementById("dropdownUsuarioNombre");
  const dropdownEmail = document.getElementById("dropdownUsuarioEmail");
  const avatar = document.getElementById("usuarioAvatar");
  const btnLogout = document.getElementById("cerrarSesion");

  // Si no están presentes aún, reintentar después
  if (!nombreEl || !rolEl || !dropdownNombre || !dropdownEmail || !avatar || !btnLogout) {
    return setTimeout(inicializarNavbar, 50); // intenta de nuevo en 50ms
  }

  nombreEl.textContent = usuario.nombre;
  rolEl.textContent = usuario.rol;
  dropdownNombre.textContent = usuario.nombre;
  dropdownEmail.textContent = usuario.email;
  avatar.src = usuario.avatar || "/img/usuario.png"; // Usa un avatar por defecto si no hay

  btnLogout.addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");

    Swal.fire({
      title: "¡Sesión cerrada!",
      text: "Has cerrado sesión correctamente.",
      icon: "success",
      timer: 1800,
      timerProgressBar: true,
      showConfirmButton: false,
      background: "#f0f2f5",
      color: "#333",
      didOpen: () => {
        Swal.showLoading();
      },
      willClose: () => {
        window.location.href = "/index.html";
      }
    });
  });
}