const token = localStorage.getItem("token");
if (!token) {
  window.location.href = "./index.html";
}

// Función para actualizar color del círculo según texto
function actualizarEstadoSistema(texto, estado) {
  const indicadores = document.querySelectorAll(".card .card-body .d-flex.align-items-center");

  indicadores.forEach((item) => {
    const spanTexto = item.querySelector("span.small")?.textContent?.trim();
    const circulo = item.querySelector("div.rounded-circle");

    if (spanTexto === texto && circulo) {
      // Limpiar clases previas
      circulo.classList.remove("bg-success", "bg-danger", "bg-warning");

      // Asignar nuevo estado visual
      if (estado === "ok") {
        circulo.classList.add("bg-success");
      } else if (estado === "error") {
        circulo.classList.add("bg-danger");
      } else if (estado === "advertencia") {
        circulo.classList.add("bg-warning");
      }
    }
  });
}

// Verificar conectividad API/DB
(async () => {
  try {
    const res = await fetch("https://tickets.dev-wit.com/api/users", {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (res.ok) {
      actualizarEstadoSistema("API Conectada", "ok");
      actualizarEstadoSistema("Base de Datos", "ok");

      // Mostrar cantidad de usuarios en bloque de estadísticas
      const data = await res.json();
      const totalUsuarios = Array.isArray(data) ? data.length : 0;

      const estadisticas = document.querySelectorAll(".card .card-body .d-flex.justify-content-between");
      estadisticas.forEach(item => {
        const label = item.querySelector("span.text-muted")?.textContent?.trim();
        const valor = item.querySelector("span.fw-bold");

        if (label === "Usuarios Registrados" && valor) {
          valor.textContent = totalUsuarios;
        }
      });
    } 
    else {
      actualizarEstadoSistema("API Conectada", "error");
      actualizarEstadoSistema("Base de Datos", "error");
    }
  } catch (err) {
    actualizarEstadoSistema("API Conectada", "error");
    actualizarEstadoSistema("Base de Datos", "error");
  }  
})();
