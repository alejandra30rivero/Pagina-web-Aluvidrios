const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos del frontend
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

// Catálogo maestro de servicios de Aluvidrios
const SERVICIOS = [
  {
    id: 'banos',
    nombre: 'Puertas de Baño',
    descripcion: 'Sistemas corredizos y batientes en vidrio templado de 8mm y 10mm de máxima seguridad, con perfiles y herrajes de acero inoxidable resistentes al agua y humedad.',
    precioBaseM2: 85,
    icono: 'shower'
  },
  {
    id: 'ventanas',
    nombre: 'Ventanas Panorámicas',
    descripcion: 'Ventanas correderas y fijas con perfiles de aluminio de alta resistencia, sellado hermético contra ruido y lluvia, y cristales tintados o transparentes.',
    precioBaseM2: 70,
    icono: 'window'
  },
  {
    id: 'fachadas',
    nombre: 'Fachadas Comerciales',
    descripcion: 'Cerramientos modernos de cristal arquitectónico para locales comerciales, oficinas y edificios. Máxima visibilidad, elegancia y protección.',
    precioBaseM2: 110,
    icono: 'building'
  },
  {
    id: 'barandas',
    nombre: 'Pasamanos y Barandas',
    descripcion: 'Diseños contemporáneos para balcones y escaleras interiores/exteriores, combinando postes de acero inoxidable con vidrio laminado de seguridad.',
    precioBaseM2: 95,
    icono: 'stairs'
  },
  {
    id: 'especiales',
    nombre: 'Trabajos Especiales y Peceras',
    descripcion: 'Proyectos a la medida: peceras panorámicas de gran capacidad, espejos con biselado decorativo, divisiones de oficinas y techos de vidrio.',
    precioBaseM2: 120,
    icono: 'star'
  }
];

// ===================== RUTAS DE LA API =====================

// Estado de la API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'Aluvidrios Victoria Páez API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// 1. Obtener lista de servicios
app.get('/api/servicios', (req, res) => {
  res.json({ success: true, data: SERVICIOS });
});

// 2. Proyectos / Galería
app.get('/api/proyectos', (req, res) => {
  db.getProyectos((err, rows) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, data: rows });
  });
});

app.post('/api/proyectos', (req, res) => {
  const { titulo, categoria, descripcion, imagen_url } = req.body;
  if (!titulo || !categoria || !imagen_url) {
    return res.status(400).json({ success: false, error: 'Faltan campos obligatorios' });
  }

  db.createProyecto({ titulo, categoria, descripcion, imagen_url }, (err, proyecto) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.status(201).json({ success: true, data: proyecto, message: 'Proyecto agregado al portafolio' });
  });
});

// 3. Cotizaciones
app.get('/api/cotizaciones', (req, res) => {
  db.getCotizaciones((err, rows) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, count: rows.length, data: rows });
  });
});

app.post('/api/cotizaciones', (req, res) => {
  const { cliente_nombre, cliente_telefono, cliente_ciudad, servicio, ancho, alto, tipo_vidrio, acabado_aluminio, estimado_precio, notas } = req.body;

  if (!cliente_nombre || !cliente_telefono || !servicio) {
    return res.status(400).json({ success: false, error: 'Nombre, teléfono y servicio son obligatorios.' });
  }

  const cotizacionData = {
    cliente_nombre,
    cliente_telefono,
    cliente_ciudad: cliente_ciudad || 'No especificada',
    servicio,
    ancho: parseFloat(ancho) || 0,
    alto: parseFloat(alto) || 0,
    tipo_vidrio: tipo_vidrio || 'Estándar',
    acabado_aluminio: acabado_aluminio || 'Estándar',
    estimado_precio: parseFloat(estimado_precio) || 0,
    notas: notas || '',
    estado: 'Pendiente'
  };

  db.createCotizacion(cotizacionData, (err, nuevaCotizacion) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.status(201).json({
      success: true,
      data: nuevaCotizacion,
      message: '¡Solicitud de cotización registrada con éxito en el sistema!'
    });
  });
});

// Actualizar estado de una cotización (Pendiente, Contactado, En Proceso, Cerrado)
app.put('/api/cotizaciones/:id', (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;
  if (!estado) return res.status(400).json({ success: false, error: 'El estado es requerido' });

  db.updateCotizacionEstado(id, estado, (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, message: `Cotización #${id} actualizada a: ${estado}` });
  });
});

// Eliminar cotización
app.delete('/api/cotizaciones/:id', (req, res) => {
  const { id } = req.params;
  db.deleteCotizacion(id, (err) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, message: `Cotización #${id} eliminada` });
  });
});

// 4. Mensajes de Contacto
app.get('/api/mensajes', (req, res) => {
  db.getMensajes((err, rows) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, data: rows });
  });
});

app.post('/api/mensajes', (req, res) => {
  const { nombre, telefono, email, asunto, mensaje } = req.body;
  if (!nombre || !mensaje) {
    return res.status(400).json({ success: false, error: 'Nombre y mensaje son requeridos.' });
  }

  db.createMensaje({ nombre, telefono, email, asunto, mensaje }, (err, nuevoMensaje) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.status(201).json({ success: true, data: nuevoMensaje, message: 'Mensaje recibido con éxito' });
  });
});

// 5. Estadísticas para el Dashboard de Administración
app.get('/api/stats', (req, res) => {
  db.getStats((err, stats) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, data: stats });
  });
});

// 6. Login de Administrador
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  // Credenciales predeterminadas para evaluación
  if (username === 'admin' && (password === 'admin123' || password === 'aluvidrios')) {
    return res.json({
      success: true,
      token: 'jwt-aluvidrios-auth-token-session-ok',
      user: { username: 'admin', rol: 'Administrador General' }
    });
  }
  res.status(401).json({ success: false, error: 'Credenciales inválidas. Usuario o contraseña incorrectos.' });
});

// Redirección para cualquier ruta frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`✨ Cristalería Aluvidrios Victoria Páez - Servidor Activo`);
  console.log(`🌐 Sitio Web: http://localhost:${PORT}`);
  console.log(`🔐 Panel Admin: http://localhost:${PORT}/admin.html`);
  console.log(`📊 API REST:  http://localhost:${PORT}/api/health`);
  console.log(`=======================================================`);
});
