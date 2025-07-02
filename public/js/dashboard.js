// Paso 1: Avisar que estamos listos para recibir el token si venimos redirigidos
window.opener?.postMessage("READY_FOR_TOKEN", "*"); // Permitimos todos los orígenes al enviar, se valida al recibir

// Paso 2: Escuchar token enviado desde la página origen
window.addEventListener("message", (event) => {
  const origenValido =
    event.origin === "https://ticket-wit.netlify.app" ||
    event.origin === "https://mesadeayuda.pullman.cl";

  if (origenValido && event.data?.type === "token") {
    localStorage.setItem("token", event.data.token);
    localStorage.setItem("usuario", JSON.stringify(event.data.usuario));
    console.log("Token y usuario recibidos vía postMessage");
    location.reload(); // Recargar para que se inicie el dashboard normalmente
  }
});

// Paso 3: Ejecutar lógica solo si hay token válido
document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "./index.html";
    return;
  }
  iniciarDashboardConToken(token);
});


// Paso 4: Función principal del dashboard
function iniciarDashboardConToken(token) {
  // Verificar conectividad API/DB
  fetch("https://tickets.dev-wit.com/api/users", {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  })
    .then((res) => {
      if (!res.ok) throw new Error("No se pudo conectar a la API");
      return res.json();
    })
    .then((data) => {
      actualizarEstadoSistema("API Conectada", "ok");
      actualizarEstadoSistema("Base de Datos", "ok");

      const totalUsuarios = Array.isArray(data) ? data.length : 0;
      const estadisticas = document.querySelectorAll(".card .card-body .d-flex.justify-content-between");
      estadisticas.forEach(item => {
        const label = item.querySelector("span.text-muted")?.textContent?.trim();
        const valor = item.querySelector("span.fw-bold");
        if (label === "Usuarios Registrados" && valor) {
          valor.textContent = totalUsuarios;
        }
      });
    })
    .catch((err) => {
      actualizarEstadoSistema("API Conectada", "error");
      actualizarEstadoSistema("Base de Datos", "error");
      console.error("Error al cargar usuarios:", err);
    });

  // Cargar y mostrar cantidad de áreas
  fetch("https://tickets.dev-wit.com/api/areas", {
    headers: { "Authorization": `Bearer ${token}` }
  })
    .then(res => res.ok ? res.json() : Promise.reject("Error al obtener áreas"))
    .then(areas => {
      const totalAreas = Array.isArray(areas) ? areas.length : 0;
      const estadisticas = document.querySelectorAll(".card .card-body .d-flex.justify-content-between");
      estadisticas.forEach(item => {
        const label = item.querySelector("span.text-muted")?.textContent?.trim();
        const valor = item.querySelector("span.fw-bold");
        if (label === "Áreas Configuradas" && valor) {
          valor.textContent = totalAreas;
        }
      });
    })
    .catch(err => console.error("Error al obtener áreas:", err));

  // Cargar y mostrar cantidad de tipos de atención
  fetch("https://tickets.dev-wit.com/api/tipos", {
    headers: { "Authorization": `Bearer ${token}` }
  })
    .then(res => res.ok ? res.json() : Promise.reject("Error al obtener tipos"))
    .then(tipos => {
      const totalTipos = Array.isArray(tipos) ? tipos.length : 0;
      const estadisticas = document.querySelectorAll(".card .card-body .d-flex.justify-content-between");
      estadisticas.forEach(item => {
        const label = item.querySelector("span.text-muted")?.textContent?.trim();
        const valor = item.querySelector("span.fw-bold");
        if (label === "Tipos de Atención" && valor) {
          valor.textContent = totalTipos;
        }
      });
    })
    .catch(err => console.error("Error al obtener tipos de atención:", err));

  // Cargar y mostrar estadísticas de tickets
  obtenerEstadisticasTickets(token)
    .then(stats => {
      const estadisticas = document.querySelectorAll(".card .card-body .d-flex.justify-content-between");
      estadisticas.forEach(item => {
        const label = item.querySelector("span.text-muted")?.textContent?.trim();
        const valor = item.querySelector("span.fw-bold");

        if (!label || !valor) return;

        switch(label) {
          case "Tickets asignados":
            valor.textContent = stats.asignado ?? "--";
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
          case "Tickets rechazados":
            valor.textContent = stats.rechazados ?? "--";
            break;
        }
      });
    })
    .catch(err => console.error("Error al mostrar estadísticas de tickets:", err));
}

function actualizarEstadoSistema(texto, estado) {
  const indicadores = document.querySelectorAll(".card .card-body .d-flex.align-items-center");
  indicadores.forEach((item) => {
    const spanTexto = item.querySelector("span.small")?.textContent?.trim();
    const circulo = item.querySelector("div.rounded-circle");
    if (spanTexto === texto && circulo) {
      circulo.classList.remove("bg-success", "bg-danger", "bg-warning");
      if (estado === "ok") circulo.classList.add("bg-success");
      else if (estado === "error") circulo.classList.add("bg-danger");
      else if (estado === "advertencia") circulo.classList.add("bg-warning");
    }
  });
}

async function obtenerEstadisticasTickets(token) {
  try {
    const [ticketsRes, estadosRes] = await Promise.all([
      fetch("https://tickets.dev-wit.com/api/tickets", {
        headers: { Authorization: `Bearer ${token}` }
      }),
      fetch("https://tickets.dev-wit.com/api/estados", {
        headers: { Authorization: `Bearer ${token}` }
      })
    ]);

    if (!ticketsRes.ok || !estadosRes.ok) throw new Error("Error al obtener datos");

    const tickets = await ticketsRes.json();
    const estados = await estadosRes.json();

    const estadoMap = Object.fromEntries(estados.map(e => [e.nombre.toLowerCase(), e.id]));

    return {
      asignado: tickets.filter(t => t.id_estado === estadoMap["asignado"]).length,
      enEjecucion: tickets.filter(t => t.id_estado === estadoMap["en ejecución"]).length,
      pendientes: tickets.filter(t =>
        t.id_estado === estadoMap["pendiente pa"] ||
        t.id_estado === estadoMap["pendiente pp"]
      ).length,
      cancelados: tickets.filter(t => t.id_estado === estadoMap["cancelado"]).length,
      listos: tickets.filter(t => t.id_estado === estadoMap["listo"]).length,
      rechazados: tickets.filter(t => t.id_estado === estadoMap["rechazado"]).length
    };
  } catch (err) {
    console.error("Error al obtener estadísticas de tickets:", err);
    return {};
  }
}

