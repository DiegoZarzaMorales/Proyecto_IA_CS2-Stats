"""
modules/tabs/recommendations.py
================================
Tab 4 - Recomendaciones de Rendimiento.
Recomendaciones inteligentes basadas en reglas derivadas de las estadisticas de donk.
Cada insight esta vinculado a un umbral especifico de la metrica correspondiente.
"""

import streamlit as st


def render_recommendations_tab(stats: dict) -> None:
    """Renderiza la pestana de Recomendaciones de Rendimiento."""
    st.header("Recomendaciones de Rendimiento")
    st.markdown(
        "El motor de analisis genera insights especificos basados en el perfil estadistico de donk. "
        "Cada recomendacion se deriva de umbrales estandar de rendimiento en CS2 profesional."
    )
    st.markdown("---")

    # --- Rating general ------------------------------------------
    st.subheader("Rating General")
    if stats["rating"] > 1.20:
        st.success(
            f"Nivel de Rendimiento Elite — Rating 2.0: **{stats['rating']:.2f}**\n\n"
            f"El rating de donk es {stats['rating'] - 1.00:.2f} puntos por encima de la "
            "linea base profesional de 1.00. Esto lo ubica en el top 1% de jugadores "
            "profesionales a nivel mundial. Mantener esta consistencia en eventos LAN "
            "de alta presion es su objetivo estrategico principal."
        )
    elif stats["rating"] > 1.10:
        st.info(
            f"Rating por encima del promedio — {stats['rating']:.2f}. "
            "Rendimiento solido muy por encima del promedio profesional."
        )
    else:
        st.warning(
            f"Rating profesional solido — {stats['rating']:.2f}. "
            "Enfocarse en la consistencia en distintos mapas para alcanzar el nivel elite."
        )

    st.markdown("---")

    # --- Porcentaje de headshots ---------------------------------
    st.subheader("Precision y Punteria")
    if stats["headshot_pct"] < 40:
        st.warning(
            f"Se sugiere mejorar la precision — HS%: **{stats['headshot_pct']:.1f}%**\n\n"
            "Un porcentaje de headshots menor al 40% puede indicar problemas de "
            "posicionamiento del crosshair. Se recomienda rutinas de deathmatch "
            "enfocadas en mantener el crosshair a nivel de la cabeza."
        )
    elif stats["headshot_pct"] >= 50:
        st.success(
            f"Precision Excepcional — HS%: **{stats['headshot_pct']:.1f}%**\n\n"
            "Un porcentaje de headshots superior al 50% refleja un posicionamiento de "
            "crosshair de nivel elite. donk consigue eliminaciones limpias con el primer "
            "disparo de forma consistente, minimizando el tiempo de eliminacion."
        )
    else:
        st.info(
            f"Precision Solida — HS%: {stats['headshot_pct']:.1f}%, "
            "por encima del promedio profesional del 45%."
        )

    st.markdown("---")

    # --- Eliminaciones por ronda ---------------------------------
    st.subheader("Capacidad de Entry Fragging")
    if stats["kpr"] > 0.80:
        st.success(
            f"Fuerte Capacidad de Entry Fragging — KPR: **{stats['kpr']:.2f}**\n\n"
            "Mas de 0.80 eliminaciones por ronda indica un estilo de juego ofensivo y "
            "altamente efectivo. donk crea espacio y consigue picks iniciales de forma "
            "constante, habilitando las ejecuciones de Team Spirit."
        )
    elif stats["kpr"] > 0.70:
        st.info(
            f"Fragging por encima del promedio — KPR: {stats['kpr']:.2f}. "
            "Fragger confiable por encima de la linea base profesional de 0.70."
        )
    else:
        st.warning(
            f"KPR: {stats['kpr']:.2f} — Considerar posicionamientos mas agresivos "
            "y buscar mas duelos de apertura para aumentar la contribucion por ronda."
        )

    st.markdown("---")

    # --- Puntuacion de impacto -----------------------------------
    st.subheader("Impacto en la Ronda")
    if stats["impact"] > 1.40:
        st.success(
            f"Jugador de Alto Impacto — Impacto: **{stats['impact']:.2f}**\n\n"
            "Una puntuacion de impacto superior a 1.40 refleja la capacidad de donk para "
            "convertir rondas con multiples eliminaciones, situaciones de clutch y picks "
            "iniciales que deciden directamente el resultado. Team Spirit explota al "
            "maximo este rasgo en su sistema de juego."
        )
    elif stats["impact"] > 1.10:
        st.info(
            f"Impacto por encima del promedio — {stats['impact']:.2f}. "
            "Contribuciones significativas por encima de la linea base profesional."
        )
    else:
        st.warning(
            "Enfocarse en trades, multiples eliminaciones y situaciones de clutch para "
            "mejorar la puntuacion de impacto."
        )

    st.markdown("---")

    # --- Muertes por ronda ---------------------------------------
    st.subheader("Supervivencia y Posicionamiento")
    if stats["dpr"] < 0.65:
        st.success(
            f"Excelente Tasa de Supervivencia — DPR: **{stats['dpr']:.2f}**\n\n"
            "Morir menos de 0.65 veces por ronda manteniendo una agresividad elite "
            "demuestra una lectura superior del juego y disciplina posicional. "
            "donk equilibra jugadas de alto riesgo con desconexiones inteligentes."
        )
    elif stats["dpr"] <= 0.72:
        st.info(
            f"DPR a nivel profesional — {stats['dpr']:.2f}, "
            "dentro del rango normal para riflers agresivos."
        )
    else:
        st.warning(
            f"DPR: {stats['dpr']:.2f} — Reducir muertes innecesarias mediante mejoras "
            "en el pre-aim y el uso de utilidades puede elevar aun mas el rating general."
        )

    st.markdown("---")

    # --- Resumen ejecutivo ---------------------------------------
    st.subheader("Resumen Ejecutivo")
    st.markdown(
        f"""
        | Dimension          | Valor                           | Clasificacion |
        |--------------------|---------------------------------|---------------|
        | Rating General     | {stats['rating']:.2f}           | Elite         |
        | Punteria / Precision | {stats['headshot_pct']:.1f}% HS | Elite        |
        | Entry Fragging     | {stats['kpr']:.2f} KPR          | Elite         |
        | Impacto en Ronda   | {stats['impact']:.2f}           | Elite         |
        | Supervivencia      | {stats['dpr']:.2f} DPR          | Elite         |

        donk demuestra **rendimiento de nivel elite en todas las dimensiones medibles**.
        Su rara combinacion de agresividad, precision y lectura del juego lo convierte en
        uno de los fraggers mas completos en el CS2 competitivo moderno.

        **Recomendaciones estrategicas:**
        1. Mantener la consistencia actual y la disciplina en el pool de mapas.
        2. Continuar aprovechando los duelos de rifle dada la alta tasa de exito estadistico.
        3. Usar la ventaja de impacto para anclar rondas de clutch en Team Spirit.
        4. Monitorear el DPR en torneos prolongados donde la fatiga puede afectar el posicionamiento.
        """
    )
