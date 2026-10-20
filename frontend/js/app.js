/**
 * ALUVIDRIOS VICTORIA PÁEZ (AVP)
 * Lógica Frontend: Cotizador en tiempo real, consumo de API y WhatsApp
 */

// Teléfono oficial del negocio (obtenido de las fotos)
const WHATSAPP_NUMERO = '584160118029';

// Precios base por metro cuadrado (m²)
const PRECIOS_BASE = {
  'banos': 85,       // Puertas de baño
  'ventanas': 70,    // Ventanas panorámicas
  'fachadas': 110,   // Fachadas comerciales
  'barandas': 95,    // Pasamanos y barandas
  'especiales': 120  // Peceras y especiales
};

// Factores multiplicadores de tipo de vidrio
const FACTORES_VIDRIO = {
  'Templado 8mm Claro': 1.0,
  'Templado 8mm Esmerilado/Arenado': 1.15,
  'Templado 10mm Seguridad': 1.30,
  'Laminado 6mm (3+3)': 1.10,
  'Vidrio Float Tintado (Bronce/Gris)': 1.05
};

// Factores de perfilería
const FACTORES_ALUMINIO = {
  'Aluminio Plata Natural': 1.0,
  'Aluminio Negro Mate': 1.10,
  'Aluminio Blanco Electrostático': 1.08,
  'Acero Inoxidable 304': 1.35
};

document.addEventListener('DOMContentLoaded', () => {
  initCotizador();
  cargarGaleria();
  initContactForm();
  initSmoothScroll();
});

// ================= COTIZADOR INTERACTIVO =================
function initCotizador() {
  const serviceSelect = document.getElementById('calc-service');
  const widthInput = document.getElementById('calc-width');
  const heightInput = document.getElementById('calc-height');
  const glassSelect = document.getElementById('calc-glass');
  const aluminumSelect = document.getElementById('calc-aluminum');
  const btnSaveQuote = document.getElementById('btn-save-quote');
  const btnWhatsappQuote = document.getElementById('btn-whatsapp-quote');

  if (!serviceSelect) return;

  // Escuchar cambios en los inputs para recalcular en tiempo real
  [serviceSelect, widthInput, heightInput, glassSelect, aluminumSelect].forEach(el => {
    el.addEventListener('input', calcularPresupuesto);
    el.addEventListener('change', calcularPresupuesto);
  });

  // Cálculo inicial
  calcularPresupuesto();

  // Guardar en la Base de Datos del Backend
  if (btnSaveQuote) {
    btnSaveQuote.addEventListener('click', async (e) => {
      e.preventDefault();
      await enviarCotizacionAlBackend();
    });
  }

  // Enviar directamente a WhatsApp con el mensaje preformateado
  if (btnWhatsappQuote) {
    btnWhatsappQuote.addEventListener('click', (e) => {
      e.preventDefault();
      enviarCotizacionPorWhatsApp();
    });
  }
}

function calcularPresupuesto() {
  const service = document.getElementById('calc-service').value;
  const width = parseFloat(document.getElementById('calc-width').value) || 0;
  const height = parseFloat(document.getElementById('calc-height').value) || 0;
  const glass = document.getElementById('calc-glass').value;
  const aluminum = document.getElementById('calc-aluminum').value;

  const area = (width * height);
  const basePriceM2 = PRECIOS_BASE[service] || 85;
  const glassFactor = FACTORES_VIDRIO[glass] || 1.0;
  const alumFactor = FACTORES_ALUMINIO[aluminum] || 1.0;

  // Cálculo del total estimado
  let total = area * basePriceM2 * glassFactor * alumFactor;
  if (total < 50 && area > 0) total = 50; // Tarifa mínima

  // Actualizar UI del resumen
  document.getElementById('summary-service').textContent = document.getElementById('calc-service').selectedOptions[0].text;
  document.getElementById('summary-area').textContent = `${area.toFixed(2)} m² (${width}m × ${height}m)`;
  document.getElementById('summary-glass').textContent = glass;
  document.getElementById('summary-price').textContent = `$${total.toFixed(2)}`;

  return {
    servicio: document.getElementById('calc-service').selectedOptions[0].text,
    ancho: width,
    alto: height,
    area: area.toFixed(2),
    tipo_vidrio: glass,
    acabado_aluminio: aluminum,
    total: total.toFixed(2)
  };
}

// Enviar solicitud de cotización al Backend (API REST)
async function enviarCotizacionAlBackend() {
  const nombre = document.getElementById('calc-client-name').value.trim();
  const telefono = document.getElementById('calc-client-phone').value.trim();
  const ciudad = document.getElementById('calc-client-city').value.trim();
  const notas = document.getElementById('calc-notes').value.trim();

  if (!nombre || !telefono) {
    mostrarToast('⚠️ Por favor ingresa tu Nombre y Teléfono para registrar la cotización.');
    document.getElementById('calc-client-name').focus();
    return;
  }

  const datosCalculo = calcularPresupuesto();

  const payload = {
    cliente_nombre: nombre,
    cliente_telefono: telefono,
    cliente_ciudad: ciudad,
    servicio: datosCalculo.servicio,
    ancho: datosCalculo.ancho,
    alto: datosCalculo.alto,
    tipo_vidrio: datosCalculo.tipo_vidrio,
    acabado_aluminio: datosCalculo.acabado_aluminio,
    estimado_precio: datosCalculo.total,
    notas: notas
  };

  try {
    const response = await fetch('/api/cotizaciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (response.ok && result.success) {
      mostrarToast('✅ ¡Cotización registrada con éxito en el sistema! Un asesor te contactará.');
      // Opcional: ofrecer enviar copia por WhatsApp
      setTimeout(() => {
        if (confirm('¿Deseas enviar también esta cotización directamente al WhatsApp de Aluvidrios Victoria Páez?')) {
          enviarCotizacionPorWhatsApp();
        }
      }, 700);
    } else {
      mostrarToast('❌ Error: ' + (result.error || 'No se pudo guardar la cotización.'));
    }
  } catch (error) {
    console.error('Error al conectar con la API:', error);
    mostrarToast('⚠️ Conectando en modo local. Abriendo WhatsApp directo...');
    enviarCotizacionPorWhatsApp();
  }
}

// Enviar presupuesto estructurado a WhatsApp
function enviarCotizacionPorWhatsApp() {
  const nombre = document.getElementById('calc-client-name').value.trim() || 'Cliente';
  const telefono = document.getElementById('calc-client-phone').value.trim() || 'No especificado';
  const ciudad = document.getElementById('calc-client-city').value.trim() || 'Venezuela';
  const notas = document.getElementById('calc-notes').value.trim();
  const calc = calcularPresupuesto();

  let mensaje = `*¡HOLA ALUVIDRIOS VICTORIA PÁEZ!* 👋\n`;
  mensaje += `Quisiera solicitar formalmente un presupuesto con los siguientes datos:\n\n`;
  mensaje += `👤 *Cliente:* ${nombre}\n`;
  mensaje += `📞 *Teléfono:* ${telefono}\n`;
  mensaje += `📍 *Ubicación:* ${ciudad}\n\n`;
  mensaje += `📋 *DETALLES DEL TRABAJO:*\n`;
  mensaje += `🔹 *Servicio:* ${calc.servicio}\n`;
  mensaje += `🔹 *Medidas:* ${calc.ancho}m de ancho × ${calc.alto}m de alto (${calc.area} m²)\n`;
  mensaje += `🔹 *Tipo de Vidrio:* ${calc.tipo_vidrio}\n`;
  mensaje += `🔹 *Perfilería / Herrajes:* ${calc.acabado_aluminio}\n`;
  if (notas) mensaje += `🔹 *Observaciones:* ${notas}\n`;
  mensaje += `\n💵 *Estimado en Web:* $${calc.total} USD\n\n`;
  mensaje += `¿Podrían indicarme disponibilidad y tiempo de entrega? Muchas gracias.`;

  const urlWhatsapp = `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensaje)}`;
  window.open(urlWhatsapp, '_blank');
}

// ================= FORMULARIO DE CONTACTO =================
function initContactForm() {
  const contactForm = document.getElementById('contact-form');
  if (!contactForm) return;

  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nombre = document.getElementById('contact-name').value.trim();
    const telefono = document.getElementById('contact-phone').value.trim();
    const email = document.getElementById('contact-email').value.trim();
    const asunto = document.getElementById('contact-subject').value.trim();
    const mensaje = document.getElementById('contact-message').value.trim();

    try {
      const response = await fetch('/api/mensajes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, telefono, email, asunto, mensaje })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        mostrarToast('✅ ¡Mensaje enviado con éxito! Te responderemos a la brevedad.');
        contactForm.reset();
      } else {
        mostrarToast('❌ Hubo un error al enviar el mensaje.');
      }
    } catch (err) {
      console.error(err);
      mostrarToast('✅ Mensaje recibido en modo demostración.');
      contactForm.reset();
    }
  });
}

// ================= GALERÍA Y FILTROS =================
async function cargarGaleria() {
  const galleryGrid = document.getElementById('gallery-grid');
  if (!galleryGrid) return;

  let proyectos = [];
  try {
    const res = await fetch('/api/proyectos');
    const data = await res.json();
    if (data.success && data.data) {
      proyectos = data.data;
    }
  } catch (e) {
    console.warn('Usando proyectos por defecto para galería');
  }

  // Si la API no devolvió proyectos, usamos los datos locales reales
  if (!proyectos || proyectos.length === 0) {
    proyectos = [
      { id: 1, titulo: 'Fachada Comercial en Vidrio Templado', categoria: 'fachadas', descripcion: 'Cerramiento integral moderno con estructura de aluminio y vidrios panorámicos.', imagen_url: 'assets/img/fachadas.jpeg' },
      { id: 2, titulo: 'Puerta de Baño en Vidrio Templado', categoria: 'banos', descripcion: 'Sistema corredizo con vidrio templado de 8mm y perfiles de acero inoxidable.', imagen_url: 'assets/img/puertas-bano.jpeg' },
      { id: 3, titulo: 'Ventanas Panorámicas de Aluminio', categoria: 'ventanas', descripcion: 'Ventanas corredizas herméticas con aislamiento acústico y protectores.', imagen_url: 'assets/img/ventanas.jpeg' },
      { id: 4, titulo: 'Pasamanos y Baranda de Cristal', categoria: 'barandas', descripcion: 'Baranda para escaleras combinando acero inoxidable y vidrio templado.', imagen_url: 'assets/img/barandas.jpeg' },
      { id: 5, titulo: 'Pecera Panorámica de Alta Resistencia', categoria: 'especiales', descripcion: 'Trabajo a medida con vidrio extra claro templado y sellado estructural.', imagen_url: 'assets/img/peceras.jpeg' },
      { id: 6, titulo: 'Fachada Arquitectónica Comercial', categoria: 'fachadas', descripcion: 'Cerramiento panorámico moderno en dos niveles con acabados de primera.', imagen_url: 'assets/img/hero.jpeg' }
    ];
  }

  renderProyectos(proyectos);
  initFiltrosGaleria(proyectos);
}

function renderProyectos(items) {
  const galleryGrid = document.getElementById('gallery-grid');
  galleryGrid.innerHTML = '';

  items.forEach(item => {
    const el = document.createElement('div');
    el.className = `gallery-item glass-panel`;
    el.setAttribute('data-category', item.categoria);
    el.innerHTML = `
      <img src="${item.imagen_url}" alt="${item.titulo}" loading="lazy">
      <div class="gallery-overlay">
        <h4>${item.titulo}</h4>
        <p>${item.descripcion || ''}</p>
      </div>
    `;
    el.addEventListener('click', () => abrirLightbox(item));
    galleryGrid.appendChild(el);
  });
}

function initFiltrosGaleria(proyectos) {
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.getAttribute('data-filter');

      if (cat === 'all') {
        renderProyectos(proyectos);
      } else {
        const filtered = proyectos.filter(p => p.categoria === cat);
        renderProyectos(filtered);
      }
    });
  });
}

function abrirLightbox(item) {
  // Modal simple para ver el proyecto ampliado
  const modal = document.createElement('div');
  modal.style.position = 'fixed';
  modal.style.inset = '0';
  modal.style.background = 'rgba(15, 23, 42, 0.9)';
  modal.style.backdropFilter = 'blur(10px)';
  modal.style.zIndex = '3000';
  modal.style.display = 'flex';
  modal.style.alignItems = 'center';
  modal.style.justifyContent = 'center';
  modal.style.padding = '20px';
  modal.innerHTML = `
    <div style="max-width: 700px; width: 100%; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 25px 50px rgba(0,0,0,0.5); animation: zoomIn 0.3s ease;">
      <img src="${item.imagen_url}" style="width: 100%; height: 380px; object-fit: cover;">
      <div style="padding: 24px;">
        <h3 style="font-size: 1.4rem; color: #0f172a; margin-bottom: 8px;">${item.titulo}</h3>
        <p style="color: #64748b; font-size: 0.95rem; margin-bottom: 20px;">${item.descripcion || ''}</p>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <a href="#cotizador" onclick="this.closest('div[style*=\\'position: fixed\\']').remove()" class="btn btn-primary btn-sm">Cotizar este Trabajo</a>
          <button style="background: #e2e8f0; border: none; padding: 8px 18px; border-radius: 50px; font-weight: 700; cursor: pointer;" onclick="this.closest('div[style*=\\'position: fixed\\']').remove()">Cerrar</button>
        </div>
      </div>
    </div>
  `;
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
  document.body.appendChild(modal);
}

// ================= NAVEGACIÓN SUAVE =================
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        targetElement.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

// Notificación Flotante (Toast)
function mostrarToast(mensaje) {
  let toast = document.querySelector('.toast-notification');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast-notification';
    document.body.appendChild(toast);
  }
  toast.textContent = mensaje;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 4000);
}
