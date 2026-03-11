"""
modules/tabs/ai_analysis.py
============================
Tab 3 - Analisis con IA.
Genera un dataset sintetico de jugadores profesionales, aplica clustering
K-Means para identificar niveles de rendimiento y clasifica a donk dentro
del espacio de clusters resultante.
"""

import numpy as np
import pandas as pd
import streamlit as st
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler


def render_ai_tab(stats: dict) -> None:
    """Renderiza la pestana de Analisis con Inteligencia Artificial."""
    st.header("Analisis de Rendimiento con IA")
    st.markdown(
        """
        Este modulo utiliza **clustering K-Means** (aprendizaje automatico no supervisado) para
        identificar patrones de comportamiento en un dataset sintetico de perfiles de jugadores
        profesionales de CS2. Las estadisticas reales de donk se proyectan sobre el espacio de
        clusters para determinar su nivel de rendimiento.

        **Variables utilizadas:** eliminaciones por ronda, puntuacion de impacto, rating 2.0
        """
    )
    st.markdown("---")

    # --- Construccion del dataset sintetico ----------------------
    rng = np.random.default_rng(42)

    n_avg, n_good, n_elite = 40, 40, 20

    kills = np.concatenate([
        rng.normal(0.64, 0.05, n_avg),   # nivel promedio
        rng.normal(0.77, 0.04, n_good),  # nivel bueno
        rng.normal(0.91, 0.04, n_elite), # nivel elite
    ])
    impact = np.concatenate([
        rng.normal(0.88, 0.07, n_avg),
        rng.normal(1.10, 0.07, n_good),
        rng.normal(1.46, 0.08, n_elite),
    ])
    rating = np.concatenate([
        rng.normal(0.96, 0.05, n_avg),
        rng.normal(1.10, 0.05, n_good),
        rng.normal(1.31, 0.05, n_elite),
    ])

    df_players = pd.DataFrame(
        {
            "kills_por_ronda": kills,
            "impacto":         impact,
            "rating":          rating,
        }
    )

    # --- Aplicar clustering K-Means ------------------------------
    scaler   = StandardScaler()
    X_scaled = scaler.fit_transform(df_players)

    kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
    df_players["cluster"] = kmeans.fit_predict(X_scaled)

    # Mapear IDs de cluster a niveles legibles ordenados por rating promedio
    cluster_order = (
        df_players.groupby("cluster")["rating"]
        .mean()
        .sort_values()
        .index.tolist()
    )
    tier_map = {
        cluster_order[0]: "Promedio",
        cluster_order[1]: "Bueno",
        cluster_order[2]: "Elite",
    }
    df_players["nivel_rendimiento"] = df_players["cluster"].map(tier_map)

    # --- Clasificar a donk ---------------------------------------
    donk_features = np.array([[stats["kpr"], stats["impact"], stats["rating"]]])
    donk_scaled   = scaler.transform(donk_features)
    donk_cluster  = kmeans.predict(donk_scaled)[0]
    donk_tier     = tier_map[donk_cluster]

    # --- Mostrar el dataset --------------------------------------
    st.subheader("Dataset Sintetico de Jugadores con Etiquetas de Cluster")
    st.markdown(
        f"Dataset: **{len(df_players)} perfiles sinteticos de jugadores profesionales** — "
        "agrupados por nivel de rendimiento detectado."
    )

    display_df = (
        df_players[["kills_por_ronda", "impacto", "rating", "nivel_rendimiento"]]
        .round(3)
        .rename(columns={
            "kills_por_ronda":   "KPR",
            "impacto":           "Impacto",
            "rating":            "Rating",
            "nivel_rendimiento": "Nivel de Rendimiento",
        })
    )
    st.dataframe(display_df, width='stretch', hide_index=True)

    st.markdown("---")

    # --- Resultado de clasificacion de donk ----------------------
    st.subheader("Nivel de Rendimiento Predicho por IA para donk")

    c1, c2, c3 = st.columns(3)
    with c1:
        st.metric("KPR (entrada)",     f"{stats['kpr']:.2f}")
    with c2:
        st.metric("Impacto (entrada)", f"{stats['impact']:.2f}")
    with c3:
        st.metric("Rating (entrada)",  f"{stats['rating']:.2f}")

    if donk_tier == "Elite":
        st.success(
            f"El clustering K-Means clasifica a donk como nivel **{donk_tier}** — "
            "el cluster de mayor rendimiento en el dataset."
        )
    elif donk_tier == "Bueno":
        st.info(
            f"El clustering K-Means clasifica a donk como nivel **{donk_tier}**."
        )
    else:
        st.warning(
            f"El clustering K-Means clasifica a donk como nivel **{donk_tier}**."
        )

    # --- Tabla resumen de clusters -------------------------------
    st.markdown("---")
    st.subheader("Estadisticas Resumidas por Cluster")
    cluster_summary = (
        df_players
        .groupby("nivel_rendimiento")[["kills_por_ronda", "impacto", "rating"]]
        .mean()
        .round(3)
        .reset_index()
        .rename(columns={
            "nivel_rendimiento": "Nivel de Rendimiento",
            "kills_por_ronda":   "KPR Promedio",
            "impacto":           "Impacto Promedio",
            "rating":            "Rating Promedio",
        })
    )
    st.dataframe(cluster_summary, width='stretch', hide_index=True)

    st.markdown(
        """
        **Definicion de clusters:**
        - **Promedio** — Estadisticas tipicas de un jugador profesional (rating ~0.90-1.05)
        - **Bueno** — Jugadores por encima del promedio (rating ~1.05-1.20)
        - **Elite** — Superestrellas de nivel mundial (rating > 1.25)

        *El clustering se realiza con K-Means usando variables estandarizadas (normalizacion z-score).*
        """
    )
