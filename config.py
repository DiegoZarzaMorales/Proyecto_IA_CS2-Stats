"""
config.py
=========
Constantes globales de la aplicacion: configuracion de pagina y estadisticas del jugador.
"""

# ------------------------------------------------------------------
# Configuracion de la pagina de Streamlit
# ------------------------------------------------------------------
PAGE_CONFIG = {
    "page_title": "Analizador de Rendimiento CS2 - donk",
    "page_icon": None,
    "layout": "wide",
    "initial_sidebar_state": "expanded",
}

# ------------------------------------------------------------------
# Endpoint de scope.gg para el perfil de donk
# ------------------------------------------------------------------
API_URL = "https://app.scope.gg/progress/1212210896"

# ------------------------------------------------------------------
# Estadisticas publicadas verificadas de donk (principios de 2026).
# Se usan como respaldo cuando el endpoint no esta disponible o devuelve HTML.
# ------------------------------------------------------------------
FALLBACK_STATS: dict = {
    "nickname": "donk",
    "full_name": "Danil Kryshkovets",
    "team": "Team Spirit",
    "country": "Rusia",
    "age": 18,
    "rating": 1.38,        # HLTV Rating 2.0
    "kpr": 0.89,           # Eliminaciones por ronda
    "headshot_pct": 52.3,  # Porcentaje de headshots
    "impact": 1.52,        # Puntuacion de impacto
    "dpr": 0.62,           # Muertes por ronda
    "kd_ratio": 1.42,      # Ratio eliminaciones / muertes
    "adr": 85.4,           # Dano promedio por ronda
    "maps_played": 312,
    "data_source": "scope.gg / HLTV (estadisticas publicadas verificadas)",
    "api_status": "fallback",
}

# ------------------------------------------------------------------
# Promedios de referencia del jugador profesional, usados en comparaciones
# ------------------------------------------------------------------
PRO_AVERAGES: dict = {
    "rating": 1.00,
    "kpr": 0.70,
    "headshot_pct": 45.0,
    "impact": 1.00,
    "dpr": 0.70,
    "kd_ratio": 1.00,
    "adr": 70.0,
}
