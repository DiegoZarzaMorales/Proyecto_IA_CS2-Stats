"""server.py

Backend Flask (solo FACEIT) + sirve el SPA compilado (Vite/React).

Requiere:
- FACEIT_API_KEY en variables de entorno o en .env (misma carpeta que este archivo)
"""

import os
from typing import Any, Dict, Optional

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

from faceit_client import FaceitClient, FaceitError


PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
DOTENV_PATH = os.path.join(PROJECT_ROOT, ".env")
FIGMA_FRONTEND_PATH = os.path.join(PROJECT_ROOT, "FigmaFrontEnd", "dist")


def _load_dotenv_fallback(dotenv_path: str = DOTENV_PATH) -> None:
    """Carga un .env simple sin dependencias.

    - Ignora líneas vacías y comentarios (#)
    - No sobreescribe variables ya existentes
    """

    try:
        if not os.path.exists(dotenv_path):
            return

        with open(dotenv_path, "r", encoding="utf-8") as f:
            for raw_line in f:
                line = raw_line.strip()
                if not line or line.startswith("#"):
                    continue
                if "=" not in line:
                    continue

                key, value = line.split("=", 1)
                key = key.strip()
                value = value.strip().strip('"').strip("'")
                if not key:
                    continue
                if os.environ.get(key) is None:
                    os.environ[key] = value
    except Exception:
        return


def _load_dotenv() -> None:
    """Carga .env con python-dotenv si está disponible; si no, usa fallback."""

    try:
        from dotenv import load_dotenv  # type: ignore

        load_dotenv(DOTENV_PATH, override=False)
        return
    except Exception:
        _load_dotenv_fallback(DOTENV_PATH)


_load_dotenv()

app = Flask(__name__)
CORS(app)


faceit: Optional[FaceitClient] = None


def ensure_faceit_client() -> Optional[FaceitClient]:
    """Inicializa FaceitClient en forma lazy y re-lee .env si hace falta."""

    global faceit
    if faceit is not None:
        return faceit

    _load_dotenv()
    faceit = FaceitClient.from_env()
    return faceit


def _safe_int(value: Any, default: int = 0) -> int:
    try:
        return int(float(value))
    except Exception:
        return default


def _safe_float(value: Any) -> Optional[float]:
    try:
        if value in (None, ""):
            return None
        return float(value)
    except Exception:
        return None


def _extract_faceit_player_stats(match_stats: Dict[str, Any], player_id: str) -> Optional[Dict[str, Any]]:
    """Extrae stats del jugador desde /matches/{id}/stats (estructura variable)."""

    rounds = (match_stats or {}).get("rounds") or []
    for rnd in rounds:
        teams = rnd.get("teams") or []
        for team in teams:
            players = team.get("players") or []
            for player in players:
                if player.get("player_id") != player_id:
                    continue

                ps = player.get("player_stats") or {}

                def pick(*keys: str) -> Any:
                    for k in keys:
                        if k in ps and ps[k] not in (None, ""):
                            return ps[k]
                    return None

                def pick_loose(side: str, stat: str) -> Any:
                    """Intento best-effort para llaves variables en FACEIT.

                    side: 't' o 'ct'
                    stat: 'kills' | 'deaths' | 'adr' | 'kd'
                    """

                    side_l = side.lower()
                    stat_l = stat.lower()

                    candidates: list[str] = []
                    if stat_l == "kills":
                        candidates = [
                            f"{side.upper()} Kills",
                            f"Kills ({side.upper()})",
                            f"Kills {side.upper()}",
                            f"{side.upper()}_kills",
                        ]
                    elif stat_l == "deaths":
                        candidates = [
                            f"{side.upper()} Deaths",
                            f"Deaths ({side.upper()})",
                            f"Deaths {side.upper()}",
                            f"{side.upper()}_deaths",
                        ]
                    elif stat_l == "adr":
                        candidates = [
                            f"ADR ({side.upper()})",
                            f"{side.upper()} ADR",
                            f"Average Damage per Round ({side.upper()})",
                            f"{side.upper()}_adr",
                        ]
                    elif stat_l in ("kd", "kdr"):
                        candidates = [
                            f"K/D Ratio ({side.upper()})",
                            f"{side.upper()} K/D Ratio",
                            f"KD ({side.upper()})",
                            f"{side.upper()}_kd",
                        ]

                    val = pick(*candidates)
                    if val not in (None, ""):
                        return val

                    # Fallback heurístico por nombre (evita confundir con "Total")
                    for k, v in ps.items():
                        if v in (None, ""):
                            continue
                        kl = str(k).strip().lower()
                        if "total" in kl:
                            continue
                        if stat_l == "kills" and "kill" not in kl:
                            continue
                        if stat_l == "deaths" and "death" not in kl:
                            continue
                        if stat_l == "adr" and "adr" not in kl and "damage" not in kl:
                            continue
                        if stat_l in ("kd", "kdr") and "k/d" not in kl and "kd" not in kl:
                            continue

                        # patrones típicos: "t ...", "ct ...", "... (t)", "... (ct)"
                        if kl.startswith(f"{side_l} ") or f"({side_l})" in kl or f" {side_l} " in kl:
                            return v

                    return None

                kills = pick("Kills", "kills")
                deaths = pick("Deaths", "deaths")
                assists = pick("Assists", "assists")
                adr = pick("ADR", "Average Damage per Round")
                hs_pct = pick("Headshots %", "HS %", "Headshots")
                kd = pick("K/D Ratio", "K/D", "KD")

                t_kills = pick_loose("t", "kills")
                t_deaths = pick_loose("t", "deaths")
                t_adr = pick_loose("t", "adr")
                t_kd = pick_loose("t", "kd")

                ct_kills = pick_loose("ct", "kills")
                ct_deaths = pick_loose("ct", "deaths")
                ct_adr = pick_loose("ct", "adr")
                ct_kd = pick_loose("ct", "kd")

                return {
                    "kills": _safe_int(kills, 0),
                    "deaths": _safe_int(deaths, 0),
                    "assists": _safe_int(assists, 0),
                    "adr": _safe_float(adr),
                    "headshot_pct": _safe_float(hs_pct),
                    "kd_ratio": _safe_float(kd),
                    "nickname": player.get("nickname"),
                    "t": {
                        "kills": _safe_int(t_kills, 0) if t_kills not in (None, "") else None,
                        "deaths": _safe_int(t_deaths, 0) if t_deaths not in (None, "") else None,
                        "adr": _safe_float(t_adr),
                        "kd_ratio": _safe_float(t_kd),
                    },
                    "ct": {
                        "kills": _safe_int(ct_kills, 0) if ct_kills not in (None, "") else None,
                        "deaths": _safe_int(ct_deaths, 0) if ct_deaths not in (None, "") else None,
                        "adr": _safe_float(ct_adr),
                        "kd_ratio": _safe_float(ct_kd),
                    },
                }

    return None


@app.get("/api/faceit/status")
def faceit_status():
    client = ensure_faceit_client()
    api_key_configured = bool((os.environ.get("FACEIT_API_KEY") or "").strip())
    return jsonify(
        {
            "enabled": bool(client),
            "api_key_configured": api_key_configured,
            "message": None
            if api_key_configured
            else "FACEIT_API_KEY no configurada; configura la variable de entorno o .env y reinicia el backend",
        }
    )


@app.get("/api/faceit/search")
def faceit_search():
    """Autocomplete de nicknames (3+ chars)."""

    client = ensure_faceit_client()
    if not client:
        return jsonify({"error": "FACEIT_API_KEY no configurada"}), 400

    query = (request.args.get("q") or "").strip()
    game = (request.args.get("game") or "cs2").strip().lower()
    limit = _safe_int(request.args.get("limit"), default=8)
    limit = max(1, min(limit, 15))

    if len(query) < 3:
        return jsonify({"items": []})

    try:
        res = client.search_players(nickname=query, game=game, limit=limit, offset=0)
        items = res.get("items", []) or []
        out = []
        for it in items:
            games_field = it.get("games")
            if isinstance(games_field, dict):
                games = list(games_field.keys())
            elif isinstance(games_field, list):
                games = [g.get("name") for g in games_field if isinstance(g, dict) and g.get("name")]
            else:
                games = []

            out.append(
                {
                    "nickname": it.get("nickname"),
                    "player_id": it.get("player_id"),
                    "country": it.get("country"),
                    "avatar": it.get("avatar"),
                    "games": games,
                }
            )
        return jsonify({"items": out})
    except FaceitError as e:
        return jsonify({"error": str(e)}), 502


@app.get("/api/faceit/player")
def faceit_player():
    """Resuelve un jugador de FACEIT por nickname o por steamid64."""

    client = ensure_faceit_client()
    if not client:
        return jsonify({"error": "FACEIT_API_KEY no configurada"}), 400

    nickname = (request.args.get("nickname") or "").strip()
    steamid = (request.args.get("steamid") or "").strip()
    game = (request.args.get("game") or "cs2").strip().lower()

    if not nickname and not steamid:
        return jsonify({"error": "Provee nickname o steamid"}), 400

    try:
        if steamid:
            try:
                player = client.get_player_by_game_player_id(game=game, game_player_id=steamid)
            except FaceitError:
                if game != "csgo":
                    player = client.get_player_by_game_player_id(game="csgo", game_player_id=steamid)
                else:
                    raise
        else:
            try:
                player = client.get_player_by_nickname(nickname, game=game)
            except FaceitError:
                if game != "csgo":
                    player = client.get_player_by_nickname(nickname, game="csgo")
                else:
                    player = client.get_player_by_nickname(nickname)

        return jsonify(
            {
                "player_id": player.get("player_id"),
                "nickname": player.get("nickname"),
                "avatar": player.get("avatar"),
                "country": player.get("country"),
                "games": list((player.get("games") or {}).keys()) if isinstance(player.get("games"), dict) else player.get("games"),
                "raw": player,
            }
        )

    except FaceitError as e:
        return jsonify({"error": str(e)}), 502


@app.get("/api/faceit/summary")
def faceit_summary():
    """Resumen: lifetime + últimos matches."""

    client = ensure_faceit_client()
    if not client:
        return jsonify({"error": "FACEIT_API_KEY no configurada"}), 400

    nickname = (request.args.get("nickname") or "").strip()
    steamid = (request.args.get("steamid") or "").strip()
    game = (request.args.get("game") or "cs2").strip().lower()
    limit = _safe_int(request.args.get("limit"), default=10)
    limit = max(1, min(limit, 20))

    if not nickname and not steamid:
        return jsonify({"error": "Provee nickname o steamid"}), 400

    try:
        if steamid:
            try:
                player = client.get_player_by_game_player_id(game=game, game_player_id=steamid)
            except FaceitError:
                if game != "csgo":
                    player = client.get_player_by_game_player_id(game="csgo", game_player_id=steamid)
                    game = "csgo"
                else:
                    raise
        else:
            try:
                player = client.get_player_by_nickname(nickname, game=game)
            except FaceitError:
                if game != "csgo":
                    player = client.get_player_by_nickname(nickname, game="csgo")
                    game = "csgo"
                else:
                    player = client.get_player_by_nickname(nickname)

        player_id = player.get("player_id")
        if not player_id:
            return jsonify({"error": "FACEIT player_id missing"}), 502

        stats = client.get_player_stats(player_id=player_id, game=game)
        lifetime = stats.get("lifetime", {}) or {}

        history = client.get_player_history(player_id=player_id, game=game, limit=limit)
        items = history.get("items", []) or []

        matches = []
        for it in items:
            matches.append(
                {
                    "match_id": it.get("match_id"),
                    "game_id": it.get("game_id"),
                    "competition_name": it.get("competition_name"),
                    "competition_type": it.get("competition_type"),
                    "match_type": it.get("match_type"),
                    "played_at": it.get("played_at"),
                    "finished_at": it.get("finished_at"),
                    "results": it.get("results"),
                }
            )

        return jsonify(
            {
                "game": game,
                "player": {
                    "player_id": player_id,
                    "nickname": player.get("nickname"),
                    "avatar": player.get("avatar"),
                    "country": (player.get("country") or "").lower() if player.get("country") else None,
                },
                "lifetime": {
                    "matches": lifetime.get("Matches"),
                    "wins": lifetime.get("Wins"),
                    "winrate": lifetime.get("Win Rate %"),
                    "kdr": lifetime.get("K/D Ratio"),
                    "adr": lifetime.get("ADR"),
                    "hs_pct": lifetime.get("Headshots %"),
                    "kr": lifetime.get("K/R Ratio"),
                    "current_win_streak": lifetime.get("Current Win Streak"),
                    "longest_win_streak": lifetime.get("Longest Win Streak"),
                },
                "recent_matches": matches,
            }
        )

    except FaceitError as e:
        return jsonify({"error": str(e)}), 502


@app.get("/api/faceit/latest-match")
def faceit_latest_match():
    """Última partida real con stats del jugador (si existe)."""

    client = ensure_faceit_client()
    if not client:
        return jsonify({"error": "FACEIT_API_KEY no configurada"}), 400

    nickname = (request.args.get("nickname") or "").strip()
    steamid = (request.args.get("steamid") or "").strip()
    game = (request.args.get("game") or "cs2").strip().lower()

    if not nickname and not steamid:
        return jsonify({"error": "Provee nickname o steamid"}), 400

    try:
        if steamid:
            player = client.get_player_by_game_player_id(game=game, game_player_id=steamid)
        else:
            try:
                player = client.get_player_by_nickname(nickname, game=game)
            except FaceitError:
                if game != "csgo":
                    player = client.get_player_by_nickname(nickname, game="csgo")
                    game = "csgo"
                else:
                    player = client.get_player_by_nickname(nickname)

        player_id = player.get("player_id")
        if not player_id:
            return jsonify({"error": "FACEIT player_id missing"}), 502

        history = client.get_player_history(player_id=player_id, game=game, limit=1)
        items = history.get("items", []) or []
        if not items:
            return jsonify({"error": "No match history"}), 404

        match_id = (items[0] or {}).get("match_id")
        if not match_id:
            return jsonify({"error": "No match_id"}), 502

        details = client.get_match_details(match_id=match_id)
        stats = client.get_match_stats(match_id=match_id)
        player_stats = _extract_faceit_player_stats(stats, player_id)

        return jsonify(
            {
                "match_id": match_id,
                "competition_name": details.get("competition_name"),
                "competition_type": details.get("competition_type"),
                "game": details.get("game"),
                "region": details.get("region"),
                "map": (details.get("voting") or {}).get("map")
                or (details.get("voting") or {}).get("picked")
                or None,
                "started_at": details.get("started_at"),
                "finished_at": details.get("finished_at"),
                "player": {
                    "player_id": player_id,
                    "nickname": player.get("nickname"),
                    "avatar": player.get("avatar"),
                },
                "stats": player_stats,
            }
        )

    except FaceitError as e:
        return jsonify({"error": str(e)}), 502


@app.get("/assets/<path:filename>")
def serve_assets(filename: str):
    return send_from_directory(os.path.join(FIGMA_FRONTEND_PATH, "assets"), filename)


@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_frontend(path: str):
    if path.startswith("api/"):
        return jsonify({"error": "Not found"}), 404

    file_path = os.path.join(FIGMA_FRONTEND_PATH, path)
    if path and os.path.isfile(file_path):
        return send_from_directory(FIGMA_FRONTEND_PATH, path)

    return send_from_directory(FIGMA_FRONTEND_PATH, "index.html")


if __name__ == "__main__":
    print("FACEIT Dashboard")
    print("http://localhost:5000")
    app.run(debug=True, host="0.0.0.0", port=5000)
