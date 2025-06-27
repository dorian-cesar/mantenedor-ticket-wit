/**
 * Sistema de Notificaciones Toast Dinámicas
 * =========================================
 * 
 * Este módulo proporciona un sistema de notificaciones toast personalizable que:
 * - Se posiciona en la parte superior derecha de la pantalla
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
 * - Posicionamiento fijo en pantalla: aparecen en el lado superior derecho
 * - Apilamiento: los nuevos toasts se agregan debajo del anterior
 * - Autocierre: se ocultan automáticamente después de 5 segundos
 * - Diseño responsivo: se adapta a diferentes tamaños de pantalla
 * - Sin dependencias externas: solo requiere Bootstrap 5
 * 
 * Personalización:
 * ----------------
 * - Para cambiar el tiempo de visualización: modificar el 'delay' en showToast()
 * - Para cambiar los colores: modificar las clases bg-danger/bg-success en showToast()
 * - Para cambiar la posición de los toasts: ajustar el estilo del contenedor en initToastContainer()
 */

let toastContainer; // Contenedor de toasts

/**
 * Inicializa el contenedor de toasts si no existe
 * Crea el contenedor HTML donde se apilarán los toasts
 */
function initToastContainer() {
  if (!document.getElementById('toast-container')) {
    const containerHTML = `
      <div id="toast-container" style="
        position: fixed;
        top: 80px;
        right: 20px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 10px;
        max-width: 550px;
      "></div>
    `;
    document.body.insertAdjacentHTML('beforeend', containerHTML);
  }
  toastContainer = document.getElementById('toast-container');
}

/**
 * Muestra un toast de notificación
 * @param {string} title - Título del toast
 * @param {string} message - Mensaje a mostrar
 * @param {boolean} [isError=false] - Si es true, muestra un toast de error (rojo), sino de éxito (verde)
 */
function showToast(title, message, isError = false) {
  // Asegurarse que el contenedor esté inicializado
  if (!toastContainer) initToastContainer();

  // Crear un ID único para el toast
  const id = `toast-${Date.now()}`;

  // HTML del toast individual
  const toastHTML = `
    <div id="${id}" class="toast show" role="alert" aria-live="assertive" aria-atomic="true" data-bs-delay="5000">
      <div class="toast-header ${isError ? 'bg-danger text-white' : 'bg-success text-white'}">
        <strong class="me-auto">${title}</strong>
        <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
      <div class="toast-body">${message}</div>
    </div>
  `;

  // Insertar el nuevo toast al final del contenedor (apilamiento vertical)
  toastContainer.insertAdjacentHTML('beforeend', toastHTML);

  const toastEl = document.getElementById(id);
  const toast = new bootstrap.Toast(toastEl, { autohide: true, delay: 5000 });
  toast.show();

  // Eliminar del DOM cuando desaparezca
  toastEl.addEventListener('hidden.bs.toast', () => {
    toastEl.remove();
  });
}
