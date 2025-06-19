const token = localStorage.getItem("token");
if (!token) {
  window.location.href = "./index.html"; // o "../index.html" según estructura
}

const tickets = [
  {
    id: "TK-001",
    title: "Error en el sistema de pagos",
    user: "María González",
    priority: "Alta",
    status: "Abierto",
    departamento: 1,
    createdAt: "2024-01-15",
  },
  {
    id: "TK-002",
    title: "Solicitud de nueva funcionalidad",
    user: "Carlos Ruiz",
    priority: "Media",
    status: "En Progreso",
    departamento: 2,
    createdAt: "2024-01-14",
  },
  {
    id: "TK-003",
    title: "Problema de acceso al sistema",
    user: "Ana López",
    priority: "Alta",
    status: "Resuelto",
    departamento: 3,
    createdAt: "2024-01-13",
  },
  {
    id: "TK-004",
    title: "Consulta sobre facturación",
    user: "Pedro Martín",
    priority: "Baja",
    status: "Abierto",
    departamento: 4,
    createdAt: "2024-01-16",
  },
  {
    id: "TK-005",
    title: "Error 500 en módulo de reportes",
    user: "Laura Sánchez",
    priority: "Alta",
    status: "En Progreso",
    departamento: 5,
    createdAt: "2024-01-12",
  },
]

let areasMap = {}

async function fetchAreas() {
  try {
    const token = localStorage.getItem("token")
    if (!token) {
      console.error("Token JWT no encontrado en localStorage.")
      return
    }

    const response = await fetch("https://tickets.dev-wit.com/api/areas", {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`)
    }

    const areas = await response.json()
    areasMap = areas.reduce((map, area) => {
      map[area.id] = area.nombre
      return map
    }, {})
  } catch (error) {
    console.error("Error al obtener las áreas:", error)
  }
}


const tbody = document.querySelector("#ticketsTable tbody")
const searchInput = document.getElementById("searchInput")
const statusFilter = document.getElementById("statusFilter")

function renderTickets() {
  const search = searchInput.value.toLowerCase()
  const status = statusFilter.value
  tbody.innerHTML = ""

  tickets.forEach((ticket) => {
    const matchesSearch =
      ticket.title.toLowerCase().includes(search) ||
      ticket.user.toLowerCase().includes(search) ||
      ticket.id.toLowerCase().includes(search)

    const matchesStatus = status === "Todos" || ticket.status === status

    if (matchesSearch && matchesStatus) {
      const row = `<tr>
        <td>${ticket.id}</td>
        <td>${ticket.title}</td>
        <td>${ticket.user}</td>
        <td><span class="badge ${getPriorityClass(ticket.priority)}">${ticket.priority}</span></td>
        <td><span class="badge ${getStatusClass(ticket.status)}">${ticket.status}</span></td>
        <td>${areasMap[ticket.departamento] || "Desconocido"}</td>
        <td>${ticket.createdAt}</td>
        <td><button class="btn btn-sm btn-secondary">Detalles</button></td>
      </tr>`
      tbody.insertAdjacentHTML("beforeend", row)
    }
  })
}

function getPriorityClass(priority) {
  switch (priority) {
    case "Alta":
      return "badge-prioridad-alta"
    case "Media":
      return "badge-prioridad-media"
    case "Baja":
      return "badge-prioridad-baja"
    default:
      return "bg-secondary"
  }
}

function getStatusClass(status) {
  switch (status) {
    case "Abierto":
      return "badge-estado-abierto"
    case "En Progreso":
      return "badge-estado-progreso"
    case "Resuelto":
      return "badge-estado-resuelto"
    default:
      return "bg-secondary"
  }
}

searchInput.addEventListener("input", renderTickets)
statusFilter.addEventListener("change", renderTickets)

fetchAreas().then(renderTickets)
