# 🏢 Cristalería Aluvidrios Victoria Páez, C.A. (AVP)
### Proyecto Final Universitario • Desarrollo Web Full-Stack

Aplicación web integral para el negocio venezolano **Cristalería Aluvidrios Victoria Páez**, especializado en carpintería de aluminio, vidrio templado arquitectónico, puertas de baño, fachadas y cerramientos de cristal.

---

## 📌 1. Características Principales

### 🌐 Frontend (Público)
* **Diseño Glassmorphism Moderno:** Acabado translúcido (*efecto cristal*) que complementa la identidad de una cristalería de alto nivel.
* **Catálogo de Servicios:** Tarjetas interactivas con detalles de puertas de baño, ventanas panorámicas, fachadas, pasamanos de acero/vidrio y peceras.
* **Cotizador Interactivo en Tiempo Real (Funcionalidad Estrella):**
  * Los clientes ingresan dimensiones (ancho × alto en metros), tipo de vidrio (templado 8mm/10mm, esmerilado, laminado) y acabado de perfilería.
  * Calcula automáticamente el área en $m^2$ y el presupuesto referencial en USD.
  * Permite **guardar la solicitud directamente en la Base de Datos del Backend** y/o **enviarla por WhatsApp oficial** (`+58 416-0118029`) con mensaje pre-armado y estructurado.
* **Galería / Portafolio con Filtros Dinámicos:** Clasificación por categorías con visor emergente (*Lightbox*).
* **Información Real del Negocio:** Horarios de atención (Lunes a Sábado de 8:00 AM a 5:00 PM), bancos afiliados para transferencias y Pago Móvil (Provincial, Venezuela, Mercantil) y pagos en divisas (Zelle, Visa).

### 🔐 Backend & Base de Datos
* **API REST Completa:** Endpoints organizados para servicios, cotizaciones, mensajes y autenticación.
* **Base de Datos SQLite (`database.sqlite`):**
  * Tabla `cotizaciones`: Historial de solicitudes de clientes, medidas, precios y estados de atención.
  * Tabla `mensajes`: Consultas de contacto directo.
  * Tabla `proyectos`: Catálogo de obras y galería.
* **Panel de Administración (`admin.html`):**
  * Acceso protegido por contraseña.
  * Métricas en tiempo real (Total de cotizaciones, pendientes, valor estimado en cartera).
  * Gestión de cotizaciones: Cambio dinámico de estado (*Pendiente*, *Contactado*, *En Proceso*, *Cerrado*).
  * Botón de WhatsApp integrado en cada fila para contactar al cliente con un solo clic.
  * Publicador de nuevos proyectos para la galería pública.

---

## 📁 2. Estructura del Proyecto

```text
aluvidrios-web/
├── backend/
│   ├── database.js          # Controlador SQLite y persistencia de datos
│   ├── database.sqlite      # Archivo de base de datos SQLite autogenerado
│   ├── package.json         # Configuración y dependencias (Express, CORS, SQLite3)
│   ├── server.js            # Servidor API REST con Express (Node.js)
│   └── server.py            # Servidor API nativo alternativo (Python 3.12 sin dependencias)
├── frontend/
│   ├── css/
│   │   └── style.css        # Hoja de estilos con efectos Glassmorphism y responsive
│   ├── js/
│   │   ├── admin.js         # Lógica del panel administrativo y gestión CRUD
│   │   └── app.js           # Cotizador dinámico, consumo de API y enlace WhatsApp
│   ├── admin.html           # Interfaz del Panel Administrativo
│   └── index.html           # Landing page principal para clientes
├── iniciar_servidor.bat     # Lanzador de 1 clic para Windows
└── README.md                # Documentación del proyecto
```

---

## 🚀 3. Cómo Ejecutar el Proyecto

Tienes dos formas súper sencillas:

### Método A: Doble Clic (El más rápido en Windows)
Haz doble clic sobre el archivo **`iniciar_servidor.bat`**. 
El script detecta automáticamente tu entorno (Node.js o Python nativo), inicia el servidor en el puerto 3000 y te abre la página web en tu navegador.

### Método B: Desde la Consola de Comandos
Abre una terminal en la carpeta `backend` y ejecuta:

**Con Node.js:**
```bash
node server.js
```

**O con Python (ya viene instalado en tu sistema):**
```bash
python server.py
```

Luego abre tu navegador en:
* 🌐 **Página Principal:** [http://localhost:3000](http://localhost:3000)
* 🔐 **Panel de Administración:** [http://localhost:3000/admin.html](http://localhost:3000/admin.html)

---

## 🔑 4. Credenciales del Panel de Administración

* **Usuario:** `admin`
* **Contraseña:** `admin123` *(o `aluvidrios`)*

---

## 📡 5. Endpoints de la API REST

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/health` | Estado del servidor y versión |
| `GET` | `/api/servicios` | Listado maestro de servicios |
| `GET` | `/api/proyectos` | Proyectos de la galería |
| `POST` | `/api/proyectos` | Agregar nuevo proyecto a la galería |
| `GET` | `/api/cotizaciones` | Obtener todas las cotizaciones recibidas |
| `POST` | `/api/cotizaciones` | Registrar nueva solicitud de cotización |
| `PUT` | `/api/cotizaciones/:id`| Actualizar estado de una cotización |
| `DELETE` | `/api/cotizaciones/:id`| Eliminar cotización del registro |
| `GET` | `/api/mensajes` | Consultar mensajes de contacto |
| `POST` | `/api/mensajes` | Enviar mensaje desde el formulario |
| `GET` | `/api/stats` | Estadísticas para los widgets del dashboard |
| `POST` | `/api/admin/login` | Autenticación del administrador |

---

## 🎓 6. Puntos Clave para la Defensa del Proyecto

Cuando expongas ante tu profesor o jurado, resalta estos tres aspectos fundamentales:
1. **Solución a un Problema Real de Negocio:** La mayoría de clientes que compran vidrio y aluminio no saben cuánto cuesta un trabajo por $m^2$. El cotizador en tiempo real resuelve este problema entregando un estimado instantáneo y canalizando el cierre de venta por WhatsApp o registrándolo en la base de datos.
2. **Arquitectura Desacoplada (Frontend / Backend):** El Frontend consume datos exclusivamente mediante peticiones asíncronas (`fetch` en JavaScript) hacia la API REST en formato JSON.
3. **Persistencia de Datos Robusta:** Los datos se guardan en una base de datos relacional (SQLite), lo que permite trazabilidad de presupuestos, cambio de estados de cotización y métricas comerciales.
