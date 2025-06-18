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

    try {
      const respuesta = await fetch('https://tickets.dev-wit.com/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(datos)
      });

      if (!respuesta.ok) {
        if (respuesta.status === 401) {
          throw new Error('Contraseña incorrecta o usuario no autorizado.');
        } else if (respuesta.status === 404) {
          throw new Error('Correo no registrado.');
        } else {
          throw new Error('Error de servidor. Intenta nuevamente.');
        }
      }

      const resultado = await respuesta.json();

      if (!resultado.token || !resultado.user) {
        throw new Error('Respuesta inválida del servidor.');
      }

      // Guardar token y datos del usuario en localStorage
      localStorage.setItem('token', resultado.token);
      localStorage.setItem('usuario', JSON.stringify(resultado.user));

      // Redirigir al dashboard
      window.location.href = 'dashboard.html';

    } catch (error) {
      errorLogin.textContent = error.message;
      errorLogin.style.display = 'block';
    }
  });
});
