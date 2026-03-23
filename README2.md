# README2 — Analizador FACEIT (CS2)

Este proyecto es un **analizador de rendimiento** basado en **datos reales** obtenidos desde la **FACEIT Open API v4**.

- **No usa datos simulados**.
- Backend: **Flask** (Python) con CORS, expone endpoints `/api/faceit/*`.
- Frontend: **React + Vite + TypeScript**, servido por el mismo backend desde `FigmaFrontEnd/dist`.

---

## 1) Flujo de la app (UX)

### Pantalla 1: “Usuarios” (selección)
La app inicia en una vista tipo **Find Players**:

- Input para buscar nickname de FACEIT (mínimo 3 letras).
- Autocomplete (sugerencias) con los resultados del backend.
- Lista de **usuarios recientes** (guardados en `localStorage`).
- Botón **Analizar**: carga datos reales y **solo navega al dashboard si la carga fue exitosa**.

### Pantalla 2: “Dashboard” (análisis)
Una vez elegido un jugador:

- Métricas principales (lifetime): Matches, Winrate, K/D, ADR, HS%, Score táctico.
- Última partida real en FACEIT: kills/deaths/assists/ADR/KD.
- Comparación **T vs CT** (solo si FACEIT entrega breakdown por lado).
- Reporte de desempeño (barras de “perfil”).
- Errores recurrentes.
- Áreas de mejora.
- Recomendaciones personalizadas.
- Rol asignado basado en tus métricas (Entry/AWPer/IGL/Lurker/Soporte/Ancla).
- “Variables generadas por la IA” (derivadas de métricas reales mediante reglas).

---

## 2) Arquitectura

### Backend (Flask)
Archivo principal: `server.py`

Responsabilidades:

1. **Cargar configuración** (`.env`) y variables de entorno.
2. **Crear cliente FACEIT** de manera lazy (al primer request).
3. Exponer endpoints HTTP `/api/faceit/*` que consumen FACEIT Open API.
4. Servir el frontend compilado (SPA) desde `FigmaFrontEnd/dist`.

### Cliente FACEIT
Archivo: `faceit_client.py`

- Wrapper mínimo alrededor de `requests`.
- Agrega headers requeridos (Bearer token).
- Maneja errores HTTP y timeouts.

### Frontend (React/Vite/TS)
Archivo principal: `FigmaFrontEnd/src/app/App.tsx`

- Vista `select-user` (Usuarios) y vista `dashboard`.
- Calcula insights/roles/variables derivadas con `useMemo`.
- Llama endpoints del backend con `fetch('/api/...')`.

---

## 3) Configuración (FACEIT)

### Variables requeridas
En `.env` (en la raíz del proyecto) o como variables de entorno:

- `FACEIT_API_KEY` (requerida)
- `FACEIT_APP_ID` (opcional)

Ejemplo de `.env`:

```env
FACEIT_API_KEY=tu_api_key_aqui
# FACEIT_APP_ID=opcional
```

### Cómo se carga `.env`
`server.py`:

- Intenta usar `python-dotenv` si está instalado.
- Si no está disponible, usa un fallback simple.
- No sobreescribe variables ya existentes del entorno.

---

## 4) Endpoints del backend (qué hace cada uno)

Base: `http://localhost:5000`

### `GET /api/faceit/status`
Devuelve si el backend tiene API key configurada y si el cliente FACEIT quedó habilitado.

Ejemplo:

```json
{
  "enabled": true,
  "api_key_configured": true,
  "message": null
}
```

### `GET /api/faceit/search?q=<texto>&game=cs2&limit=8`
Autocomplete de jugadores (para la pantalla Usuarios).

- Requiere `q` con mínimo 3 caracteres.
- Devuelve lista `items` con nickname, player_id, país, avatar, etc.

### `GET /api/faceit/player?nickname=<nick>&game=cs2`
Resuelve un jugador por nickname.

- Tiene fallback a `csgo` si `cs2` falla.
- Respuesta incluye `raw` (payload completo de FACEIT) además del resumen.

### `GET /api/faceit/summary?nickname=<nick>&limit=10&game=cs2`
Resumen (datos reales):

- `lifetime`: stats agregadas del jugador (FACEIT player stats).
- `recent_matches`: últimos matches (IDs + metadata).

### `GET /api/faceit/latest-match?nickname=<nick>&game=cs2`
Última partida real:

- Resuelve `match_id` desde el historial.
- Trae detalles y stats del match.
- Extrae stats del jugador:
  - kills, deaths, assists, ADR, HS%, KD
  - y **best-effort** breakdown por lado `t` y `ct` (si FACEIT lo entrega).

---

## 5) Qué es “IA” aquí (importante)

En este proyecto, “IA” significa **variables e insights derivados** por reglas heurísticas.

- No se entrena un modelo.
- No se inventan eventos.
- Solo se calculan clasificaciones/patrones basados en métricas reales:
  - lifetime (K/D, ADR, HS%, winrate)
  - última partida (K/D, ADR, kills, deaths)
  - y cuando existe, T/CT split.

---

## 6) Cálculos principales (cómo se generan)

### 6.1 Score táctico (0–100)
Se calcula en el frontend ponderando:

- Lifetime:
  - K/D (peso alto)
  - ADR (peso alto)
  - HS% (peso medio)
  - Winrate (peso menor)
- Forma reciente:
  - K/D de la última partida (pequeño ajuste)
  - ADR de la última partida (pequeño ajuste)

Resultado: un número **heurístico** que resume “impacto + consistencia”.

### 6.2 Errores recurrentes
Se activan por umbrales reales, por ejemplo:

- K/D global < 1.0
- ADR global < 70
- HS% global < 25
- Winrate global < 50

Y también señales de la **última partida**.

### 6.3 Áreas de mejora
Traduce métricas débiles a acciones:

- Subir ADR → más trade damage + utilidad.
- Subir K/D → menos muertes evitables, mejor reposicionamiento.
- Subir HS% → pre-aim, control recoil.
- Subir winrate → cierre, economía.

### 6.4 Recomendaciones personalizadas
Se priorizan según lo más débil.

Además, si existe T/CT split y hay diferencia fuerte:

- Si CT ADR - T ADR >= 10 → se sugiere mejorar T-side.
- Si T ADR - CT ADR >= 10 → se sugiere mejorar CT-side.

### 6.5 Comparación T vs CT
- Solo se muestra con números si `latest-match` incluye stats por lado.
- Si no hay breakdown, el dashboard muestra el mensaje de “no disponible”.

### 6.6 Rol asignado
El rol se asigna con una puntuación por rol usando:

- kills/deaths/ADR/KD/HS del último match
- winrate y valores lifetime
- y (si está) el sesgo T vs CT

Roles:

- Entry Fragger
- Francotirador (AWPer)
- Líder en el juego (IGL)
- Lurker (Observador)
- Soporte
- Ancla

Además se muestra “Por qué” con 1–3 razones extraídas de métricas reales.

### 6.7 “Variables generadas por la IA”
Se derivan así (resumen):

- **Patrón táctico detectado**: Equilibrado / Agresión en T-side / Solidez en CT-side (según ADR por lado).
- **Cluster de comportamiento**: Consistente / Impacto alto / Precisión / En desarrollo (según combinaciones de ADR/KD/HS).
- **Nivel de desempeño**: Alto/Medio/Bajo (según score táctico).
- **Clasificación del jugador**: Agresivo/Defensivo/Apoyo/etc. (según rol asignado).
- **Índice de eficiencia táctica**: score táctico.
- **Frecuencia de errores**: Baja/Media/Alta (según suma de frecuencias de errores).

---

## 7) Cómo ejecutar (Windows)

### 7.1 Backend
1. Instalar dependencias:

```powershell
C:/Users/josez/Documents/ProyectoDeIA/.venv/Scripts/python.exe -m pip install -r requirements.txt
```

2. Ejecutar backend:

```powershell
C:/Users/josez/Documents/ProyectoDeIA/.venv/Scripts/python.exe server.py
```

El backend sirve la web en:

- `http://localhost:5000`

### 7.2 Frontend
Para compilar a producción (lo que el backend sirve):

```powershell
cd FigmaFrontEnd
npm run build
```

Esto genera/actualiza `FigmaFrontEnd/dist`.

---

## 8) Troubleshooting

### 8.1 “FACEIT_API_KEY no configurada”
- Confirma que `.env` está en la raíz del proyecto (misma carpeta que `server.py`).
- Confirma que la línea sea `FACEIT_API_KEY=...` sin espacios raros.
- Reinicia el backend.

### 8.2 Autocomplete no muestra sugerencias
- Debes escribir 3+ letras.
- Verifica que el backend esté corriendo.
- Revisa el endpoint:
  - `GET /api/faceit/search?q=abc&game=cs2&limit=8`

### 8.3 T vs CT aparece como “no disponible”
No es un bug necesariamente:

- FACEIT no siempre devuelve breakdown T/CT en el endpoint de stats.
- El backend intenta “best-effort” con múltiples nombres posibles de llaves.

### 8.4 Rate limit (429)
FACEIT puede limitar requests:

- Espera un poco.
- Evita spamear búsquedas.

---

## 9) Archivos clave

- Backend:
  - `server.py`
  - `faceit_client.py`
  - `.env`
- Frontend:
  - `FigmaFrontEnd/src/app/App.tsx`
  - `FigmaFrontEnd/src/app/components/PlayerProfileBadge.tsx`

---

## 10) Nota de diseño (datos reales)

Todo el análisis se construye a partir de:

- Lifetime stats del jugador (FACEIT)
- Última partida real (FACEIT)

No se generan “partidas fake”, ni se scrapean páginas bloqueadas por Cloudflare.
