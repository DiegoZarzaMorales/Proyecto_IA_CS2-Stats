"""
modules/data.py
===============
Obtiene las estadisticas del jugador desde el endpoint de scope.gg.
Si el endpoint devuelve HTML (SPA) o no esta disponible, se usan
estadisticas publicadas verificadas como respaldo.
"""

import copy
import requests
import streamlit as st

from config import API_URL, FALLBACK_STATS


@st.cache_data(ttl=3600)
def fetch_player_data() -> dict:
    """
    Intenta obtener los datos del jugador desde la API de scope.gg.

    scope.gg sirve una SPA de React, por lo que raramente devuelve JSON
    directamente. Se retorna un diccionario de estadisticas verificadas
    cuando el endpoint no provee JSON.

    Returns
    -------
    dict
        Diccionario con estadisticas del jugador. La clave ``api_status``
        indica si los datos son en vivo, html_response o fallback.
    """
    stats = copy.deepcopy(FALLBACK_STATS)

    try:
        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/122.0.0.0 Safari/537.36"
            )
        }
        response = requests.get(API_URL, headers=headers, timeout=8)

        if response.status_code == 200:
            try:
                data = response.json()
                # Si el endpoint devuelve JSON en el futuro, mapear los campos aqui.
                stats["rating"] = float(data.get("rating", stats["rating"]))
                stats["api_status"] = "live"
            except Exception:
                # El endpoint devolvio HTML (SPA) — se conservan los valores de respaldo
                stats["api_status"] = "html_response"
        else:
            stats["api_status"] = f"http_{response.status_code}"

    except requests.RequestException as exc:
        stats["api_status"] = f"connection_error: {exc}"

    return stats
