"""
modules/sidebar.py
==================
Renderiza el panel lateral de la aplicacion con descripcion del sistema y navegacion.
"""

import streamlit as st


def render_sidebar() -> None:
    """Muestra el panel lateral con la descripcion del sistema."""
    with st.sidebar:
        st.title("CS2 Analytics")
        st.markdown("---")
        st.markdown(
            """
            ### Acerca del Sistema
            Dashboard inteligente de analisis de rendimiento para jugadores profesionales de CS2.

            **Jugador actual:**
            Danil "donk" Kryshkovets

            **Equipo:** Team Spirit

            **Fuente de datos:**
            scope.gg / HLTV estadisticas

            ---
            **Paneles del dashboard:**
            - Perfil del Jugador
            - Estadisticas
            - Analisis con IA
            - Recomendaciones
            """
        )
        st.markdown("---")
        st.caption("Analizador de Rendimiento CS2 v1.0")
