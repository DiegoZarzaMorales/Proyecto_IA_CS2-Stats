"""
modules/tabs/profile.py
=======================
Tab 1 - Perfil del Jugador.
Muestra la identidad, biografia e indicadores clave de rendimiento del jugador.
"""

import streamlit as st

from config import PRO_AVERAGES


def render_profile_tab(stats: dict) -> None:
    """Renderiza la pestana de Perfil del Jugador."""
    st.header("Perfil del Jugador")

    # --- Seccion de biografia ------------------------------------
    col_info, col_badge = st.columns([3, 1])

    with col_info:
        st.markdown(f"## donk — *{stats['full_name']}*")
        st.markdown(f"**Equipo:** {stats['team']}")
        st.markdown(f"**Pais:** {stats['country']}")
        st.markdown(f"**Edad:** {stats['age']} anos")
        st.markdown(f"**Mapas jugados:** {stats['maps_played']}")
        st.markdown(
            "_donk es ampliamente considerado uno de los mejores jugadores de CS2 del mundo. "
            "Conocido por su rifling agresivo, punteria excepcional y rendimiento de elite "
            "constante en la escena internacional con Team Spirit._"
        )

    with col_badge:
        st.markdown(
            """
            <div style='background:#1a1a2e;border-radius:12px;padding:18px;text-align:center;'>
              <span style='color:#f0c040;font-size:22px;font-weight:bold;'>donk</span><br/>
              <span style='color:#aaa;font-size:13px;'>Team Spirit</span>
            </div>
            """,
            unsafe_allow_html=True,
        )

    st.markdown("---")

    # --- Tarjetas de metricas clave (KPI) ------------------------
    st.subheader("Indicadores Clave de Rendimiento")
    c1, c2, c3, c4 = st.columns(4)

    with c1:
        st.metric(
            label="Rating 2.0",
            value=f"{stats['rating']:.2f}",
            delta=f"+{stats['rating'] - PRO_AVERAGES['rating']:.2f} vs promedio pro",
        )
    with c2:
        st.metric(
            label="Ratio K/D",
            value=f"{stats['kd_ratio']:.2f}",
            delta=f"+{stats['kd_ratio'] - PRO_AVERAGES['kd_ratio']:.2f} vs promedio pro",
        )
    with c3:
        st.metric(
            label="ADR",
            value=f"{stats['adr']:.1f}",
            delta=f"+{stats['adr'] - PRO_AVERAGES['adr']:.1f} vs promedio pro",
        )
    with c4:
        st.metric(label="Mapas Jugados", value=str(stats["maps_played"]))

    st.markdown("---")
    st.caption(
        f"Fuente de datos: {stats['data_source']} | Estado API: `{stats['api_status']}`"
    )
