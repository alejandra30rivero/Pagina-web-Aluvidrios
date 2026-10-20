const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'database.sqlite');
let db = null;
let useSqlite = false;

// Intentamos cargar sqlite3 si está instalado
try {
  const sqlite3 = require('sqlite3').verbose();
  db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
      console.error('Error al conectar a SQLite, usando modo persistente JSON:', err.message);
      initFallbackDb();
    } else {
      console.log('✅ Base de datos SQLite conectada exitosamente:', DB_PATH);
      useSqlite = true;
      initSqliteTables();
    }
  });
} catch (e) {
  console.log('sqlite3 no disponible directamente, iniciando en modo JSON persistente de alta fidelidad.');
  initFallbackDb();
}

// Inicialización de tablas en SQLite
function initSqliteTables() {
  db.serialize(() => {
    // 1. Tabla de Cotizaciones
    db.run(`
      CREATE TABLE IF NOT EXISTS cotizaciones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cliente_nombre TEXT NOT NULL,
        cliente_telefono TEXT NOT NULL,
        cliente_ciudad TEXT,
        servicio TEXT NOT NULL,
        ancho REAL,
        alto REAL,
        tipo_vidrio TEXT,
        acabado_aluminio TEXT,
        estimado_precio REAL,
        notas TEXT,
        estado TEXT DEFAULT 'Pendiente',
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Tabla de Mensajes de Contacto
    db.run(`
      CREATE TABLE IF NOT EXISTS mensajes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        telefono TEXT,
        email TEXT,
        asunto TEXT,
        mensaje TEXT NOT NULL,
        leido INTEGER DEFAULT 0,
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 3. Tabla de Galería / Proyectos
    db.run(`
      CREATE TABLE IF NOT EXISTS proyectos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        titulo TEXT NOT NULL,
        categoria TEXT NOT NULL,
        descripcion TEXT,
        imagen_url TEXT NOT NULL,
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insertar proyectos iniciales si la tabla está vacía
    db.get('SELECT COUNT(*) as count FROM proyectos', (err, row) => {
      if (!err && row && row.count === 0) {
        const stmt = db.prepare('INSERT INTO proyectos (titulo, categoria, descripcion, imagen_url) VALUES (?, ?, ?, ?)');
        const defaultProjects = [
          ['Fachada Comercial en Vidrio Templado', 'fachadas', 'Cerramiento integral moderno con estructura de aluminio y vidrios panorámicos de alta seguridad.', 'assets/img/fachadas.jpeg'],
          ['Puerta de Baño en Vidrio Templado', 'banos', 'Sistema corredizo con vidrio templado de 8mm, perfilería de acero y herrajes anticorrosivos.', 'assets/img/puertas-bano.jpeg'],
          ['Ventanas Panorámicas de Aluminio', 'ventanas', 'Ventanas corredizas herméticas con protectores y perfiles de alta resistencia.', 'assets/img/ventanas.jpeg'],
          ['Pasamanos y Baranda de Cristal', 'barandas', 'Baranda de seguridad para escaleras residenciales combinando postes de acero y paneles de vidrio templado.', 'assets/img/barandas.jpeg'],
          ['Pecera Panorámica de Alta Resistencia', 'especiales', 'Trabajo especial sobre medida con vidrio templado extra claro y sellado estructural de silicona.', 'assets/img/peceras.jpeg'],
          ['Fachada Arquitectónica Comercial', 'fachadas', 'Cerramiento panorámico moderno en dos niveles con acabados de primera.', 'assets/img/hero.jpeg']
        ];
        defaultProjects.forEach(p => stmt.run(p));
        stmt.finalize();
        console.log('✅ Proyectos iniciales precargados en SQLite.');
      }
    });

    // Insertar cotizaciones de ejemplo si está vacía
    db.get('SELECT COUNT(*) as count FROM cotizaciones', (err, row) => {
      if (!err && row && row.count === 0) {
        const stmt = db.prepare(`
          INSERT INTO cotizaciones (cliente_nombre, cliente_telefono, cliente_ciudad, servicio, ancho, alto, tipo_vidrio, acabado_aluminio, estimado_precio, notas, estado)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run('Carlos Mendoza', '+58 412-5551234', 'Valencia', 'Puertas de Baño', 1.6, 1.9, 'Templado 8mm Claro', 'Aluminio Negro Mate', 280, 'Ducha principal, instalación requerida', 'Pendiente');
        stmt.run('María Rodríguez', '+58 414-7894561', 'Maracay', 'Ventanas Panorámicas', 2.2, 1.5, 'Laminado 6mm', 'Aluminio Plata Natural', 340, 'Apartamento piso 5', 'Contactado');
        stmt.run('Inversiones Horizonte, C.A.', '+58 424-3216549', 'Caracas', 'Fachadas Comerciales', 5.0, 3.2, 'Templado 10mm Seguridad', 'Estructura Acero / Aluminio', 1450, 'Local comercial en centro empresarial', 'En Proceso');
        stmt.finalize();
      }
    });
  });
}

// Modo Fallback con archivo JSON (por si SQLite nativo no está compilado)
const JSON_DB_FILE = path.join(__dirname, 'database_fallback.json');
let fallbackStore = {
  cotizaciones: [],
  mensajes: [],
  proyectos: []
};

function initFallbackDb() {
  if (fs.existsSync(JSON_DB_FILE)) {
    try {
      fallbackStore = JSON.parse(fs.readFileSync(JSON_DB_FILE, 'utf-8'));
    } catch (e) {
      console.error('Error al leer archivo JSON fallback:', e.message);
    }
  } else {
    // Proyectos iniciales reales
    fallbackStore.proyectos = [
      { id: 1, titulo: 'Fachada Comercial en Vidrio Templado', categoria: 'fachadas', descripcion: 'Cerramiento integral moderno con estructura de aluminio y vidrios panorámicos.', imagen_url: 'assets/img/fachadas.jpeg', fecha_creacion: new Date().toISOString() },
      { id: 2, titulo: 'Puerta de Baño en Vidrio Templado', categoria: 'banos', descripcion: 'Sistema corredizo con vidrio templado de 8mm y perfiles de acero inoxidable.', imagen_url: 'assets/img/puertas-bano.jpeg', fecha_creacion: new Date().toISOString() },
      { id: 3, titulo: 'Ventanas Panorámicas de Aluminio', categoria: 'ventanas', descripcion: 'Ventanas corredizas herméticas con protectores y perfiles de alta resistencia.', imagen_url: 'assets/img/ventanas.jpeg', fecha_creacion: new Date().toISOString() },
      { id: 4, titulo: 'Pasamanos y Baranda de Cristal', categoria: 'barandas', descripcion: 'Baranda para escaleras combinando postes de acero y vidrio templado.', imagen_url: 'assets/img/barandas.jpeg', fecha_creacion: new Date().toISOString() },
      { id: 5, titulo: 'Pecera Panorámica de Alta Resistencia', categoria: 'especiales', descripcion: 'Trabajo a medida con vidrio extra claro templado y sellado estructural.', imagen_url: 'assets/img/peceras.jpeg', fecha_creacion: new Date().toISOString() },
      { id: 6, titulo: 'Fachada Arquitectónica Comercial', categoria: 'fachadas', descripcion: 'Cerramiento panorámico moderno en dos niveles con acabados de primera.', imagen_url: 'assets/img/hero.jpeg', fecha_creacion: new Date().toISOString() }
    ];
    // Cotizaciones de ejemplo
    fallbackStore.cotizaciones = [
      { id: 1, cliente_nombre: 'Carlos Mendoza', cliente_telefono: '+58 412-5551234', cliente_ciudad: 'Valencia', servicio: 'Puertas de Baño', ancho: 1.6, alto: 1.9, tipo_vidrio: 'Templado 8mm Claro', acabado_aluminio: 'Aluminio Negro Mate', estimado_precio: 280, notas: 'Ducha principal, instalación requerida', estado: 'Pendiente', fecha_creacion: new Date().toISOString() },
      { id: 2, cliente_nombre: 'María Rodríguez', cliente_telefono: '+58 414-7894561', cliente_ciudad: 'Maracay', servicio: 'Ventanas Panorámicas', ancho: 2.2, alto: 1.5, tipo_vidrio: 'Laminado 6mm', acabado_aluminio: 'Aluminio Plata Natural', estimado_precio: 340, notas: 'Apartamento piso 5', estado: 'Contactado', fecha_creacion: new Date().toISOString() },
      { id: 3, cliente_nombre: 'Inversiones Horizonte, C.A.', cliente_telefono: '+58 424-3216549', cliente_ciudad: 'Caracas', servicio: 'Fachadas Comerciales', ancho: 5.0, alto: 3.2, tipo_vidrio: 'Templado 10mm Seguridad', acabado_aluminio: 'Estructura Acero / Aluminio', estimado_precio: 1450, notas: 'Local comercial en centro empresarial', estado: 'En Proceso', fecha_creacion: new Date().toISOString() }
    ];
    saveFallback();
  }
}

function saveFallback() {
  fs.writeFileSync(JSON_DB_FILE, JSON.stringify(fallbackStore, null, 2), 'utf-8');
}

// Operaciones Unificadas (Compatibles con SQLite y Fallback)
const DatabaseAPI = {
  // --- COTIZACIONES ---
  getCotizaciones: (callback) => {
    if (useSqlite) {
      db.all('SELECT * FROM cotizaciones ORDER BY id DESC', [], callback);
    } else {
      callback(null, [...fallbackStore.cotizaciones].reverse());
    }
  },

  createCotizacion: (data, callback) => {
    if (useSqlite) {
      const sql = `
        INSERT INTO cotizaciones (cliente_nombre, cliente_telefono, cliente_ciudad, servicio, ancho, alto, tipo_vidrio, acabado_aluminio, estimado_precio, notas, estado)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const params = [
        data.cliente_nombre,
        data.cliente_telefono,
        data.cliente_ciudad || '',
        data.servicio,
        data.ancho || 0,
        data.alto || 0,
        data.tipo_vidrio || '',
        data.acabado_aluminio || '',
        data.estimado_precio || 0,
        data.notas || '',
        data.estado || 'Pendiente'
      ];
      db.run(sql, params, function(err) {
        if (err) return callback(err);
        callback(null, { id: this.lastID, ...data });
      });
    } else {
      const newId = fallbackStore.cotizaciones.length > 0 ? Math.max(...fallbackStore.cotizaciones.map(c => c.id)) + 1 : 1;
      const newItem = {
        id: newId,
        ...data,
        estado: data.estado || 'Pendiente',
        fecha_creacion: new Date().toISOString()
      };
      fallbackStore.cotizaciones.push(newItem);
      saveFallback();
      callback(null, newItem);
    }
  },

  updateCotizacionEstado: (id, estado, callback) => {
    if (useSqlite) {
      db.run('UPDATE cotizaciones SET estado = ? WHERE id = ?', [estado, id], function(err) {
        callback(err, { changed: this.changes });
      });
    } else {
      const item = fallbackStore.cotizaciones.find(c => c.id === parseInt(id));
      if (item) {
        item.estado = estado;
        saveFallback();
        callback(null, { changed: 1 });
      } else {
        callback(new Error('Cotización no encontrada'));
      }
    }
  },

  deleteCotizacion: (id, callback) => {
    if (useSqlite) {
      db.run('DELETE FROM cotizaciones WHERE id = ?', [id], function(err) {
        callback(err, { deleted: this.changes });
      });
    } else {
      const initialLength = fallbackStore.cotizaciones.length;
      fallbackStore.cotizaciones = fallbackStore.cotizaciones.filter(c => c.id !== parseInt(id));
      saveFallback();
      callback(null, { deleted: initialLength - fallbackStore.cotizaciones.length });
    }
  },

  // --- MENSAJES DE CONTACTO ---
  getMensajes: (callback) => {
    if (useSqlite) {
      db.all('SELECT * FROM mensajes ORDER BY id DESC', [], callback);
    } else {
      callback(null, [...fallbackStore.mensajes].reverse());
    }
  },

  createMensaje: (data, callback) => {
    if (useSqlite) {
      const sql = 'INSERT INTO mensajes (nombre, telefono, email, asunto, mensaje) VALUES (?, ?, ?, ?, ?)';
      db.run(sql, [data.nombre, data.telefono || '', data.email || '', data.asunto || '', data.mensaje], function(err) {
        if (err) return callback(err);
        callback(null, { id: this.lastID, ...data });
      });
    } else {
      const newId = fallbackStore.mensajes.length > 0 ? Math.max(...fallbackStore.mensajes.map(m => m.id)) + 1 : 1;
      const newItem = { id: newId, ...data, leido: 0, fecha_creacion: new Date().toISOString() };
      fallbackStore.mensajes.push(newItem);
      saveFallback();
      callback(null, newItem);
    }
  },

  // --- PROYECTOS / GALERÍA ---
  getProyectos: (callback) => {
    if (useSqlite) {
      db.all('SELECT * FROM proyectos ORDER BY id DESC', [], callback);
    } else {
      callback(null, fallbackStore.proyectos);
    }
  },

  createProyecto: (data, callback) => {
    if (useSqlite) {
      const sql = 'INSERT INTO proyectos (titulo, categoria, descripcion, imagen_url) VALUES (?, ?, ?, ?)';
      db.run(sql, [data.titulo, data.categoria, data.descripcion || '', data.imagen_url], function(err) {
        if (err) return callback(err);
        callback(null, { id: this.lastID, ...data });
      });
    } else {
      const newId = fallbackStore.proyectos.length > 0 ? Math.max(...fallbackStore.proyectos.map(p => p.id)) + 1 : 1;
      const newItem = { id: newId, ...data, fecha_creacion: new Date().toISOString() };
      fallbackStore.proyectos.push(newItem);
      saveFallback();
      callback(null, newItem);
    }
  },

  // --- ESTADÍSTICAS PARA EL ADMIN DASHBOARD ---
  getStats: (callback) => {
    DatabaseAPI.getCotizaciones((err, cots) => {
      if (err) return callback(err);
      DatabaseAPI.getMensajes((err2, msgs) => {
        if (err2) return callback(err2);
        const total = cots.length;
        const pendientes = cots.filter(c => c.estado === 'Pendiente').length;
        const enProceso = cots.filter(c => c.estado === 'Contactado' || c.estado === 'En Proceso').length;
        const finalizadas = cots.filter(c => c.estado === 'Cerrado' || c.estado === 'Aprobada').length;
        const valorEstimado = cots.reduce((acc, c) => acc + (Number(c.estimado_precio) || 0), 0);

        callback(null, {
          totalCotizaciones: total,
          pendientes,
          enProceso,
          finalizadas,
          totalMensajes: msgs.length,
          valorEstimadoTotal: valorEstimado.toFixed(2)
        });
      });
    });
  }
};

module.exports = DatabaseAPI;
