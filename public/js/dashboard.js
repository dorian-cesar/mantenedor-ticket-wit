window.addEventListener("message", (event) => {
  if (
    event.origin === "https://mesa-de-ayuda.dev-wit.com/views/options.html" && // Cambia al dominio que abre el mantenedor
    event.data?.type === "token"
  ) {
    localStorage.setItem("token", event.data.token);
    console.log("Token recibido y guardado en localStorage");
    // Aquí puedes hacer cualquier inicialización que necesites
  }
});

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

// Función para obtener y contar tickets por estado
async function obtenerEstadisticasTickets() {
  try {
    const res = await fetch("https://tickets.dev-wit.com/api/tickets", {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!res.ok) throw new Error("Error al obtener tickets");

    const tickets = await res.json();
    if (!Array.isArray(tickets)) return {};

    // Normalizar estados a minúsculas para comparación
    return {
      creados: tickets.filter(t => t.estado && t.estado.toLowerCase() === "creado").length,
      enEjecucion: tickets.filter(t => t.estado && t.estado.toLowerCase() === "en ejecución").length,
      pendientes: tickets.filter(t => t.estado && t.estado.toLowerCase() === "pendiente por presupuesto").length,
      cancelados: tickets.filter(t => t.estado && t.estado.toLowerCase() === "cancelado").length,
      listos: tickets.filter(t => t.estado && t.estado.toLowerCase() === "listo").length
    };
  } catch (err) {
    console.error("Error al obtener estadísticas de tickets:", err);
    return {};
  }
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

  // Cargar y mostrar cantidad de áreas
  try {
    const resAreas = await fetch("https://tickets.dev-wit.com/api/areas", {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (resAreas.ok) {
      const areas = await resAreas.json();
      const totalAreas = Array.isArray(areas) ? areas.length : 0;

      const estadisticas = document.querySelectorAll(".card .card-body .d-flex.justify-content-between");
      estadisticas.forEach(item => {
        const label = item.querySelector("span.text-muted")?.textContent?.trim();
        const valor = item.querySelector("span.fw-bold");

        if (label === "Áreas Configuradas" && valor) {
          valor.textContent = totalAreas;
        }
      });
    }
  } catch (err) {
    console.error("Error al obtener áreas:", err);
  }

  // Cargar y mostrar cantidad de tipos de atención
  try {
    const resTipos = await fetch("https://tickets.dev-wit.com/api/tipos", {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (resTipos.ok) {
      const tipos = await resTipos.json();
      const totalTipos = Array.isArray(tipos) ? tipos.length : 0;

      const estadisticas = document.querySelectorAll(".card .card-body .d-flex.justify-content-between");
      estadisticas.forEach(item => {
        const label = item.querySelector("span.text-muted")?.textContent?.trim();
        const valor = item.querySelector("span.fw-bold");

        if (label === "Tipos de Atención" && valor) {
          valor.textContent = totalTipos;
        }
      });
    }
  } catch (err) {
    console.error("Error al obtener tipos de atención:", err);
  }

  // Cargar y mostrar estadísticas de tickets
  try {
    const stats = await obtenerEstadisticasTickets();

    const estadisticas = document.querySelectorAll(".card .card-body .d-flex.justify-content-between");
    estadisticas.forEach(item => {
      const label = item.querySelector("span.text-muted")?.textContent?.trim();
      const valor = item.querySelector("span.fw-bold");

      if (!label || !valor) return;

      switch(label) {
        case "Tickets creados":
          valor.textContent = stats.creados ?? "--";
          break;
        case "Tickets en ejecución":
          valor.textContent = stats.enEjecucion ?? "--";
          break;
        case "Tickets pendientes":
          valor.textContent = stats.pendientes ?? "--";
          break;
        case "Tickets cancelados":
          valor.textContent = stats.cancelados ?? "--";
          break;
        case "Tickets listos":
          valor.textContent = stats.listos ?? "--";
          break;
      }
    });
  } catch (err) {
    console.error("Error al mostrar estadísticas de tickets:", err);
  }

})();