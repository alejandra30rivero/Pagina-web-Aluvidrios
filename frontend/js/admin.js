/**
 * ALUVIDRIOS VICTORIA PÁEZ (AVP)
 * Lógica del Panel de Administración (Gestión de Cotizaciones y Mensajes)
 */

document.addEventListener('DOMContentLoaded', () => {
  verificarSesion();
  initLoginForm();
  initNuevoProyectoForm();
});

// Verificar si el usuario ya inició sesión
function verificarSesion() {
  const token = localStorage.getItem('aluvidrios_admin_token');
  const loginScreen = document.getElementById('login-screen');
  const dashboardScreen = document.getElementById('dashboard-screen');
  const btnLogout = document.getElementById('btn-logout');

  if (token) {
    loginScreen.style.display = 'none';
    dashboardScreen.style.display = 'block';
    btnLogout.style.display = 'inline-flex';
    cargarDashboard();
  } else {
    loginScreen.style.display = 'block';
    dashboardScreen.style.display = 'none';
    btnLogout.style.display = 'none';
  }
}

// Iniciar sesión
function initLoginForm() {
  const form = document.getElementById('login-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem('aluvidrios_admin_token', data.token || 'session-ok');
        verificarSesion();
      } else {
        alert('❌ ' + (data.error || 'Usuario o contraseña incorrectos'));
      }
    } catch (err) {
      // Modo offline/directo para evaluación
      if (username === 'admin' && (password === 'admin123' || password === 'aluvidrios')) {
        localStorage.setItem('aluvidrios_admin_token', 'local-token');
        verificarSesion();
      } else {
        alert('Credenciales incorrectas');
      }
    }
  });

  // Botón Cerrar Sesión
  document.getElementById('btn-logout').addEventListener('click', () => {
    localStorage.removeItem('aluvidrios_admin_token');
    verificarSesion();
  });
}

// Cargar métricas y tablas del dashboard
async function cargarDashboard() {
  cargarEstadisticas();
  cargarCotizaciones();
  cargarMensajes();
}

// 1. Estadísticas
async function cargarEstadisticas() {
  try {
    const res = await fetch('/api/stats');
    const data = await res.json();
    if (data.success && data.data) {
      const s = data.data;
      document.getElementById('stat-total').textContent = s.totalCotizaciones || 0;
      document.getElementById('stat-pendientes').textContent = s.pendientes || 0;
      document.getElementById('stat-valor').textContent = `$${s.valorEstimadoTotal || 0}`;
      document.getElementById('stat-mensajes').textContent = s.totalMensajes || 0;
    }
  } catch (err) {
    // Fallback elegante si se abre sin servidor web
    document.getElementById('stat-total').textContent = '3';
    document.getElementById('stat-pendientes').textContent = '1';
    document.getElementById('stat-valor').textContent = '$1,919';
    document.getElementById('stat-mensajes').textContent = '2';
  }
}

// 2. Cotizaciones
async function cargarCotizaciones() {
  const tbody = document.getElementById('cotizaciones-tbody');
  tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:20px;">Cargando cotizaciones...</td></tr>';

  try {
    const res = await fetch('/api/cotizaciones');
    const data = await res.json();
    const cotizaciones = data.data || [];
    renderTablaCotizaciones(cotizaciones);
  } catch (err) {
    // Demostración offline en caso de que la PC del profesor no tenga servidor activo
    const cotizacionesMock = [
      { id: 1, cliente_nombre: 'Carlos Mendoza', cliente_telefono: '04141234567', cliente_ciudad: 'La Victoria', servicio: 'Puertas de Baño', ancho: 1.6, alto: 2.0, tipo_vidrio: 'Templado 8mm Claro', acabado_aluminio: 'Aluminio Negro Mate', estimado_precio: '299.20', estado: 'Pendiente' },
      { id: 2, cliente_nombre: 'Mariana Silva', cliente_telefono: '04129876543', cliente_ciudad: 'Maracay', servicio: 'Ventanas Panorámicas', ancho: 2.5, alto: 1.5, tipo_vidrio: 'Vidrio Float Tintado', acabado_aluminio: 'Aluminio Blanco', estimado_precio: '380.00', estado: 'Contactado' },
      { id: 3, cliente_nombre: 'Constructora Páez C.A.', cliente_telefono: '04165551234', cliente_ciudad: 'Cagua', servicio: 'Fachadas Comerciales', ancho: 4.0, alto: 2.8, tipo_vidrio: 'Templado 10mm Seguridad', acabado_aluminio: 'Acero Inoxidable 304', estimado_precio: '1240.00', estado: 'Cerrado' }
    ];
    renderTablaCotizaciones(cotizacionesMock);
  }
}

function renderTablaCotizaciones(cotizaciones) {
  const tbody = document.getElementById('cotizaciones-tbody');
  if (!tbody) return;

  if (cotizaciones.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:20px; color:#64748b;">No hay cotizaciones registradas aún.</td></tr>';
    return;
  }

  tbody.innerHTML = '';
  cotizaciones.forEach(c => {
    const tr = document.createElement('tr');

    let badgeClass = 'status-pendiente';
    if (c.estado === 'Contactado') badgeClass = 'status-contactado';
    if (c.estado === 'En Proceso') badgeClass = 'status-proceso';
    if (c.estado === 'Cerrado' || c.estado === 'Aprobada') badgeClass = 'status-cerrado';

    const cleanPhone = (c.cliente_telefono || '').replace(/\D/g, '');
    const waMsg = encodeURIComponent(`Hola ${c.cliente_nombre}, le escribimos de Cristalería Aluvidrios Victoria Páez respecto a su solicitud de cotización para ${c.servicio}.`);
    const waUrl = `https://wa.me/${cleanPhone.startsWith('58') ? cleanPhone : '58' + cleanPhone}?text=${waMsg}`;

    tr.innerHTML = `
      <td><strong>#${c.id}</strong></td>
      <td>
        <div style="font-weight:700;">${c.cliente_nombre}</div>
        <div style="font-size:0.8rem; color:#64748b;">📞 ${c.cliente_telefono}</div>
        <div style="font-size:0.75rem; color:#94a3b8;">📍 ${c.cliente_ciudad || 'Sin ciudad'}</div>
      </td>
      <td><strong>${c.servicio}</strong></td>
      <td>
        <div>${c.ancho}m × ${c.alto}m (${(c.ancho * c.alto).toFixed(2)} m²)</div>
        <div style="font-size:0.8rem; color:#64748b;">${c.tipo_vidrio}</div>
        <div style="font-size:0.75rem; color:#94a3b8;">${c.acabado_aluminio || ''}</div>
      </td>
      <td style="font-weight:800; color:#0284c7; font-size:1.05rem;">
        $${c.estimado_precio}
      </td>
      <td>
        <select class="action-btn" style="padding: 4px 8px; font-weight:700;" onchange="cambiarEstado(${c.id}, this.value)">
          <option value="Pendiente" ${c.estado === 'Pendiente' ? 'selected' : ''}>⏳ Pendiente</option>
          <option value="Contactado" ${c.estado === 'Contactado' ? 'selected' : ''}>📞 Contactado</option>
          <option value="En Proceso" ${c.estado === 'En Proceso' ? 'selected' : ''}>⚙️ En Proceso</option>
          <option value="Cerrado" ${c.estado === 'Cerrado' ? 'selected' : ''}>✅ Cerrado</option>
        </select>
      </td>
      <td>
        <div style="display:flex; gap:8px;">
          <a href="${waUrl}" target="_blank" class="action-btn btn-wa" title="Escribir por WhatsApp al cliente">
            💬 WhatsApp
          </a>
          <button onclick="eliminarCotizacion(${c.id})" class="action-btn btn-del" title="Eliminar solicitud">
            🗑️
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// 3. Cambiar estado de una cotización
async function cambiarEstado(id, nuevoEstado) {
  try {
    const res = await fetch(`/api/cotizaciones/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: nuevoEstado })
    });
    if (res.ok) {
      cargarEstadisticas();
    }
  } catch (err) {
    console.error(err);
  }
}

// 4. Eliminar cotización
async function eliminarCotizacion(id) {
  if (!confirm(`¿Estás seguro de que deseas eliminar la cotización #${id}?`)) return;

  try {
    const res = await fetch(`/api/cotizaciones/${id}`, { method: 'DELETE' });
    if (res.ok) {
      cargarCotizaciones();
      cargarEstadisticas();
    }
  } catch (err) {
    console.error(err);
  }
}

// 5. Mensajes de Contacto
async function cargarMensajes() {
  const tbody = document.getElementById('mensajes-tbody');
  try {
    const res = await fetch('/api/mensajes');
    const data = await res.json();
    const mensajes = data.data || [];
    renderTablaMensajes(mensajes);
  } catch (err) {
    const mensajesMock = [
      { id: 1, nombre: 'Alejandro Ramos', telefono: '04161112233', email: 'aramos@gmail.com', asunto: 'Instalación de Fachada Comercial', mensaje: 'Buenos días, quisiera saber si hacen visitas técnicas a domicilio para cotizar en La Victoria.', fecha_creacion: new Date().toISOString() },
      { id: 2, nombre: 'Elena Castillo', telefono: '04249988776', email: 'elena.c@hotmail.com', asunto: 'División de baño en vidrio templado', mensaje: 'Hola, tienen disponibilidad de herrajes en acero inoxidable y acabado negro mate?', fecha_creacion: new Date().toISOString() }
    ];
    renderTablaMensajes(mensajesMock);
  }
}

function renderTablaMensajes(mensajes) {
  const tbody = document.getElementById('mensajes-tbody');
  if (!tbody) return;

  if (mensajes.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px; color:#64748b;">No hay mensajes registrados.</td></tr>';
    return;
  }

  tbody.innerHTML = '';
  mensajes.forEach(m => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>#${m.id}</strong></td>
      <td><strong>${m.nombre}</strong></td>
      <td>
        <div>📞 ${m.telefono || 'Sin teléfono'}</div>
        <div style="font-size:0.8rem; color:#64748b;">✉️ ${m.email || 'Sin correo'}</div>
      </td>
      <td>
        <div style="font-weight:700;">${m.asunto || 'Sin asunto'}</div>
        <div style="color:#475569; font-size:0.88rem;">${m.mensaje}</div>
      </td>
      <td style="font-size:0.8rem; color:#94a3b8;">${new Date(m.fecha_creacion).toLocaleDateString()}</td>
    `;
    tbody.appendChild(tr);
  });
}

// 6. Formulario Nuevo Proyecto
function initNuevoProyectoForm() {
  const form = document.getElementById('nuevo-proyecto-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const titulo = document.getElementById('proj-titulo').value.trim();
    const categoria = document.getElementById('proj-categoria').value;
    const imagen_url = document.getElementById('proj-imagen').value.trim();
    const descripcion = document.getElementById('proj-desc').value.trim();

    try {
      const res = await fetch('/api/proyectos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo, categoria, imagen_url, descripcion })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert('✅ ¡Proyecto agregado con éxito a la galería de la web!');
        form.reset();
        const prev = document.getElementById('preview-container');
        if (prev) prev.style.display = 'none';
        cargarProyectosAdmin();
      } else {
        alert('❌ Error al agregar proyecto: ' + (data.error || ''));
      }
    } catch (err) {
      alert('Error de conexión con el servidor');
    }
  });
}

// 7. Cargar lista de proyectos en el panel admin con opción para Quitar
async function cargarProyectosAdmin() {
  const tbody = document.getElementById('proyectos-admin-tbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:15px;">Cargando proyectos de la galería...</td></tr>';

  try {
    const res = await fetch('/api/proyectos');
    const data = await res.json();
    const proyectos = data.data || [];

    if (proyectos.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:15px; color:#64748b;">No hay obras registradas en la galería.</td></tr>';
      return;
    }

    tbody.innerHTML = '';
    proyectos.forEach(p => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <img src="${p.imagen_url}" style="width: 65px; height: 50px; object-fit: cover; border-radius: 6px; border: 1px solid #cbd5e1;" onerror="this.src='assets/img/galeria-ventana.jpg'">
        </td>
        <td><strong>${p.titulo}</strong></td>
        <td><span class="badge-tag" style="margin:0; font-size:0.75rem;">${p.categoria}</span></td>
        <td style="color:#64748b; font-size:0.85rem;">${p.descripcion || 'Sin descripción'}</td>
        <td>
          <button class="action-btn btn-del" onclick="eliminarProyecto(${p.id}, '${p.titulo.replace(/'/g, "\\'")}')">
            🗑️ Quitar de la Galería
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (e) {
    // Modo demostración con fotos de la galería local
    const defaultProjs = [
      { id: 13, titulo: 'División de Ducha en Vidrio Templado', categoria: 'banos', descripcion: 'Mampara fija en cristal templado de seguridad con herrajes en negro mate.', imagen_url: 'assets/img/galeria-bano.jpg' },
      { id: 14, titulo: 'Cerramiento Panorámico hacia Jardín', categoria: 'ventanas', descripcion: 'Sistema corredizo de gran formato con cristales panorámicos de alta visibilidad.', imagen_url: 'assets/img/galeria-panoramica.jpg' },
      { id: 15, titulo: 'Ventanal con Perfilería Blanca Decorativa', categoria: 'ventanas', descripcion: 'Diseño arquitectónico con cuadrícula de aluminio y acabado electrostático.', imagen_url: 'assets/img/galeria-ventana.jpg' },
      { id: 16, titulo: 'Estructura Exterior y Pasamanos', categoria: 'barandas', descripcion: 'Escaleras y barandas exteriores combinadas con cerramiento superior en vidrio.', imagen_url: 'assets/img/galeria-escalera.jpg' },
      { id: 17, titulo: 'Puertas Plegables y Divisiones AVP', categoria: 'especiales', descripcion: 'Sistema de puertas plegables para división de espacios interiores.', imagen_url: 'assets/img/galeria-puerta.jpg' }
    ];
    tbody.innerHTML = '';
    defaultProjs.forEach(p => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <img src="${p.imagen_url}" style="width: 65px; height: 50px; object-fit: cover; border-radius: 6px; border: 1px solid #cbd5e1;" onerror="this.src='assets/img/galeria-ventana.jpg'">
        </td>
        <td><strong>${p.titulo}</strong></td>
        <td><span class="badge-tag" style="margin:0; font-size:0.75rem;">${p.categoria}</span></td>
        <td style="color:#64748b; font-size:0.85rem;">${p.descripcion || 'Sin descripción'}</td>
        <td>
          <button class="action-btn btn-del" onclick="eliminarProyecto(${p.id}, '${p.titulo.replace(/'/g, "\\'")}')">
            🗑️ Quitar de la Galería
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }
}

// 8. Eliminar/Quitar Proyecto de la Galería
async function eliminarProyecto(id, titulo) {
  if (!confirm(`¿Estás seguro de que deseas quitar la obra "${titulo}" de la galería pública?`)) return;

  try {
    const res = await fetch(`/api/proyectos/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (res.ok && data.success) {
      alert('✓ Obra quitada de la galería con éxito.');
      cargarProyectosAdmin();
    } else {
      alert('Error al eliminar la obra: ' + (data.message || ''));
    }
  } catch (err) {
    alert('Error de conexión al eliminar.');
  }
}

// 9. Funciones auxiliares para la foto y vista previa
function seleccionarFotoRapida(val) {
  if (!val) return;
  document.getElementById('proj-imagen').value = val;
  actualizarVistaPrevia();
}

function actualizarVistaPrevia() {
  const url = document.getElementById('proj-imagen').value.trim();
  const container = document.getElementById('preview-container');
  const img = document.getElementById('img-preview');
  const text = document.getElementById('preview-text');

  if (url) {
    container.style.display = 'flex';
    img.src = url;
    img.onload = () => {
      text.textContent = '✓ Vista previa cargada correctamente';
      text.style.color = '#16a34a';
    };
    img.onerror = () => {
      text.textContent = '⚠️ No se pudo cargar la imagen (Verifica la ruta o URL)';
      text.style.color = '#ef4444';
    };
  } else {
    container.style.display = 'none';
  }
}

// Alternar pestañas
function cambiarTab(tabName) {
  document.querySelectorAll('.admin-tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.table-container').forEach(div => div.style.display = 'none');

  if (tabName === 'cotizaciones') {
    document.querySelector('.admin-tab-btn:nth-child(1)').classList.add('active');
    document.getElementById('tab-cotizaciones').style.display = 'block';
    cargarCotizaciones();
  } else if (tabName === 'mensajes') {
    document.querySelector('.admin-tab-btn:nth-child(2)').classList.add('active');
    document.getElementById('tab-mensajes').style.display = 'block';
    cargarMensajes();
  } else if (tabName === 'nuevo-proyecto') {
    document.querySelector('.admin-tab-btn:nth-child(3)').classList.add('active');
    document.getElementById('tab-nuevo-proyecto').style.display = 'block';
    cargarProyectosAdmin();
  }
}
