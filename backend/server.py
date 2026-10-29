"""
Servidor alternativo en Python (Sin dependencias externas)
Usa http.server y sqlite3 nativo de Python 3.12.
Ideal para ejecutar de inmediato sin necesidad de instalar paquetes npm.
"""

import http.server
import socketserver
import json
import sqlite3
import os
import urllib.parse
from datetime import datetime

PORT = 3000
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(BASE_DIR, '..', 'frontend')
DB_PATH = os.path.join(BASE_DIR, 'database.sqlite')

# Inicializar Base de Datos SQLite
def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
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
    ''')
    cursor.execute('''
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
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS proyectos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            titulo TEXT NOT NULL,
            categoria TEXT NOT NULL,
            descripcion TEXT,
            imagen_url TEXT NOT NULL,
            fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Insertar proyectos iniciales si no hay
    cursor.execute("SELECT COUNT(*) FROM proyectos")
    if cursor.fetchone()[0] == 0:
        proyectos = [
            ('Fachada Comercial en Vidrio Templado', 'fachadas', 'Cerramiento integral moderno con estructura de aluminio y vidrios panorámicos.', 'assets/img/fachadas.jpeg'),
            ('Puerta de Baño en Vidrio Templado', 'banos', 'Sistema corredizo con vidrio templado de 8mm y perfiles de acero inoxidable.', 'assets/img/puertas-bano.jpeg'),
            ('Ventanas Panorámicas de Aluminio', 'ventanas', 'Ventanas corredizas herméticas con protectores y perfiles de alta resistencia.', 'assets/img/ventanas.jpeg'),
            ('Pasamanos y Baranda de Cristal', 'barandas', 'Baranda para escaleras combinando acero inoxidable y vidrio templado.', 'assets/img/barandas.jpeg'),
            ('Pecera Panorámica de Alta Resistencia', 'especiales', 'Trabajo a medida con vidrio extra claro templado y sellado estructural.', 'assets/img/peceras.jpeg'),
            ('Fachada Arquitectónica Comercial', 'fachadas', 'Cerramiento panorámico moderno en dos niveles con acabados de primera.', 'assets/img/hero.jpeg')
        ]
        cursor.executemany("INSERT INTO proyectos (titulo, categoria, descripcion, imagen_url) VALUES (?, ?, ?, ?)", proyectos)

    # Insertar cotizaciones de ejemplo
    cursor.execute("SELECT COUNT(*) FROM cotizaciones")
    if cursor.fetchone()[0] == 0:
        cots = [
            ('Carlos Mendoza', '+58 412-5551234', 'Valencia', 'Puertas de Baño', 1.6, 1.9, 'Templado 8mm Claro', 'Aluminio Negro Mate', 280, 'Ducha principal, instalación requerida', 'Pendiente'),
            ('María Rodríguez', '+58 414-7894561', 'Maracay', 'Ventanas Panorámicas', 2.2, 1.5, 'Laminado 6mm', 'Aluminio Plata Natural', 340, 'Apartamento piso 5', 'Contactado'),
            ('Inversiones Horizonte, C.A.', '+58 424-3216549', 'Caracas', 'Fachadas Comerciales', 5.0, 3.2, 'Templado 10mm Seguridad', 'Estructura Acero / Aluminio', 1450, 'Local comercial en centro empresarial', 'En Proceso')
        ]
        cursor.executemany("""
            INSERT INTO cotizaciones (cliente_nombre, cliente_telefono, cliente_ciudad, servicio, ancho, alto, tipo_vidrio, acabado_aluminio, estimado_precio, notas, estado)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, cots)

    conn.commit()
    conn.close()

init_db()

SERVICIOS = [
  {"id": 'banos', "nombre": 'Puertas de Baño', "descripcion": 'Sistemas corredizos y batientes en vidrio templado de 8mm y 10mm con herrajes de acero inoxidable.', "precioBaseM2": 85},
  {"id": 'ventanas', "nombre": 'Ventanas Panorámicas', "descripcion": 'Ventanas correderas y fijas con perfiles de aluminio y aislamiento acústico.', "precioBaseM2": 70},
  {"id": 'fachadas', "nombre": 'Fachadas Comerciales', "descripcion": 'Cerramientos modernos de cristal arquitectónico para locales y oficinas.', "precioBaseM2": 110},
  {"id": 'barandas', "nombre": 'Pasamanos y Barandas', "descripcion": 'Diseños contemporáneos combinando acero inoxidable y vidrio laminado.', "precioBaseM2": 95},
  {"id": 'especiales', "nombre": 'Trabajos Especiales y Peceras', "descripcion": 'Peceras panorámicas, espejos biselados y techos de cristal.', "precioBaseM2": 120}
]

class AluvidriosHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=FRONTEND_DIR, **kwargs)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def _send_json(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path == '/api/health':
            self._send_json({"status": "ok", "app": "Aluvidrios Victoria Páez (Python Native API)"})
        elif path == '/api/servicios':
            self._send_json({"success": True, "data": SERVICIOS})
        elif path == '/api/proyectos':
            conn = sqlite3.connect(DB_PATH)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM proyectos ORDER BY id DESC")
            rows = [dict(r) for r in cursor.fetchall()]
            conn.close()
            self._send_json({"success": True, "data": rows})
        elif path == '/api/cotizaciones':
            conn = sqlite3.connect(DB_PATH)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM cotizaciones ORDER BY id DESC")
            rows = [dict(r) for r in cursor.fetchall()]
            conn.close()
            self._send_json({"success": True, "count": len(rows), "data": rows})
        elif path == '/api/mensajes':
            conn = sqlite3.connect(DB_PATH)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM mensajes ORDER BY id DESC")
            rows = [dict(r) for r in cursor.fetchall()]
            conn.close()
            self._send_json({"success": True, "data": rows})
        elif path == '/api/stats':
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM cotizaciones")
            total = cursor.fetchone()[0]
            cursor.execute("SELECT COUNT(*) FROM cotizaciones WHERE estado='Pendiente'")
            pendientes = cursor.fetchone()[0]
            cursor.execute("SELECT COUNT(*) FROM cotizaciones WHERE estado IN ('Contactado', 'En Proceso')")
            en_proceso = cursor.fetchone()[0]
            cursor.execute("SELECT COUNT(*) FROM cotizaciones WHERE estado IN ('Cerrado', 'Aprobada')")
            finalizadas = cursor.fetchone()[0]
            cursor.execute("SELECT SUM(estimado_precio) FROM cotizaciones")
            sum_res = cursor.fetchone()[0] or 0
            cursor.execute("SELECT COUNT(*) FROM mensajes")
            total_msg = cursor.fetchone()[0]
            conn.close()
            self._send_json({
                "success": True,
                "data": {
                    "totalCotizaciones": total,
                    "pendientes": pendientes,
                    "enProceso": en_proceso,
                    "finalizadas": finalizadas,
                    "totalMensajes": total_msg,
                    "valorEstimadoTotal": f"{sum_res:.2f}"
                }
            })
        else:
            # Archivos estáticos del frontend
            super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        length = int(self.headers.get('content-length', 0))
        body = self.rfile.read(length).decode('utf-8')
        try:
            data = json.loads(body) if body else {}
        except Exception:
            data = {}

        if path == '/api/cotizaciones':
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO cotizaciones (cliente_nombre, cliente_telefono, cliente_ciudad, servicio, ancho, alto, tipo_vidrio, acabado_aluminio, estimado_precio, notas, estado)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                data.get('cliente_nombre'),
                data.get('cliente_telefono'),
                data.get('cliente_ciudad', ''),
                data.get('servicio'),
                float(data.get('ancho') or 0),
                float(data.get('alto') or 0),
                data.get('tipo_vidrio', 'Estándar'),
                data.get('acabado_aluminio', 'Estándar'),
                float(data.get('estimado_precio') or 0),
                data.get('notas', ''),
                'Pendiente'
            ))
            new_id = cursor.lastrowid
            conn.commit()
            conn.close()
            self._send_json({"success": True, "data": {"id": new_id, **data}, "message": "Cotización registrada con éxito"}, 201)

        elif path == '/api/mensajes':
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO mensajes (nombre, telefono, email, asunto, mensaje)
                VALUES (?, ?, ?, ?, ?)
            """, (data.get('nombre'), data.get('telefono', ''), data.get('email', ''), data.get('asunto', ''), data.get('mensaje')))
            new_id = cursor.lastrowid
            conn.commit()
            conn.close()
            self._send_json({"success": True, "message": "Mensaje recibido con éxito"}, 201)

        elif path == '/api/proyectos':
            titulo = data.get('titulo')
            categoria = data.get('categoria')
            imagen_url = data.get('imagen_url')
            descripcion = data.get('descripcion', '')
            if not titulo or not categoria or not imagen_url:
                self._send_json({"success": False, "error": "Faltan campos obligatorios (título, categoría e imagen)"}, 400)
                return
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO proyectos (titulo, categoria, descripcion, imagen_url)
                VALUES (?, ?, ?, ?)
            """, (titulo, categoria, descripcion, imagen_url))
            new_id = cursor.lastrowid
            conn.commit()
            conn.close()
            self._send_json({
                "success": True,
                "data": {
                    "id": new_id,
                    "titulo": titulo,
                    "categoria": categoria,
                    "descripcion": descripcion,
                    "imagen_url": imagen_url
                },
                "message": "Proyecto agregado al portafolio con éxito"
            }, 201)

        elif path == '/api/admin/login':
            username = data.get('username')
            password = data.get('password')
            if username == 'admin' and (password == 'admin123' or password == 'aluvidrios'):
                self._send_json({"success": True, "token": "session-ok", "user": {"username": "admin"}})
            else:
                self._send_json({"success": False, "error": "Credenciales inválidas"}, 401)
        else:
            self.send_error(404, "Endpoint no encontrado")

    def do_PUT(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        if path.startswith('/api/cotizaciones/'):
            cot_id = path.split('/')[-1]
            length = int(self.headers.get('content-length', 0))
            data = json.loads(self.rfile.read(length).decode('utf-8'))
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            cursor.execute("UPDATE cotizaciones SET estado=? WHERE id=?", (data.get('estado'), cot_id))
            conn.commit()
            conn.close()
            self._send_json({"success": True, "message": f"Cotización #{cot_id} actualizada"})
        else:
            self.send_error(404)

    def do_DELETE(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        if path.startswith('/api/cotizaciones/'):
            cot_id = path.split('/')[-1]
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            cursor.execute("DELETE FROM cotizaciones WHERE id=?", (cot_id,))
            conn.commit()
            conn.close()
            self._send_json({"success": True, "message": f"Cotización #{cot_id} eliminada"})
        elif path.startswith('/api/proyectos/'):
            proj_id = path.split('/')[-1]
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            cursor.execute("DELETE FROM proyectos WHERE id=?", (proj_id,))
            conn.commit()
            conn.close()
            self._send_json({"success": True, "message": f"Proyecto #{proj_id} eliminado"})
        else:
            self.send_error(404)

if __name__ == '__main__':
    import sys
    import webbrowser
    import threading

    if hasattr(sys.stdout, 'reconfigure'):
        try:
            sys.stdout.reconfigure(encoding='utf-8')
        except Exception:
            pass

    # Soporte compatible para Python 3.6, 3.7, 3.8, 3.9, 3.10, 3.11, 3.12, 3.13
    if hasattr(http.server, 'ThreadingHTTPServer'):
        ServerClass = http.server.ThreadingHTTPServer
    else:
        class ServerClass(socketserver.ThreadingMixIn, http.server.HTTPServer):
            daemon_threads = True

    try:
        httpd = ServerClass(("", PORT), AluvidriosHandler)
        httpd.allow_reuse_address = True
    except OSError:
        print("="*60)
        print(f"[AVISO] El puerto {PORT} ya esta en uso.")
        print(f"Abriendo la web directamente en: http://localhost:{PORT}")
        print("="*60)
        try:
            webbrowser.open(f'http://localhost:{PORT}')
        except Exception:
            pass
        input("\nPresione ENTER para salir...")
        sys.exit(0)

    print("="*60)
    print("[OK] Cristaleria Aluvidrios Victoria Paez - Backend Activo")
    print(f"Servidor Web:  http://localhost:{PORT}")
    print(f"Panel Admin:   http://localhost:{PORT}/admin.html")
    print(f"Base de Datos: {DB_PATH}")
    print("="*60)
    print("El servidor esta listo. Mantenga esta ventana negra abierta mientras use la pagina.")
    print("Para detener el servidor: presione Ctrl + C o cierre esta ventana.")

    # Abrir navegador automaticamente una vez que el socket ya esta escuchando
    def _abrir_navegador():
        try:
            webbrowser.open(f'http://localhost:{PORT}')
        except Exception:
            pass

    threading.Timer(0.7, _abrir_navegador).start()

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor detenido.")
