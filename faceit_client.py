"""faceit_client.py

Cliente mínimo para FACEIT Open API.
Base URL: https://open.faceit.com/data/v4/

No guarda credenciales en disco: espera `FACEIT_API_KEY` (y opcional `FACEIT_APP_ID`) por variable de entorno.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Any, Dict, Optional

import requests


class FaceitError(RuntimeError):
    def __init__(self, message: str, *, status_code: Optional[int] = None, path: Optional[str] = None):
        super().__init__(message)
        self.status_code = status_code
        self.path = path


@dataclass(frozen=True)
class FaceitConfig:
    api_key: str
    app_id: Optional[str] = None
    base_url: str = "https://open.faceit.com/data/v4"


class FaceitClient:
    def __init__(self, config: FaceitConfig):
        self._config = config
        self._session = requests.Session()
        self._session.headers.update(
            {
                "Authorization": f"Bearer {config.api_key}",
                "Accept": "application/json",
                "User-Agent": "ProyectoDeIA/1.0 (+Flask) faceit-client",
            }
        )
        if config.app_id:
            # No documentado en todos los planes, pero es harmless si existe
            self._session.headers.update({"X-APP-ID": config.app_id})

    @staticmethod
    def from_env() -> Optional["FaceitClient"]:
        api_key = os.environ.get("FACEIT_API_KEY")
        if not api_key:
            return None
        app_id = os.environ.get("FACEIT_APP_ID")
        return FaceitClient(FaceitConfig(api_key=api_key, app_id=app_id))

    def _get(self, path: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        url = f"{self._config.base_url}{path}"
        try:
            r = self._session.get(url, params=params or {}, timeout=20)
        except requests.RequestException as e:
            raise FaceitError(f"FACEIT request failed: {e}") from e

        if r.status_code == 429:
            raise FaceitError("FACEIT rate limit (429)")

        if not r.ok:
            raise FaceitError(
                f"FACEIT HTTP {r.status_code} for {path}",
                status_code=r.status_code,
                path=path,
            )

        try:
            return r.json()
        except ValueError as e:
            raise FaceitError("FACEIT returned non-JSON response") from e

    # -------------------- Players --------------------

    def get_player_by_nickname(self, nickname: str, *, game: Optional[str] = None) -> Dict[str, Any]:
        """GET /players?nickname=...

        Algunos entornos responden mejor sin `game` (como en tu ejemplo con donk).
        Otros pueden requerirlo. Por eso hacemos fallback.
        """
        nickname = nickname.strip()
        if not nickname:
            raise FaceitError("Nickname vacío")

        if game:
            try:
                return self._get("/players", params={"nickname": nickname, "game": game})
            except FaceitError as e:
                # fallback al endpoint sin `game`
                if e.status_code in (400, 404):
                    return self._get("/players", params={"nickname": nickname})
                raise

        return self._get("/players", params={"nickname": nickname})

    def get_player_by_game_player_id(self, *, game: str, game_player_id: str) -> Dict[str, Any]:
        # game_player_id para Steam suele ser steamid64
        return self._get(
            "/players",
            params={
                "game": game,
                "game_player_id": game_player_id,
            },
        )

    def search_players(self, *, nickname: str, game: str = "cs2", limit: int = 10, offset: int = 0) -> Dict[str, Any]:
        # Endpoint de búsqueda (autocomplete)
        return self._get(
            "/search/players",
            params={
                "nickname": nickname,
                "game": game,
                "limit": limit,
                "offset": offset,
            },
        )

    def get_player_stats(self, *, player_id: str, game: str) -> Dict[str, Any]:
        return self._get(f"/players/{player_id}/stats/{game}")

    def get_player_history(self, *, player_id: str, game: str, limit: int = 10, offset: int = 0) -> Dict[str, Any]:
        return self._get(
            f"/players/{player_id}/history",
            params={
                "game": game,
                "offset": offset,
                "limit": limit,
            },
        )

    # -------------------- Matches --------------------

    def get_match_details(self, *, match_id: str) -> Dict[str, Any]:
        return self._get(f"/matches/{match_id}")

    def get_match_stats(self, *, match_id: str) -> Dict[str, Any]:
        # En FACEIT v4: /matches/{match_id}/stats
        return self._get(f"/matches/{match_id}/stats")


def pick_stat(stats: Dict[str, Any], *keys: str) -> Optional[str]:
    """Devuelve el primer valor existente dentro de `stats` para las llaves candidatas."""
    for k in keys:
        if k in stats and stats[k] not in (None, ""):
            return str(stats[k])
    return None
