/**
 * A.R.S.E.N.A.L Extended Power save format (client-side).
 * Depends on global `pako` (zlib inflate/deflate).
 */

const ArsenalSave = (() => {
  const OUTER_MAGIC = Uint8Array.from([
    0x7e, 0xb5, 0xa3, 0xb8, 0xa7, 0xa9, 0xa3, 0xaf, 0xa7, 0x80, 0x00,
  ]);
  const INNER_MAGIC = "ARSENAL2.G";
  const ZLIB_LEVEL = 6;
  const SCENARIO_OFFSET = 0x59;
  const SCENARIO_SIZE = 30;
  const NAME_SIZE = 20;
  const FACTION_SIZE = 16;
  const CITY_SIZE = 16;
  const CITY_REL = 37;
  const NAME_REL = -20;
  const FACTION_REL = -36;
  const CITY_PREFIX = [0x00, 0xe0, 0x3f, 0x00, 0x00, 0x00];

  function u32(view, offset) {
    return view.getUint32(offset, true);
  }

  function setU32(view, offset, value) {
    view.setUint32(offset, value >>> 0, true);
  }

  function readCString(bytes, offset, size) {
    let end = offset;
    const limit = Math.min(bytes.length, offset + size);
    while (end < limit && bytes[end] !== 0) end++;
    return new TextDecoder("latin1").decode(bytes.subarray(offset, end));
  }

  function writeCString(bytes, offset, size, value) {
    const encoded = new TextEncoder().encode(value);
    // TextEncoder is UTF-8; for latin-1 map char codes directly
    const chars = [];
    for (const ch of value) {
      const code = ch.charCodeAt(0);
      chars.push(code <= 255 ? code : 63);
      if (chars.length >= size - 1) break;
    }
    for (let i = 0; i < size; i++) {
      bytes[offset + i] = i < chars.length ? chars[i] : 0;
    }
  }

  function extractFaction(bytes, offset) {
    let start = offset;
    const end = offset + FACTION_SIZE;
    while (start < end) {
      const b = bytes[start];
      if ((b >= 65 && b <= 90) || (b >= 97 && b <= 122)) break;
      start++;
    }
    return readCString(bytes, start, end - start);
  }

  function writeFaction(bytes, offset, value) {
    let start = offset;
    const end = offset + FACTION_SIZE;
    while (start < end) {
      const b = bytes[start];
      if ((b >= 65 && b <= 90) || (b >= 97 && b <= 122)) break;
      start++;
    }
    const room = end - start;
    writeCString(bytes, start, room, value);
  }

  function findBytes(haystack, needle, from = 0) {
    outer: for (let i = from; i <= haystack.length - needle.length; i++) {
      for (let j = 0; j < needle.length; j++) {
        if (haystack[i + j] !== needle[j]) continue outer;
      }
      return i;
    }
    return -1;
  }

  function decompress(fileBytes) {
    const data = fileBytes instanceof Uint8Array ? fileBytes : new Uint8Array(fileBytes);
    if (data.length < 19) throw new Error("Arquivo muito pequeno");

    const magicOk = OUTER_MAGIC.every((b, i) => data[i] === b);
    if (magicOk) {
      const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
      const compSize = u32(view, 15);
      const payload = data.subarray(19, 19 + compSize);
      const raw = pako.inflate(payload);
      if (readCString(raw, 0, 10) !== INNER_MAGIC) {
        throw new Error("Payload sem magia ARSENAL2.G");
      }
      return { raw, outerMagic: data.subarray(0, 11) };
    }

    if (readCString(data, 0, 10) === INNER_MAGIC) {
      return { raw: data.slice(), outerMagic: OUTER_MAGIC.slice() };
    }

    try {
      const raw = pako.inflate(data.subarray(19));
      if (readCString(raw, 0, 10) === INNER_MAGIC) {
        return { raw, outerMagic: data.subarray(0, 11) };
      }
    } catch (_) {
      /* fallthrough */
    }
    throw new Error("Formato não reconhecido");
  }

  function compress(raw, outerMagic = OUTER_MAGIC) {
    const compressed = pako.deflate(raw, { level: ZLIB_LEVEL });
    const out = new Uint8Array(11 + 8 + compressed.length);
    out.set(outerMagic.subarray(0, 11), 0);
    const view = new DataView(out.buffer);
    setU32(view, 11, raw.length);
    setU32(view, 15, compressed.length);
    out.set(compressed, 19);
    return out;
  }

  function findPlayers(raw) {
    const players = [];
    let start = 0;
    while (true) {
      const idx = findBytes(raw, CITY_PREFIX, start);
      if (idx < 0) break;
      const cityOff = idx + CITY_PREFIX.length;
      const first = raw[cityOff];
      if (!((first >= 65 && first <= 90) || (first >= 97 && first <= 122))) {
        start = idx + 1;
        continue;
      }
      const city = readCString(raw, cityOff, CITY_SIZE);
      if (city.length < 3 || ![...city].every((c) => c.charCodeAt(0) >= 32 && c.charCodeAt(0) < 127)) {
        start = idx + 1;
        continue;
      }
      const resOff = cityOff - CITY_REL;
      if (resOff < 40 || raw[resOff + 12 + 16] !== 0xff) {
        start = idx + 1;
        continue;
      }
      const view = new DataView(raw.buffer, raw.byteOffset, raw.byteLength);
      const name = readCString(raw, resOff + NAME_REL, NAME_SIZE);
      if (name.length < 2) {
        start = idx + 1;
        continue;
      }
      players.push({
        index: players.length,
        offset: resOff,
        faction: extractFaction(raw, resOff + FACTION_REL),
        name,
        city,
        resource1: u32(view, resOff),
        resource2: u32(view, resOff + 4),
        resource3: u32(view, resOff + 8),
      });
      start = cityOff + 1;
    }
    return players;
  }

  function load(fileBytes) {
    const { raw, outerMagic } = decompress(fileBytes);
    return {
      scenario: readCString(raw, SCENARIO_OFFSET, SCENARIO_SIZE),
      players: findPlayers(raw),
      raw,
      outerMagic,
    };
  }

  function build(save, edits) {
    const raw = save.raw.slice();
    if (edits.scenario != null) {
      writeCString(raw, SCENARIO_OFFSET, SCENARIO_SIZE, edits.scenario);
    }
    const view = new DataView(raw.buffer, raw.byteOffset, raw.byteLength);
    for (const p of edits.players || []) {
      if (p.name != null) writeCString(raw, p.offset + NAME_REL, NAME_SIZE, p.name);
      if (p.faction != null) writeFaction(raw, p.offset + FACTION_REL, p.faction);
      if (p.city != null) writeCString(raw, p.offset + CITY_REL, CITY_SIZE, p.city);
      if (p.resource1 != null) setU32(view, p.offset, p.resource1);
      if (p.resource2 != null) setU32(view, p.offset + 4, p.resource2);
      if (p.resource3 != null) setU32(view, p.offset + 8, p.resource3);
    }
    return compress(raw, save.outerMagic);
  }

  return { load, build, compress, INNER_MAGIC };
})();
