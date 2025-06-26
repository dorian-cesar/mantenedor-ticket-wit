let toastEl, toast, toastTitle, toastBody;

// Posición del mouse
let mouseX = 0;
let mouseY = 0;

document.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});

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

  toastEl = document.getElementById('toast');
  toast = new bootstrap.Toast(toastEl, { autohide: true, delay: 5000 });
  toastTitle = document.getElementById('toast-title');
  toastBody = document.getElementById('toast-body');
}

function showToast(title, message, isError = false) {
  if (!toastEl || !toastTitle || !toastBody) initToastElements();

  toastTitle.textContent = title;
  toastBody.textContent = message;

  // Posición dinámica cerca del cursor pero no encima
  toastEl.style.position = 'fixed';
  toastEl.style.left = `${mouseX + 20}px`;
  toastEl.style.top = `${mouseY + 20}px`;
  toastEl.style.zIndex = '9999';

  const header = toastEl.querySelector('.toast-header');
  header.classList.remove('bg-danger', 'bg-success', 'text-white');

  if (isError) {
    header.classList.add('bg-danger', 'text-white');
  } else {
    header.classList.add('bg-success', 'text-white');
  }

  toast.show();
}