# Dark Tactical Analytics Dashboard (FACEIT)

Dashboard web (Flask + Vite/React) que muestra estadísticas reales e historial de partidas vía FACEIT Open API.

Frontend compilado en `FigmaFrontEnd/dist` y servido por Flask.

---

## Características

- Interfaz moderna oscura - Tema Dark Tactical con colores naranja, azul, rojo y verde
- Frontend Vite/React - UI tipo “dashboard” servida por Flask
- Datos reales con FACEIT - Estadísticas + historial de partidas (requiere `FACEIT_API_KEY`)

---

## Requisitos

- Python 3.8+
- pip (gestor de paquetes Python)

---

## Instalación Rápida

### 1. Instala las dependencias

```bash
pip install -r requirements.txt
```

### 2. Ejecuta el servidor

Configura tu API key de FACEIT:

```powershell
$env:FACEIT_API_KEY = "TU_FACEIT_KEY_AQUI"
# Opcional (si lo tienes):
$env:FACEIT_APP_ID = "TU_FACEIT_APP_ID_AQUI"
```

Alternativa (más fácil): crea un archivo `.env` en la raíz del proyecto (misma carpeta que `server.py`) con:

```env
FACEIT_API_KEY=TU_FACEIT_KEY_AQUI
FACEIT_APP_ID=TU_FACEIT_APP_ID_AQUI
```

CMD (solo para la sesión actual):

Luego ejecuta:

```bash
python server.py
```

Nota: si cambias variables de entorno (por ejemplo `FACEIT_API_KEY`), reinicia el backend.

### 3. Abre en tu navegador

```
http://localhost:5000
```

---

## Dependencias

| Paquete | Versión | Uso |
|---------|---------|-----|
| Flask | ≥2.3.0 | Framework web backend |
| Flask-CORS | ≥4.0.0 | Soporte CORS para APIs |
| Requests | ≥2.31.0 | Peticiones HTTP |
| python-dotenv | ≥1.0.0 | Cargar `.env` (opcional) |

---

## Estructura del Proyecto

```
ProyectoDeIA/
├── server.py                 # Backend Flask + APIs
├── faceit_client.py          # Cliente FACEIT Open API
├── requirements.txt          # Dependencias Python
├── FigmaFrontEnd/            # Frontend Vite/React
│   └── dist/                 # Build servido por Flask
└── README.md                 # Este archivo
```



---

## Ejecución

### Opción 1: Servidor Flask (Recomendado)

```bash
python server.py
```

**Salida esperada:**
```
Dark Tactical Analytics Dashboard
http://localhost:5000
```

Abre http://localhost:5000 en tu navegador.

### Opción 2: Desarrollo con debug automático

```bash
# En Windows
set FLASK_ENV=development && python server.py

# En macOS/Linux
export FLASK_ENV=development && python server.py
```

---

## Endpoints de API

Todos los endpoints devuelven datos en formato **JSON**.

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/` | GET | SPA (frontend) |

### Endpoints FACEIT

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/faceit/status` | GET | Estado de configuración de FACEIT |
| `/api/faceit/search?q=don` | GET | Autocomplete de nicknames (3+ chars) |
| `/api/faceit/summary?nickname=donk` | GET | Resumen (lifetime + últimos matches) |
| `/api/faceit/latest-match?nickname=donk` | GET | Última partida (si existe) |

En el dashboard puedes escribir 3+ letras del nickname y usar “Sugerencias” para completar el nombre.

**Ejemplo de uso:**

```javascript
// Fetchear datos del jugador
fetch('/api/player')
    .then(res => res.json())
    .then(data => console.log(data));
```

---

## Diseño Dark Tactical

### Paleta de Colores

| Color | Código | Uso |
|-------|--------|-----|
| Fondo oscuro | `#0f1419` | Fondo principal |
| Cards | `#1a1f3a` | Contenedores secundarios |
| Naranja | `#ff6b35` | Acentos, resaltados |
| Azul | `#0066ff` | Información, CT |
| Rojo | `#ff3333` | Alertas, Team |
| Verde | `#00dd88` | Success, positivo |
| Amarillo | `#ffd700` | Warnings, atención |

### Tipografía

- **Fuente**: System fonts (Apple/Segoe/Helvetica)
- **Tamaño base**: 14-16px
- **Headings**: 700 font-weight
- **Espaciado**: Basado en múltiplos de 0.5rem

---

## Configuración

Este proyecto depende de FACEIT. Solo necesitas configurar `FACEIT_API_KEY` (y opcionalmente `FACEIT_APP_ID`).

### Cambiar puerto del servidor

En `server.py`, modifica la última línea:

```python
if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)  # Cambiar 5000 a otro puerto
```

---

## Troubleshooting

### Error: "ModuleNotFoundError: No module named 'flask'"

```bash
pip install flask flask-cors
```

### Puerto 5000 ya está en uso

Cambia el puerto en `server.py` o usa:

```bash
python server.py  # Intentar otro puerto
```

### El navegador muestra "Connection Refused"

- Verifica que Flask está ejecutándose: revisa la consola
- Abre http://localhost:5000 exactamente (no uses https://)
- Intenta con http://127.0.0.1:5000

### El CSS no se carga (página sin estilos)

Verifica que la carpeta `static/` existe y contiene `style.css`.

---

## Secciones del Dashboard

### 1. **Header**
- Logo de Tactical Dashboard
- Usuario actual (HijoDelGitpadre)

### 2. **Match Analysis**
- Información del mapa, tipo y fecha
- Badges de Team (T) vs CT

### 3. **Key Metrics**
- Score Táctico, Precisión, Duelos Ganados, Eficiencia

### 4. **Reporte de Desempeño**
- Barras de progreso por aspecto clave

### 5. **Perfil del Jugador**
- Rol detectado y estadísticas personales

### 6. **Recomendaciones Personalizadas**
- Insights prioritarios con niveles

### 7. **Errores Recurrentes**
- Patrones negativos detectados

### 8. **Áreas de Mejora**
- Métricas a mejorar y objetivos

### 9. **Comparación T vs CT**
- Rendimiento por lado del equipo

---

## Próximas Mejoras

- [ ] Base de datos con histórico
- [ ] Gráficos avanzados (Chart.js)
- [ ] Autenticación de usuarios
- [ ] Exportar reportes en PDF
- [ ] Notificaciones en tiempo real
- [ ] Dashboard multi-jugador

---

## Stack Tecnológico

### Backend
- **Flask** - Framework web
- **Pandas + NumPy** - Análisis de datos
- **Scikit-learn** - Machine Learning (K-Means)

### Frontend
- **HTML5** - Estructura semántica
- **CSS3 puro** - Sin librerías, máximo rendimiento
- **JavaScript vanilla** - Sin dependencias externas

---

## Licencia

Uso personal y educativo © 2026

---

**Versión 2.0** | Dark Tactical Analytics | Production Ready

