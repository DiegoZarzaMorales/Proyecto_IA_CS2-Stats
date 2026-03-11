"""
modules/tabs/statistics.py
==========================
Tab 2 - Estadisticas.
Muestra un DataFrame de pandas formateado que compara las metricas de donk
contra el promedio profesional, mas tablas separadas de ofensiva y precision.
"""

import pandas as pd
import streamlit as st

from config import PRO_AVERAGES


# Etiquetas de referencia para clasificar cada metrica
_LABEL_ELITE = "Elite"
_LABEL_ABOVE = "Por encima del promedio"
_LABEL_AVG   = "Promedio"
_LABEL_BELOW = "Por debajo del promedio"


def _benchmark(metric: str, value: float, average: float) -> str:
    """
    Devuelve una etiqueta de referencia segun la desviacion del valor respecto al promedio.
    Para Muertes por Ronda (DPR), un valor menor es mejor, por lo que el delta se invierte.
    """
    if "dpr" in metric.lower() or "muerte" in metric.lower() or "death" in metric.lower():
        diff = average - value  # positivo significa menos muertes
    else:
        diff = value - average

    if diff >= 0.20 or diff >= 10:
        return _LABEL_ELITE
    elif diff >= 0.05 or diff >= 3:
        return _LABEL_ABOVE
    elif diff >= -0.05 or diff >= -3:
        return _LABEL_AVG
    else:
        return _LABEL_BELOW


def render_statistics_tab(stats: dict) -> None:
    """Renderiza la pestana de Estadisticas."""
    st.header("Estadisticas de Rendimiento")
    st.markdown(
        "Vision general estadistica completa que compara las metricas de donk "
        "con el promedio profesional."
    )

    # --- Tabla resumen principal ---------------------------------
    metric_labels = [
        "Rating 2.0",
        "Eliminaciones por Ronda (KPR)",
        "Porcentaje de Headshots",
        "Puntuacion de Impacto",
        "Muertes por Ronda (DPR)",
        "Ratio K/D",
        "Dano Promedio por Ronda (ADR)",
    ]
    stat_keys = ["rating", "kpr", "headshot_pct", "impact", "dpr", "kd_ratio", "adr"]

    donk_values    = [stats[k] for k in stat_keys]
    average_values = [PRO_AVERAGES[k] for k in stat_keys]

    formatted_donk = [
        f"{stats['rating']:.2f}",
        f"{stats['kpr']:.2f}",
        f"{stats['headshot_pct']:.1f}%",
        f"{stats['impact']:.2f}",
        f"{stats['dpr']:.2f}",
        f"{stats['kd_ratio']:.2f}",
        f"{stats['adr']:.1f}",
    ]
    formatted_avg = ["1.00", "0.70", "45.0%", "1.00", "0.70", "1.00", "70.0"]

    df_summary = pd.DataFrame(
        {
            "Metrica":          metric_labels,
            "donk":             formatted_donk,
            "Promedio Pro":     formatted_avg,
            "Clasificacion":    [
                _benchmark(label, val, avg)
                for label, val, avg in zip(metric_labels, donk_values, average_values)
            ],
        }
    )

    st.dataframe(df_summary, width='stretch', hide_index=True)
    st.markdown("---")

    # --- Tablas divididas por columnas ---------------------------
    col_off, col_prec = st.columns(2)

    with col_off:
        st.subheader("Metricas Ofensivas")
        df_off = pd.DataFrame(
            {
                "Metrica":      ["Rating 2.0", "KPR", "ADR", "Impacto", "K/D"],
                "donk":         [
                    stats["rating"],
                    stats["kpr"],
                    stats["adr"],
                    stats["impact"],
                    stats["kd_ratio"],
                ],
                "Prom. Pro":    [1.00, 0.70, 70.0, 1.00, 1.00],
            }
        )
        st.dataframe(df_off, hide_index=True, width='stretch')

    with col_prec:
        st.subheader("Precision y Supervivencia")
        df_prec = pd.DataFrame(
            {
                "Metrica":  ["Headshot %", "Muertes por Ronda"],
                "donk":     [
                    f"{stats['headshot_pct']:.1f}%",
                    f"{stats['dpr']:.2f}",
                ],
                "Prom. Pro": ["45.0%", "0.70"],
            }
        )
        st.dataframe(df_prec, hide_index=True, width='stretch')
