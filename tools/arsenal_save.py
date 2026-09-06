#!/usr/bin/env python3
"""Parser and writer for A.R.S.E.N.A.L Extended Power (.G) savegames."""

from __future__ import annotations

import argparse
import json
import struct
import sys
import zlib
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import List, Optional

OUTER_MAGIC = bytes([0x7E, 0xB5, 0xA3, 0xB8, 0xA7, 0xA9, 0xA3, 0xAF, 0xA7, 0x80, 0x00])
INNER_MAGIC = b"ARSENAL2.G"
ZLIB_LEVEL = 6

SCENARIO_OFFSET = 0x59
SCENARIO_SIZE = 30

NAME_SIZE = 20
FACTION_SIZE = 16
CITY_SIZE = 16
CITY_REL = 37  # bytes after resource block start
NAME_REL = -20
FACTION_REL = -36

# Signature just before HQ city: 00 e0 3f 00 00 00
CITY_PREFIX = b"\x00\xe0\x3f\x00\x00\x00"


@dataclass
class Player:
    index: int
    offset: int  # resource block start in decompressed payload
    faction: str
    name: str
    city: str
    resource1: int
    resource2: int
    resource3: int


@dataclass
class SaveGame:
    scenario: str
    players: List[Player]
    raw: bytes
    outer_magic: bytes


def _read_cstring(buf: bytes, offset: int, size: int) -> str:
    chunk = buf[offset : offset + size]
    return chunk.split(b"\x00", 1)[0].decode("latin-1", errors="replace")


def _write_cstring(buf: bytearray, offset: int, size: int, value: str) -> None:
    encoded = value.encode("latin-1", errors="replace")[: size - 1]
    field = encoded + b"\x00" * (size - len(encoded))
    buf[offset : offset + size] = field


def _extract_faction(buf: bytes, offset: int) -> str:
    """Faction field may start with 1 non-ASCII metadata byte."""
    chunk = buf[offset : offset + FACTION_SIZE]
    start = 0
    while start < len(chunk) and not (65 <= chunk[start] <= 90 or 97 <= chunk[start] <= 122):
        start += 1
    return chunk[start:].split(b"\x00", 1)[0].decode("latin-1", errors="replace")


def _write_faction(buf: bytearray, offset: int, value: str) -> None:
    chunk = bytes(buf[offset : offset + FACTION_SIZE])
    start = 0
    while start < len(chunk) and not (65 <= chunk[start] <= 90 or 97 <= chunk[start] <= 122):
        start += 1
    prefix = chunk[:start]
    room = FACTION_SIZE - start
    encoded = value.encode("latin-1", errors="replace")[: max(0, room - 1)]
    field = prefix + encoded + b"\x00" * (room - len(encoded))
    buf[offset : offset + FACTION_SIZE] = field[:FACTION_SIZE]


def decompress_save(data: bytes) -> tuple[bytes, bytes]:
    if len(data) < 19:
        raise ValueError("Arquivo muito pequeno para ser um save ARSENAL2")

    if data[:11] == OUTER_MAGIC:
        decomp_size, comp_size = struct.unpack_from("<II", data, 11)
        payload = data[19 : 19 + comp_size]
        raw = zlib.decompress(payload)
        if len(raw) != decomp_size:
            # Still usable, but warn via length mismatch tolerance
            pass
        outer = data[:11]
    elif data[:10] == INNER_MAGIC:
        raw = data
        outer = OUTER_MAGIC
    else:
        # Try raw zlib from common offsets
        for off in (0, 19):
            try:
                raw = zlib.decompress(data[off:])
                if raw[:10] == INNER_MAGIC:
                    return raw, data[:11] if off == 19 and len(data) >= 11 else OUTER_MAGIC
            except zlib.error:
                continue
        raise ValueError("Formato não reconhecido (esperado ARSENAL2.G zlib)")

    if raw[:10] != INNER_MAGIC:
        raise ValueError("Payload interno sem magia ARSENAL2.G")
    return raw, outer


def compress_save(raw: bytes, outer_magic: bytes = OUTER_MAGIC) -> bytes:
    compressed = zlib.compress(raw, ZLIB_LEVEL)
    return outer_magic[:11].ljust(11, b"\x00")[:11] + struct.pack("<II", len(raw), len(compressed)) + compressed


def find_players(raw: bytes) -> List[Player]:
    players: List[Player] = []
    start = 0
    while True:
        idx = raw.find(CITY_PREFIX, start)
        if idx < 0:
            break
        city_off = idx + len(CITY_PREFIX)
        if city_off + 3 > len(raw):
            start = idx + 1
            continue
        # City should be printable ASCII
        if not (65 <= raw[city_off] <= 90 or 97 <= raw[city_off] <= 122):
            start = idx + 1
            continue
        city = _read_cstring(raw, city_off, CITY_SIZE)
        if len(city) < 3 or not all(32 <= ord(c) < 127 for c in city):
            start = idx + 1
            continue

        res_off = city_off - CITY_REL
        if res_off < 40:
            start = idx + 1
            continue

        # Validate 00 00 00 00 padding before ff marker near resources
        # after resources: 16 bytes then 0xff
        if raw[res_off + 12 + 16] != 0xFF:
            start = idx + 1
            continue

        r1, r2, r3 = struct.unpack_from("<III", raw, res_off)
        name = _read_cstring(raw, res_off + NAME_REL, NAME_SIZE)
        faction = _extract_faction(raw, res_off + FACTION_REL)
        if len(name) < 2:
            start = idx + 1
            continue

        players.append(
            Player(
                index=len(players),
                offset=res_off,
                faction=faction,
                name=name,
                city=city,
                resource1=r1,
                resource2=r2,
                resource3=r3,
            )
        )
        start = city_off + 1

    return players


def load_save(data: bytes) -> SaveGame:
    raw, outer = decompress_save(data)
    scenario = _read_cstring(raw, SCENARIO_OFFSET, SCENARIO_SIZE)
    players = find_players(raw)
    return SaveGame(scenario=scenario, players=players, raw=raw, outer_magic=outer)


def apply_edits(save: SaveGame, *, scenario: Optional[str] = None, players: Optional[list] = None) -> bytes:
    buf = bytearray(save.raw)
    if scenario is not None:
        _write_cstring(buf, SCENARIO_OFFSET, SCENARIO_SIZE, scenario)

    if players:
        by_offset = {p.offset: p for p in save.players}
        for edit in players:
            offset = int(edit["offset"])
            if offset not in by_offset:
                raise ValueError(f"Jogador offset desconhecido: {offset}")
            if "name" in edit:
                _write_cstring(buf, offset + NAME_REL, NAME_SIZE, edit["name"])
            if "faction" in edit:
                _write_faction(buf, offset + FACTION_REL, edit["faction"])
            if "city" in edit:
                _write_cstring(buf, offset + CITY_REL, CITY_SIZE, edit["city"])
            resources = []
            for key in ("resource1", "resource2", "resource3"):
                if key in edit:
                    resources.append(True)
            if any(k in edit for k in ("resource1", "resource2", "resource3")):
                r1, r2, r3 = struct.unpack_from("<III", buf, offset)
                if "resource1" in edit:
                    r1 = int(edit["resource1"]) & 0xFFFFFFFF
                if "resource2" in edit:
                    r2 = int(edit["resource2"]) & 0xFFFFFFFF
                if "resource3" in edit:
                    r3 = int(edit["resource3"]) & 0xFFFFFFFF
                struct.pack_into("<III", buf, offset, r1, r2, r3)

    return compress_save(bytes(buf), save.outer_magic)


def save_to_dict(save: SaveGame) -> dict:
    return {
        "scenario": save.scenario,
        "player_count": len(save.players),
        "players": [asdict(p) for p in save.players],
    }


def main(argv: Optional[List[str]] = None) -> int:
    parser = argparse.ArgumentParser(description="Alterador de save A.R.S.E.N.A.L Extended Power")
    sub = parser.add_subparsers(dest="cmd", required=True)

    p_info = sub.add_parser("info", help="Mostra cenário e jogadores")
    p_info.add_argument("save", type=Path)

    p_json = sub.add_parser("json", help="Exporta metadados em JSON")
    p_json.add_argument("save", type=Path)

    p_edit = sub.add_parser("edit", help="Aplica edições a partir de um JSON")
    p_edit.add_argument("save", type=Path)
    p_edit.add_argument("-o", "--output", type=Path, required=True)
    p_edit.add_argument("--scenario", type=str)
    p_edit.add_argument("--set-resources", type=int, metavar="N", help="Define os 3 recursos de todos os jogadores")
    p_edit.add_argument("--player", type=int, help="Índice do jogador (0-based)")
    p_edit.add_argument("--name", type=str)
    p_edit.add_argument("--faction", type=str)
    p_edit.add_argument("--city", type=str)
    p_edit.add_argument("--r1", type=int)
    p_edit.add_argument("--r2", type=int)
    p_edit.add_argument("--r3", type=int)

    p_rt = sub.add_parser("roundtrip", help="Descomprime e recomprime sem editar (teste)")
    p_rt.add_argument("save", type=Path)
    p_rt.add_argument("-o", "--output", type=Path, required=True)

    args = parser.parse_args(argv)
    data = args.save.read_bytes()
    save = load_save(data)

    if args.cmd == "info":
        print(f"Cenário: {save.scenario}")
        print(f"Jogadores: {len(save.players)}")
        for p in save.players:
            print(
                f"  [{p.index}] {p.name:20} | {p.faction:12} | HQ {p.city:16} | "
                f"R {p.resource1}/{p.resource2}/{p.resource3}"
            )
        return 0

    if args.cmd == "json":
        json.dump(save_to_dict(save), sys.stdout, indent=2, ensure_ascii=False)
        print()
        return 0

    if args.cmd == "roundtrip":
        out = compress_save(save.raw, save.outer_magic)
        args.output.write_bytes(out)
        print(f"Escrito {args.output} ({len(out)} bytes), idêntico={out == data}")
        return 0

    if args.cmd == "edit":
        edits = []
        if args.set_resources is not None:
            for p in save.players:
                edits.append(
                    {
                        "offset": p.offset,
                        "resource1": args.set_resources,
                        "resource2": args.set_resources,
                        "resource3": args.set_resources,
                    }
                )
        if args.player is not None:
            if args.player < 0 or args.player >= len(save.players):
                print("Índice de jogador inválido", file=sys.stderr)
                return 1
            p = save.players[args.player]
            edit = {"offset": p.offset}
            if args.name is not None:
                edit["name"] = args.name
            if args.faction is not None:
                edit["faction"] = args.faction
            if args.city is not None:
                edit["city"] = args.city
            if args.r1 is not None:
                edit["resource1"] = args.r1
            if args.r2 is not None:
                edit["resource2"] = args.r2
            if args.r3 is not None:
                edit["resource3"] = args.r3
            edits.append(edit)

        out = apply_edits(save, scenario=args.scenario, players=edits or None)
        args.output.write_bytes(out)
        # verify
        verify = load_save(out)
        print(f"Salvo em {args.output}")
        print(f"Cenário: {verify.scenario} | jogadores: {len(verify.players)}")
        return 0

    return 1


if __name__ == "__main__":
    raise SystemExit(main())
