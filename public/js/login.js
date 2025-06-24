document.addEventListener('DOMContentLoaded', () => {
  const formularioInicio = document.getElementById('form-inicio');
  const campoEmail = document.getElementById('email');
  const campoPassword = document.getElementById('password');
  const errorLogin = document.getElementById('error-login');

  formularioInicio.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Limpiar mensajes previos
    errorLogin.style.display = 'none';
    errorLogin.textContent = '';

    const datos = {
      email: campoEmail.value.trim(),
      password: campoPassword.value.trim()
    };

    const btn = document.getElementById("btn-ingresar");
    btn.disabled = true;
    btn.classList.add("btn-cargando");

    try {
      const respuesta = await fetch('https://tickets.dev-wit.com/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(datos)
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json().catch(() => ({}));
        const mensaje = (errorData?.message || "").toLowerCase();

        if (respuesta.status === 401) {
          if (mensaje.includes("user no encontrado")) {
            throw new Error("El correo ingresado no está registrado.");
          }
          if (mensaje.includes("credenciales inválidas")) {
            throw new Error("La contraseña ingresada es incorrecta.");
          }
          throw new Error("No autorizado. Verifica tus datos.");
        }

        throw new Error("Error inesperado del servidor. Intenta nuevamente más tarde.");
      }

      const resultado = await respuesta.json();

      if (!resultado.token || !resultado.user) {
        throw new Error('Respuesta inválida del servidor.');
      }

      if (resultado.user?.rol?.toLowerCase() !== "admin") {
        throw new Error("No tienes permitido acceder.");
      }

      // Guardar token y datos del usuario en localStorage
      localStorage.setItem('token', resultado.token);
      localStorage.setItem('usuario', JSON.stringify({
        id: resultado.user.id,
        nombre: resultado.user.nombre,
        rol: resultado.user.rol,
        email: datos.email 
      }));


      // Redirigir al dashboard
      window.location.href = 'dashboard.html';

    } catch (error) {
      errorLogin.textContent = error.message;
      errorLogin.style.display = 'block';
      btn.disabled = false;
      btn.classList.remove("btn-cargando");

    }
  });
});
