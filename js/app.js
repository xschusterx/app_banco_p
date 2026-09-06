const state = {
  save: null,
  fileName: "edited.save",
};

const dropzone = document.getElementById("dropzone");
const fileInput = document.getElementById("file-input");
const editor = document.getElementById("editor");
const empty = document.getElementById("empty");
const scenarioInput = document.getElementById("scenario");
const playersEl = document.getElementById("players");
const statusEl = document.getElementById("status");
const metaEl = document.getElementById("meta");

function setStatus(msg, kind = "") {
  statusEl.textContent = msg;
  statusEl.dataset.kind = kind;
}

function formatNum(n) {
  return Number(n).toLocaleString("pt-BR");
}

async function readFile(file) {
  const buf = await file.arrayBuffer();
  state.fileName = file.name.replace(/(\.\w+)?$/, "") + ".edited.save";
  try {
    state.save = ArsenalSave.load(new Uint8Array(buf));
  } catch (err) {
    setStatus(err.message || String(err), "error");
    editor.hidden = true;
    empty.hidden = false;
    return;
  }
  render();
  setStatus(`Carregado: ${file.name} · ${state.save.players.length} jogadores`, "ok");
}

function render() {
  empty.hidden = true;
  editor.hidden = false;
  scenarioInput.value = state.save.scenario;
  metaEl.textContent = `${state.save.players.length} campos · payload ${formatNum(state.save.raw.length)} bytes`;

  playersEl.innerHTML = "";
  state.save.players.forEach((p, i) => {
    const article = document.createElement("article");
    article.className = "player";
    article.style.setProperty("--i", i);
    article.innerHTML = `
      <header class="player__head">
        <span class="player__idx">0${i + 1}</span>
        <h3>${escapeHtml(p.name)}</h3>
        <p>${escapeHtml(p.faction)} · ${escapeHtml(p.city)}</p>
      </header>
      <div class="player__grid">
        <label>Comandante <input data-i="${i}" data-f="name" maxlength="19" value="${escapeAttr(p.name)}" /></label>
        <label>Facção <input data-i="${i}" data-f="faction" maxlength="14" value="${escapeAttr(p.faction)}" /></label>
        <label>QG / Cidade <input data-i="${i}" data-f="city" maxlength="15" value="${escapeAttr(p.city)}" /></label>
        <label>Recurso 1 <input data-i="${i}" data-f="resource1" type="number" min="0" max="4294967295" value="${p.resource1}" /></label>
        <label>Recurso 2 <input data-i="${i}" data-f="resource2" type="number" min="0" max="4294967295" value="${p.resource2}" /></label>
        <label>Recurso 3 <input data-i="${i}" data-f="resource3" type="number" min="0" max="4294967295" value="${p.resource3}" /></label>
      </div>
    `;
    playersEl.appendChild(article);
  });
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeAttr(s) {
  return escapeHtml(s).replaceAll('"', "&quot;");
}

function collectEdits() {
  const players = state.save.players.map((p) => ({ offset: p.offset }));
  playersEl.querySelectorAll("input[data-i]").forEach((input) => {
    const i = Number(input.dataset.i);
    const f = input.dataset.f;
    let val = input.value;
    if (f.startsWith("resource")) val = Number(val) || 0;
    players[i][f] = val;
  });
  return {
    scenario: scenarioInput.value,
    players,
  };
}

function download(bytes, name) {
  const blob = new Blob([bytes], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function boostAll(amount) {
  playersEl.querySelectorAll('input[data-f^="resource"]').forEach((input) => {
    input.value = amount;
  });
  setStatus(`Recursos definidos para ${formatNum(amount)}`, "ok");
}

dropzone.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", () => {
  if (fileInput.files[0]) readFile(fileInput.files[0]);
});

["dragenter", "dragover"].forEach((ev) => {
  dropzone.addEventListener(ev, (e) => {
    e.preventDefault();
    dropzone.classList.add("is-hot");
  });
});
["dragleave", "drop"].forEach((ev) => {
  dropzone.addEventListener(ev, (e) => {
    e.preventDefault();
    dropzone.classList.remove("is-hot");
  });
});
dropzone.addEventListener("drop", (e) => {
  const file = e.dataTransfer.files[0];
  if (file) readFile(file);
});

document.getElementById("btn-download").addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();
  if (!state.save) return;
  try {
    const out = ArsenalSave.build(state.save, collectEdits());
    download(out, state.fileName);
    setStatus(`Save exportado: ${state.fileName}`, "ok");
  } catch (err) {
    setStatus(err.message || String(err), "error");
  }
});

document.getElementById("btn-boost").addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();
  boostAll(999999);
});
document.getElementById("btn-reset-res").addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();
  boostAll(20000);
});

document.getElementById("btn-sample").addEventListener("click", async () => {
  try {
    const res = await fetch("samples/WorldWideWar.save");
    if (!res.ok) throw new Error("Sample não encontrado (abra via servidor local)");
    const buf = await res.arrayBuffer();
    state.fileName = "WorldWideWar.edited.save";
    state.save = ArsenalSave.load(new Uint8Array(buf));
    render();
    setStatus("Sample World Wide War carregado", "ok");
  } catch (err) {
    setStatus(err.message || String(err), "error");
  }
});
