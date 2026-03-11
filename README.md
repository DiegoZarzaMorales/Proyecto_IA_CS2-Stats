# Analizador de Rendimiento CS2 - donk (Team Spirit)

Aplicacion web construida con Streamlit que extrae estadisticas del HTML de scope.gg
y utiliza K-Means para detectar posibles fallas en el rendimiento del jugador.

---

## Requisitos del sistema

- Python 3.10 o superior
- Conexion a internet (para el scraping de scope.gg)
- Sistema operativo: Windows, macOS o Linux

---

## Instalacion

### 1. Clonar o descargar el proyecto

Coloca todos los archivos en una carpeta local, por ejemplo:

```
C:\Users\tu_usuario\Documents\ProyectoDeIA\
```

### 2. Crear un entorno virtual (recomendado)

Abre una terminal en la carpeta del proyecto y ejecuta:

```
python -m venv venv
```

Activar el entorno virtual:

- En Windows:
  ```
  venv\Scripts\activate
  ```
- En macOS / Linux:
  ```
  source venv/bin/activate
  ```

### 3. Instalar las dependencias

Con el entorno virtual activo, instala todas las librerias necesarias:

```
pip install -r requirements.txt
```

Las dependencias instaladas son:

| Libreria       | Uso                                          |
|----------------|----------------------------------------------|
| streamlit      | Interfaz web interactiva                     |
| pandas         | Manipulacion de datos y tablas               |
| numpy          | Calculo numerico y generacion de datasets    |
| requests       | Peticiones HTTP para el scraping             |
| beautifulsoup4 | Parseo del HTML recibido de scope.gg         |
| scikit-learn   | Algoritmo K-Means para clasificacion IA      |

---

## Estructura del proyecto

```
ProyectoDeIA/
    app.py              -- Archivo principal (unico punto de entrada)
    requirements.txt    -- Lista de dependencias
    README.md           -- Este archivo
    config.py           -- Configuracion legacy (no se usa en la version actual)
    modules/            -- Modulos legacy (no se usan en la version actual)
```

> El archivo `app.py` es completamente autonomo. No depende de `config.py`
> ni de la carpeta `modules/`.

---

## Ejecucion

Desde la terminal, dentro de la carpeta del proyecto:

```
python -m streamlit run app.py
```

> Se usa `python -m streamlit` en lugar de `streamlit` directamente porque
> en algunos sistemas Windows el comando `streamlit` no queda registrado
> en el PATH del sistema al instalar con pip.

Una vez iniciado, la terminal mostrara una URL similar a:

```
Local URL:   http://localhost:8501
Network URL: http://192.168.x.x:8501
```

Abre esa direccion en tu navegador para ver la aplicacion.

---

## Configuracion interna (archivo app.py)

Todos los parametros configurables se encuentran al inicio de `app.py`,
en la seccion marcada como `CONFIGURACION`.

### URL del perfil

```python
URL_PERFIL = "https://app.scope.gg/progress/1212210896"
```

Cambia este valor si deseas analizar un perfil diferente de scope.gg.

### Estadisticas de respaldo

```python
STATS_RESPALDO = {
    "rating":       1.38,
    "kpr":          0.89,
    "headshot_pct": 52.3,
    "impacto":      1.52,
    "dpr":          0.62,
    "kd":           1.42,
    "adr":          85.4,
}
```

scope.gg es una aplicacion React (SPA) y no siempre devuelve datos estructurados
en el HTML estatico. Cuando el scraping no encuentra datos, la aplicacion usa
estos valores verificados de donk (principios de 2026) como respaldo.

Puedes actualizar estos valores con estadisticas mas recientes del jugador.

### Promedios de referencia profesional

```python
PROMEDIOS_PRO = {
    "rating":       1.00,
    "kpr":          0.70,
    "headshot_pct": 45.0,
    "impacto":      1.00,
    "dpr":          0.70,
    "kd":           1.00,
    "adr":          70.0,
}
```

Estos valores representan el promedio de un jugador profesional tipico
y se usan como linea base para detectar fallas. Puedes ajustarlos segun
la fuente de referencia que prefieras (HLTV, Leetify, etc.).

### Tiempo de cache del scraping

```python
@st.cache_data(ttl=3600)
```

El resultado del scraping se guarda en cache durante 3600 segundos (1 hora).
Cambia ese numero si necesitas actualizaciones mas frecuentes o menos frecuentes.

---

## Como funciona el analisis

### Scraping del HTML

1. La aplicacion hace una peticion GET a `URL_PERFIL` simulando un navegador real.
2. BeautifulSoup parsea el HTML recibido.
3. Se busca primero el tag `<script id="__NEXT_DATA__">` (patron de Next.js).
4. Si no se encuentra, se buscan bloques JSON en todos los `<script>` que contengan
   palabras clave como `rating`, `kpr`, `adr`.
5. Si se encuentra JSON con datos validos, se extraen y muestran.
6. Si no se encuentran datos (caso comun con SPAs sin SSR), se usan `STATS_RESPALDO`.

### Clasificacion con K-Means

Se genera un dataset sintetico de 100 perfiles de jugadores en 3 niveles:
Promedio, Bueno y Elite. El algoritmo K-Means entrena sobre ese dataset y luego
clasifica al jugador analizado segun sus metricas de KPR, Impacto y Rating.

### Deteccion de fallas

Cada metrica se compara contra `PROMEDIOS_PRO`. Si la diferencia supera un umbral
definido, se genera una alerta con severidad:

- Alta: diferencia significativa, mostrada en rojo.
- Media: diferencia moderada, mostrada en amarillo.

---

## Sololucion de problemas comunes

**El comando `streamlit` no se reconoce:**
Usa siempre `python -m streamlit run app.py` en lugar de `streamlit run app.py`.

**La app muestra estadisticas de respaldo en lugar de datos en vivo:**
Esto es esperado. scope.gg carga los datos de forma dinamica con JavaScript,
por lo que el HTML estatico raramente contiene las estadisticas. La aplicacion
lo indica en el expander "Detalle del scraping".

**Error de modulo no encontrado:**
Asegurate de haber ejecutado `pip install -r requirements.txt` con el entorno
virtual activo y de estar usando el mismo entorno al lanzar la app.

**Puerto ya en uso:**
Streamlit buscara automaticamente el siguiente puerto disponible (8502, 8503, etc.).
La URL correcta se muestra siempre en la terminal al iniciar.
