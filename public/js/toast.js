/**
 * Sistema de Notificaciones Toast Dinámicas
 * =========================================
 * 
 * Este módulo proporciona un sistema de notificaciones toast personalizable que:
 * - Se posiciona dinámicamente cerca del cursor del mouse
 * - Soporta mensajes de éxito y error
 * - Se crea automáticamente si no existe en el DOM
 * - Es fácil de usar desde cualquier parte de la aplicación
 * 
 * Uso básico:
 * -----------
 * showToast("Título", "Mensaje");                  // Toast de éxito (verde)
 * showToast("Título", "Mensaje", false);           // Toast de éxito (verde)
 * showToast("Título", "Mensaje", true);            // Toast de error (rojo)
 * 
 * Características:
 * ----------------
 * - Posición dinámica: aparece cerca de donde está el cursor
 * - Autocierre: se oculta automáticamente después de 5 segundos
 * - Diseño responsivo: se adapta a diferentes tamaños de pantalla
 * - Sin dependencias externas: solo requiere Bootstrap 5
 * 
 * Personalización:
 * ----------------
 * - Para cambiar el tiempo de visualización: modificar el 'delay' en initToastElements()
 * - Para cambiar los colores: modificar las clases bg-danger/bg-success en showToast()
 * - Para cambiar la posición relativa al cursor: modificar los valores +20 en showToast()
 */

let toastEl, toast, toastTitle, toastBody;

// Posición del mouse - seguimiento para posicionamiento dinámico
let mouseX = 0;
let mouseY = 0;

// Registrar movimiento del mouse para posicionar los toasts
document.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});

/**
 * Inicializa los elementos del toast si no existen
 * Crea la estructura HTML del toast y configura la instancia de Bootstrap
 */
function initToastElements() {
  // Crear el toast dinámicamente si no existe
  if (!document.getElementById('toast')) {
    const toastHTML = `
    <div id="toast" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="toast-header">
        <strong id="toast-title" class="me-auto"></strong>
        <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
      <div id="toast-body" class="toast-body"></div>
    </div>
    `;
    document.body.insertAdjacentHTML('beforeend', toastHTML);
  }

  // Configurar elementos y instancia de toast
  toastEl = document.getElementById('toast');
  toast = new bootstrap.Toast(toastEl, { autohide: true, delay: 5000 });
  toastTitle = document.getElementById('toast-title');
  toastBody = document.getElementById('toast-body');
}

/**
 * Muestra un toast de notificación
 * @param {string} title - Título del toast
 * @param {string} message - Mensaje a mostrar
 * @param {boolean} [isError=false] - Si es true, muestra un toast de error (rojo), sino de éxito (verde)
 */

function showToast(title, message, isError = false) {
  // Asegurarse que los elementos del toast estén inicializados
  if (!toastEl || !toastTitle || !toastBody) initToastElements();

  // Establecer contenido
  toastTitle.textContent = title;
  toastBody.textContent = message;

  // Posicionamiento dinámico cerca del cursor (20px de desplazamiento)
  toastEl.style.position = 'fixed';
  toastEl.style.left = `${mouseX + 20}px`;
  toastEl.style.top = `${mouseY + 20}px`;
  toastEl.style.zIndex = '9999';

  // Configurar estilo según tipo (éxito/error)
  const header = toastEl.querySelector('.toast-header');
  header.classList.remove('bg-danger', 'bg-success', 'text-white');

  if (isError) {
    header.classList.add('bg-danger', 'text-white');  // Estilo para errores
  } else {
    header.classList.add('bg-success', 'text-white'); // Estilo para éxitos
  }

  // Mostrar el toast
  toast.show();
}