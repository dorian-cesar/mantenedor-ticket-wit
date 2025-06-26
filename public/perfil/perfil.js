document.addEventListener('DOMContentLoaded', function() {
  // Toast initialization
  const toastEl = document.getElementById('toast');
  const toast = new bootstrap.Toast(toastEl, { autohide: true, delay: 5000 });
  
  // Obtener usuario desde localStorage
  const userFromStorage = localStorage.getItem('usuario');

  let profile;
  if (userFromStorage) {
    const user = JSON.parse(userFromStorage);
    profile = {
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      telefono: "",
      cargo: user.rol === "admin" ? "Administrador del Sistema" : "Usuario",      
      ubicacion: "Chile",
      biografia: "",
      fechaRegistro: "",
      ultimoAcceso: "",
      timezone: "America/Santiago",
      idioma: "es",
      formatoFecha: "DD/MM/YYYY",
      tema: "light",
      notificacionesEmail: true,
      notificacionesPush: true,
      notificacionesSMS: false,
      frecuenciaNotificaciones: "immediate",
      notificarTicketsAsignados: true,
      notificarTicketsVencidos: true,
      notificarMenciones: true,
      twoFactorEnabled: false,
      ultimoCambioPassword: "",
      sesionesActivas: 1,
      ticketsCreados: 0,
      ticketsResueltos: 0,
      tiempoPromedioRespuesta: 0,
      puntuacionSatisfaccion: 0
    };
  } else {
    alert("No se encontró información del usuario. Por favor inicie sesión.");
    window.location.href = "/login.html";
  }


  let originalProfile = JSON.parse(JSON.stringify(profile));
  let hasChanges = false;  

  // DOM elements
  const changesAlert = document.getElementById('changes-alert');
  const saveBtn = document.getElementById('save-btn');
  const resetBtn = document.getElementById('reset-btn');
  const saveBottomBtn = document.getElementById('save-bottom-btn');
  const resetBottomBtn = document.getElementById('reset-bottom-btn');
  const saveText = document.getElementById('save-text');
  const saveBottomText = document.getElementById('save-bottom-text');
  const avatarUpload = document.getElementById('avatar-upload');
  const avatarImg = document.getElementById('avatar-img');
  const avatarFallback = document.getElementById('avatar-fallback');
  const toastTitle = document.getElementById('toast-title');
  const toastBody = document.getElementById('toast-body');
  const passwordChangeForm = document.getElementById('password-change-form');
  const twoFactorToggle = document.getElementById('two-factor-toggle');

  // Initialize form fields
  function initializeForm() {
    // Personal info
    document.getElementById('nombre').value = profile.nombre;
    document.getElementById('email').value = profile.email;
    document.getElementById('telefono').value = profile.telefono;
    document.getElementById('cargo').value = profile.cargo;    
    document.getElementById('ubicacion').value = profile.ubicacion;
    document.getElementById('biografia').value = profile.biografia;
    
    // Preferences
    document.getElementById('timezone').value = profile.timezone;
    document.getElementById('idioma').value = profile.idioma;
    document.getElementById('formatoFecha').value = profile.formatoFecha;
    document.getElementById('tema').value = profile.tema;
    
    // Notifications
    document.getElementById('notificacionesEmail').checked = profile.notificacionesEmail;
    document.getElementById('notificacionesPush').checked = profile.notificacionesPush;
    document.getElementById('notificacionesSMS').checked = profile.notificacionesSMS;
    document.getElementById('frecuenciaNotificaciones').value = profile.frecuenciaNotificaciones;
    document.getElementById('notificarTicketsAsignados').checked = profile.notificarTicketsAsignados;
    document.getElementById('notificarTicketsVencidos').checked = profile.notificarTicketsVencidos;
    document.getElementById('notificarMenciones').checked = profile.notificarMenciones;
    
    // Security
    twoFactorToggle.checked = profile.twoFactorEnabled;
    
    // Profile header
    document.getElementById('profile-name').textContent = profile.nombre;
    document.getElementById('profile-position').textContent = profile.cargo;
    document.getElementById('profile-email').textContent = profile.email;    
    document.getElementById('profile-location').textContent = profile.ubicacion;
    document.getElementById('tickets-resolved').textContent = profile.ticketsResueltos;
    document.getElementById('satisfaction-score').textContent = profile.puntuacionSatisfaccion;
    
    // Set avatar fallback initials
    avatarFallback.textContent = getInitials(profile.nombre);
  }

  // Get initials from name
  function getInitials(nombre) {
    return nombre.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
  

  // Show toast notification
  function showToast(title, message, isError = false) {
    toastTitle.textContent = title;
    toastBody.textContent = message;
    
    if (isError) {
      toastEl.querySelector('.toast-header').classList.add('bg-danger', 'text-white');
    } else {
      toastEl.querySelector('.toast-header').classList.remove('bg-danger', 'text-white');
    }
    
    toast.show();
  }

  // Check for changes
  function checkForChanges() {
    const currentValues = {
      nombre: document.getElementById('nombre').value,
      email: document.getElementById('email').value,
      telefono: document.getElementById('telefono').value,
      cargo: document.getElementById('cargo').value,      
      ubicacion: document.getElementById('ubicacion').value,
      biografia: document.getElementById('biografia').value,
      timezone: document.getElementById('timezone').value,
      idioma: document.getElementById('idioma').value,
      formatoFecha: document.getElementById('formatoFecha').value,
      tema: document.getElementById('tema').value,
      notificacionesEmail: document.getElementById('notificacionesEmail').checked,
      notificacionesPush: document.getElementById('notificacionesPush').checked,
      notificacionesSMS: document.getElementById('notificacionesSMS').checked,
      frecuenciaNotificaciones: document.getElementById('frecuenciaNotificaciones').value,
      notificarTicketsAsignados: document.getElementById('notificarTicketsAsignados').checked,
      notificarTicketsVencidos: document.getElementById('notificarTicketsVencidos').checked,
      notificarMenciones: document.getElementById('notificarMenciones').checked,
      twoFactorEnabled: twoFactorToggle.checked
    };

    hasChanges = JSON.stringify(currentValues) !== JSON.stringify(originalProfile);
    
    if (hasChanges) {
      changesAlert.classList.remove('d-none');
      saveBtn.disabled = false;
      resetBtn.disabled = false;
      saveBottomBtn.disabled = false;
      resetBottomBtn.disabled = false;
    } else {
      changesAlert.classList.add('d-none');
      saveBtn.disabled = true;
      resetBtn.disabled = true;
      saveBottomBtn.disabled = true;
      resetBottomBtn.disabled = true;
    }
  }

  // Save profile changes
  async function saveProfile() {
    loading = true;
    saveText.textContent = 'Guardando...';
    saveBottomText.textContent = 'Guardando...';
    saveBtn.disabled = true;
    resetBtn.disabled = true;
    saveBottomBtn.disabled = true;
    resetBottomBtn.disabled = true;
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update profile with new values
      profile = {
        ...profile,
        nombre: document.getElementById('nombre').value,
        email: document.getElementById('email').value,
        telefono: document.getElementById('telefono').value,
        cargo: document.getElementById('cargo').value,        
        ubicacion: document.getElementById('ubicacion').value,
        biografia: document.getElementById('biografia').value,
        timezone: document.getElementById('timezone').value,
        idioma: document.getElementById('idioma').value,
        formatoFecha: document.getElementById('formatoFecha').value,
        tema: document.getElementById('tema').value,
        notificacionesEmail: document.getElementById('notificacionesEmail').checked,
        notificacionesPush: document.getElementById('notificacionesPush').checked,
        notificacionesSMS: document.getElementById('notificacionesSMS').checked,
        frecuenciaNotificaciones: document.getElementById('frecuenciaNotificaciones').value,
        notificarTicketsAsignados: document.getElementById('notificarTicketsAsignados').checked,
        notificarTicketsVencidos: document.getElementById('notificarTicketsVencidos').checked,
        notificarMenciones: document.getElementById('notificarMenciones').checked,
        twoFactorEnabled: twoFactorToggle.checked
      };
      
      originalProfile = JSON.parse(JSON.stringify(profile));
      hasChanges = false;
      
      // Update UI
      document.getElementById('profile-name').textContent = profile.nombre;
      document.getElementById('profile-position').textContent = profile.cargo;
      changesAlert.classList.add('d-none');
      avatarFallback.textContent = getInitials(profile.nombre);
      
      showToast('Perfil actualizado', 'Los cambios han sido guardados exitosamente');
    } catch (error) {
      showToast('Error', 'No se pudo actualizar el perfil', true);
    } finally {
      loading = false;
      saveText.textContent = 'Guardar Cambios';
      saveBottomText.textContent = 'Guardar Cambios';
      checkForChanges();
    }
  }

  // Reset profile changes
  function resetProfile() {
    initializeForm();
    hasChanges = false;
    changesAlert.classList.add('d-none');
    showToast('Cambios descartados', 'Se han restaurado los valores originales');
  }

  // Handle avatar upload
  function handleAvatarChange(event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
        avatarImg.src = e.target.result;
        avatarImg.classList.remove('d-none');
        avatarFallback.classList.add('d-none');
      };
      reader.readAsDataURL(file);
    }
  }

  // Handle password change
  function handlePasswordChange(event) {
    event.preventDefault();
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    if (newPassword !== confirmPassword) {
      showToast('Error', 'Las contraseñas no coinciden', true);
      return;
    }
    
    // Simulate password change
    setTimeout(() => {
      showToast('Contraseña actualizada', 'Tu contraseña ha sido cambiada exitosamente');
      document.getElementById('password-change-form').reset();
    }, 1000);
  }

  // Initialize event listeners
  function initEventListeners() {
    // Form inputs
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      input.addEventListener('change', checkForChanges);
      input.addEventListener('input', checkForChanges);
    });
    
    // Buttons
    saveBtn.addEventListener('click', saveProfile);
    resetBtn.addEventListener('click', resetProfile);
    saveBottomBtn.addEventListener('click', saveProfile);
    resetBottomBtn.addEventListener('click', resetProfile);
    
    // Avatar upload
    avatarUpload.addEventListener('change', handleAvatarChange);
    
    // Password change form
    if (passwordChangeForm) {
      passwordChangeForm.addEventListener('submit', handlePasswordChange);
    }
    
    // Two factor toggle
    twoFactorToggle.addEventListener('change', function() {
      profile.twoFactorEnabled = this.checked;
      checkForChanges();
    });
  }

  // Initialize the page
  function init() {
    initializeForm();
    initEventListeners();
  }

  init();
});