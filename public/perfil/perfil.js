document.addEventListener('DOMContentLoaded', async function() {
  // Validación simple del token
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = "/login.html";
    return;
  }

  try {
    // Fetch silencioso para validar token
    const res = await fetch("https://tickets.dev-wit.com/api/users", {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    // Si es 401, redirigir
    if (res.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      window.location.href = "../index.html";
      return;
    }

    // Verificar si existen datos de usuario en el almacenamiento local
    const userFromStorage = localStorage.getItem('usuario');
    if (!userFromStorage) {
      window.location.href = "../index.html";
      return;
    };

  let profile;
  
  if (userFromStorage) {
    const user = JSON.parse(userFromStorage);
    profile = {
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      telefono: "",
      cargo: user.rol === "admin"
        ? "Administrador del Sistema"
        : user.rol === "jefatura"
        ? "Supervisor"
        : "Usuario",      
      ubicacion: "Chile",      
      fechaRegistro: "",
      ultimoAcceso: "",      
      tema: "light",
      notificacionesEmail: true,
      notificacionesPush: true,
      notificacionesSMS: false,
      frecuenciaNotificaciones: "immediate",
      notificarTicketsAsignados: true,
      notificarTicketsVencidos: true,
      notificarMenciones: true,      
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
  const passwordChangeForm = document.getElementById('password-change-form');  

  // Initialize form fields
  function initializeForm() {
    // Personal info
    document.getElementById('nombre').value = profile.nombre;
    document.getElementById('email').value = profile.email;
    document.getElementById('telefono').value = profile.telefono;
    document.getElementById('cargo').value = profile.cargo;    
    document.getElementById('ubicacion').value = profile.ubicacion;    
    
    // Preferences    
    document.getElementById('tema').value = profile.tema;
    
    // Notifications
    // document.getElementById('notificacionesEmail').checked = profile.notificacionesEmail;
    // document.getElementById('notificacionesPush').checked = profile.notificacionesPush;
    // document.getElementById('notificacionesSMS').checked = profile.notificacionesSMS;
    // document.getElementById('frecuenciaNotificaciones').value = profile.frecuenciaNotificaciones;
    // document.getElementById('notificarTicketsAsignados').checked = profile.notificarTicketsAsignados;
    // document.getElementById('notificarTicketsVencidos').checked = profile.notificarTicketsVencidos;
    // document.getElementById('notificarMenciones').checked = profile.notificarMenciones;    
    
    
    // Profile header
    document.getElementById('profile-name').textContent = profile.nombre;
    document.getElementById('profile-position').textContent = profile.cargo;
    document.getElementById('profile-email').textContent = profile.email;    
    document.getElementById('profile-location').textContent = profile.ubicacion;
    
    
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

  // Check para los cambios en el perfil
  function checkForChanges() {
    const currentValues = {
      nombre: document.getElementById('nombre').value,
      email: document.getElementById('email').value,
      telefono: document.getElementById('telefono').value,
      cargo: document.getElementById('cargo').value,      
      ubicacion: document.getElementById('ubicacion').value,  
      tema: document.getElementById('tema').value,
      notificacionesEmail: document.getElementById('notificacionesEmail').checked,
      notificacionesPush: document.getElementById('notificacionesPush').checked,
      notificacionesSMS: document.getElementById('notificacionesSMS').checked,
      frecuenciaNotificaciones: document.getElementById('frecuenciaNotificaciones').value,
      notificarTicketsAsignados: document.getElementById('notificarTicketsAsignados').checked,
      notificarTicketsVencidos: document.getElementById('notificarTicketsVencidos').checked,
      notificarMenciones: document.getElementById('notificarMenciones').checked,      
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
        tema: document.getElementById('tema').value,
        notificacionesEmail: document.getElementById('notificacionesEmail').checked,
        notificacionesPush: document.getElementById('notificacionesPush').checked,
        notificacionesSMS: document.getElementById('notificacionesSMS').checked,
        frecuenciaNotificaciones: document.getElementById('frecuenciaNotificaciones').value,
        notificarTicketsAsignados: document.getElementById('notificarTicketsAsignados').checked,
        notificarTicketsVencidos: document.getElementById('notificarTicketsVencidos').checked,
        notificarMenciones: document.getElementById('notificarMenciones').checked,        
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

  async function handlePasswordChange(event) {
    event.preventDefault();

    const currentPassword = document.getElementById('current-password').value.trim();
    const newPassword = document.getElementById('new-password').value.trim();
    const confirmPassword = document.getElementById('confirm-password').value.trim();

    if (newPassword.length < 8) {
      showToast('Error', 'La nueva contraseña debe tener al menos 8 caracteres.', true);
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('Error', 'Las contraseñas no coinciden.', true);
      return;
    }

    const usuario = JSON.parse(localStorage.getItem("usuario"));
    const token = localStorage.getItem("token");

    if (!usuario || !token) {
      showToast('Error', 'Sesión inválida. Vuelve a iniciar sesión.', true);
      return;
    }

    const payload = {
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
      password: newPassword
    };

    try {
      const res = await fetch(`https://tickets.dev-wit.com/api/users/${usuario.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const data = await res.json();
        const mensaje = data.message || "Error al cambiar la contraseña.";
        showToast('Error', mensaje, true);
        return;
      }

      showToast('Contraseña actualizada', 'Tu contraseña ha sido actualizada exitosamente.');
      document.getElementById('password-change-form').reset();
    } catch (error) {
      console.error("Error en el cambio de contraseña:", error);
      showToast('Error', 'No se pudo conectar con el servidor.', true);
    }
  }

  // Initialize event listeners
  function initEventListeners() {
    // Form inputs
    const inputs = document.querySelectorAll('input, select, textarea');

    // Excluir inputs del formulario de cambio de contraseña
    const ignoredIds = ['current-password', 'new-password', 'confirm-password'];

    inputs.forEach(input => {
      if (!ignoredIds.includes(input.id)) {
        input.addEventListener('change', checkForChanges);
        input.addEventListener('input', checkForChanges);
      }
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
    
  }

  // Initialize the page
  function init() {
    initializeForm();
    initEventListeners();
  }

  init();

  } catch (error) {
    console.error("Error validando sesión:", error);
    window.location.href = "../index.html";
  }
});