/* ===========================================================
   app.js — boot + wiring: state edits, structural actions,
   drag-and-drop reorder, live preview, zoom, theme, page size,
   download, social-icon toggle, JD tailoring, save/load manager.
   =========================================================== */
window.RF = window.RF || {};
RF.app = {};

function debounce(fn, ms) {
  let t; return function (...a) { clearTimeout(t); t = setTimeout(() => fn.apply(this, a), ms); };
}
const $ = (s) => document.querySelector(s);

/* ---------- refresh cycles ---------- */
RF.app.renderPreview = function () {
  RF.renderResume(document.getElementById("resume-page"));
};
const debouncedPreview = debounce(() => {
  RF.app.renderPreview();
  RF.ats.render();
  RF.save();
}, 380);

RF.app.refreshLive = function () { debouncedPreview(); };
RF.app.refreshAll = function () {
  RF.editor.build();
  RF.app.renderPreview();
  RF.ats.render();
  RF.save();
};

/* ---------- zoom ---------- */
RF.app._autoZoom = true;
RF.app.computeFit = function () {
  const scroll = $("#preview-scroll");
  if (!scroll) return 1;
  const avail = scroll.clientWidth - 56;
  const pageW = RF.state.meta.pageSize === "Letter" ? 816 : 794;
  return Math.max(0.4, Math.min(1, avail / pageW));
};
RF.app.setZoom = function (z) {
  z = Math.max(0.25, Math.min(3, z));
  RF.state.meta.zoom = z;
  $("#preview-stage").style.zoom = z;
  const el = $("#zoom-val");
  const txt = Math.round(z * 100) + "%";
  if (el) { if (el.tagName === "INPUT") el.value = txt; else el.textContent = txt; }
};

/* ---------- memory-foam textarea heights ---------- */
const TA_KEY = "resumeforge.taHeights";
RF.app._taHeights = (function () { try { return JSON.parse(localStorage.getItem(TA_KEY)) || {}; } catch (e) { return {}; } })();
function taKey(el) {
  const d = el.dataset || {};
  if (el.id) return "id:" + el.id;
  if (d.sectext !== undefined) return "sectext:" + d.sectext;
  if (d.sec !== undefined && d.entry !== undefined && d.bullet !== undefined) return "b:" + d.sec + ":" + d.entry + ":" + d.bullet;
  if (d.sec !== undefined && d.item !== undefined) return "i:" + d.sec + ":" + d.item;
  return null;
}
RF.app.applyTaHeights = function () {
  document.querySelectorAll("textarea").forEach(el => {
    const k = taKey(el);
    if (k && RF.app._taHeights[k]) el.style.height = RF.app._taHeights[k];
  });
};
function rememberTaHeight(el) {
  const k = taKey(el);
  if (!k) return;
  RF.app._taHeights[k] = el.offsetHeight + "px";
  try { localStorage.setItem(TA_KEY, JSON.stringify(RF.app._taHeights)); } catch (e) {}
}

/* ---------- mutation lookups ---------- */
function entryOf(secId, entryId) {
  const sec = RF.findSection(secId);
  return sec && (sec.entries || []).find(e => e.id === entryId);
}

/* ================= INPUT (text edits, no rebuild) ================= */
function onEditorInput(ev) {
  const el = ev.target;
  const d = el.dataset;
  let touched = true;

  if (d.toggle !== undefined) {
    RF.state.meta[d.toggle] = el.checked;
    RF.app.renderPreview(); RF.ats.render(); RF.save();
    return;
  }
  if (d.bind !== undefined) RF.state.basics[d.bind] = el.value;
  else if (d.link !== undefined && d.key) (RF.state.basics.links[+d.link] || {})[d.key] = el.value;
  else if (d.sectitle !== undefined) { const s = RF.findSection(d.sectitle); if (s) s.title = el.value; }
  else if (d.sectext !== undefined) { const s = RF.findSection(d.sectext); if (s) s.text = el.value; }
  else if (d.sec !== undefined && d.entry !== undefined && d.key) { const e = entryOf(d.sec, d.entry); if (e) e[d.key] = el.value; }
  else if (d.sec !== undefined && d.entry !== undefined && d.bullet !== undefined) { const e = entryOf(d.sec, d.entry); if (e) e.bullets[+d.bullet] = el.value; }
  else if (d.sec !== undefined && d.group !== undefined && d.key === "label") { const s = RF.findSection(d.sec); if (s) s.groups[+d.group].label = el.value; }
  else if (d.sec !== undefined && d.item !== undefined) { const s = RF.findSection(d.sec); if (s) s.items[+d.item] = el.value; }
  else touched = false;

  if (touched) RF.app.refreshLive();
}

/* ================= CLICK (structural actions) ================= */
function move(arr, id, dir) {
  const i = arr.findIndex(x => x.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= arr.length) return;
  const [it] = arr.splice(i, 1); arr.splice(j, 0, it);
}

function newSection(type) {
  const base = { id: RF.uid(), type, title: RF.SECTION_TYPES[type].label, _collapsed: false };
  const shape = RF.SECTION_TYPES[type].shape;
  if (type === "summary") base.text = "";
  else if (shape === "skills") base.groups = [{ label: "Languages", items: [] }];
  else if (shape === "entries" || shape === "education" || shape === "projects" || shape === "custom") base.entries = [newEntry(type)];
  else base.items = [];
  return base;
}
function newEntry(type) {
  if (type === "education") return { id: RF.uid(), degree: "", school: "", location: "", start: "", end: "", bullets: [] };
  if (type === "projects") return { id: RF.uid(), name: "", tech: "", start: "", end: "", bullets: [""] };
  if (type === "custom") return { id: RF.uid(), title: "", subtitle: "", location: "", start: "", end: "", bullets: [""] };
  return { id: RF.uid(), title: "", org: "", location: "", start: "", end: "", bullets: [""] };
}

function onEditorClick(ev) {
  const btn = ev.target.closest("[data-action]");
  if (!btn) return;
  const a = btn.dataset.action, d = btn.dataset;
  const sec = d.sec ? RF.findSection(d.sec) : null;

  switch (a) {
    case "toggle-collapse": {
      const card = btn.closest(".sec");
      card.classList.toggle("is-collapsed");
      if (d.sec && sec) sec._collapsed = card.classList.contains("is-collapsed");
      return;
    }
    case "sec-up":   move(RF.state.sections, d.sec, -1); break;
    case "sec-down": move(RF.state.sections, d.sec, +1); break;
    case "sec-hide": if (sec) sec.hidden = !sec.hidden; break;
    case "sec-del":  if (confirm("Delete this section?")) RF.state.sections = RF.state.sections.filter(s => s.id !== d.sec); else return; break;

    case "entry-add":  if (sec) (sec.entries = sec.entries || []).push(newEntry(sec.type)); break;
    case "entry-up":   if (sec) move(sec.entries, d.entry, -1); break;
    case "entry-down": if (sec) move(sec.entries, d.entry, +1); break;
    case "entry-del":  if (sec) sec.entries = sec.entries.filter(e => e.id !== d.entry); break;

    case "bullet-add": { const e = entryOf(d.sec, d.entry); if (e) (e.bullets = e.bullets || []).push(""); break; }
    case "bullet-del": { const e = entryOf(d.sec, d.entry); if (e) e.bullets.splice(+d.bullet, 1); break; }

    case "group-add": if (sec) (sec.groups = sec.groups || []).push({ label: "New group", items: [] }); break;
    case "group-del": if (sec) sec.groups.splice(+d.group, 1); break;
    case "skill-add": {
      const inp = document.querySelector(`[data-customskill="${d.sec}:${d.group}"]`);
      const v = inp && inp.value.trim();
      if (v) sec.groups[+d.group].items.push(v);
      break;
    }
    case "skill-del": if (sec) sec.groups[+d.group].items.splice(+d.item, 1); break;
    case "skill-suggest": if (sec) sec.groups[+d.group].items.push(d.val); break;

    case "item-add": {
      const inp = document.querySelector(`[data-customitem="${d.sec}"]`);
      const v = inp ? inp.value.trim() : "";
      if (sec) { sec.items = sec.items || []; sec.items.push(v || "New item"); }
      break;
    }
    case "item-del": if (sec) sec.items.splice(+d.item, 1); break;
    case "item-suggest": if (sec) { sec.items = sec.items || []; sec.items.push(d.val); } break;

    case "link-add": RF.state.basics.links.push({ label: "", url: "" }); break;
    case "link-del": RF.state.basics.links.splice(+d.link, 1); break;

    default: return;
  }
  RF.app.refreshAll();
}

/* Enter-to-add for the custom skill / item inputs */
function onEditorKeydown(ev) {
  if (ev.key !== "Enter") return;
  const el = ev.target;
  if (el.dataset.customskill !== undefined) {
    ev.preventDefault();
    const [secId, gi] = el.dataset.customskill.split(":");
    const sec = RF.findSection(secId), v = el.value.trim();
    if (sec && v) { sec.groups[+gi].items.push(v); RF.app.refreshAll(); }
  } else if (el.dataset.customitem !== undefined) {
    ev.preventDefault();
    const sec = RF.findSection(el.dataset.customitem), v = el.value.trim();
    if (sec && v) { sec.items = sec.items || []; sec.items.push(v); RF.app.refreshAll(); }
  }
}

/* ================= DRAG & DROP (reorder sections) ================= */
function dropTarget(root, y) {
  const cards = Array.from(root.querySelectorAll('.sec[data-seccard]'))
    .filter(c => c.dataset.seccard !== "basics" && !c.classList.contains("dragging"));
  for (const c of cards) {
    const r = c.getBoundingClientRect();
    if (y < r.top + r.height / 2) return c;
  }
  return null;
}
RF.app.moveSection = function (dragId, beforeId) {
  const arr = RF.state.sections;
  const from = arr.findIndex(s => s.id === dragId);
  if (from < 0) return;
  const [it] = arr.splice(from, 1);
  if (beforeId == null) arr.push(it);
  else { let to = arr.findIndex(s => s.id === beforeId); if (to < 0) to = arr.length; arr.splice(to, 0, it); }
  RF.app.refreshAll();
};
function wireDnD(root) {
  let dragId = null, overEl = null;
  const clearOver = () => { if (overEl) { overEl.classList.remove("drop-before"); overEl = null; } };
  root.addEventListener("dragstart", (e) => {
    const card = e.target.closest(".sec[data-seccard]");
    if (!card || card.dataset.seccard === "basics") return;
    if (e.target.closest("input,textarea,button,select")) { e.preventDefault(); return; }
    dragId = card.dataset.seccard;
    card.classList.add("dragging");
    if (e.dataTransfer) { e.dataTransfer.effectAllowed = "move"; try { e.dataTransfer.setData("text/plain", dragId); } catch (_) {} }
  });
  root.addEventListener("dragover", (e) => {
    if (!dragId) return;
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
    const tgt = dropTarget(root, e.clientY);
    if (tgt !== overEl) { clearOver(); overEl = tgt; if (overEl) overEl.classList.add("drop-before"); }
  });
  root.addEventListener("drop", (e) => {
    if (!dragId) return;
    e.preventDefault();
    const tgt = dropTarget(root, e.clientY);
    const beforeId = tgt ? tgt.dataset.seccard : null;
    clearOver();
    const id = dragId; dragId = null;
    RF.app.moveSection(id, beforeId);
  });
  root.addEventListener("dragend", () => {
    clearOver();
    const d = root.querySelector(".sec.dragging");
    if (d) d.classList.remove("dragging");
    dragId = null;
  });
}

/* ================= RIGHT PANEL events ================= */
function onAtsClick(ev) {
  const btn = ev.target.closest("[data-action], #jd-analyze");
  if (!btn) return;
  if (btn.id === "jd-analyze") {
    const jd = (document.getElementById("jd-input") || {}).value || "";
    RF.ats.runJD(jd.trim());
    return;
  }
  const a = btn.dataset.action;
  if (a === "ats-tab") { RF.ats._tab = btn.dataset.tab; RF.ats.render(); }
  else if (a === "ats-addkw") { RF.ats.addKeyword(btn.dataset.val); }
  else if (a === "ats-sethead") { RF.ats.setHeadline(btn.dataset.val); }
  else if (a === "ats-setloc") { RF.ats.setLocation(btn.dataset.val); }
}
function onAtsInput(ev) {
  if (ev.target.id === "jd-input") RF.ats._jd = ev.target.value;
}
function onAtsPaste(ev) {
  if (ev.target && ev.target.id === "jd-input") {
    setTimeout(() => {
      const v = (document.getElementById("jd-input") || {}).value || "";
      if (v.trim()) RF.ats.runJD(v.trim());
    }, 180);
  }
}

/* ================= TOAST ================= */
let _toastT;
function toast(msg) {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = msg; el.hidden = false;
  clearTimeout(_toastT);
  _toastT = setTimeout(() => { el.hidden = true; }, 2200);
}
function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60); if (m < 60) return m + "m ago";
  const h = Math.floor(m / 60); if (h < 24) return h + "h ago";
  const d = Math.floor(h / 24); if (d < 7) return d + "d ago";
  return new Date(ts).toLocaleDateString();
}

/* ================= RESUMES MODAL ================= */
RF.app.renderSavesList = function () {
  const wrap = document.getElementById("saves-list");
  const list = RF.store.list();
  const count = RF.store.count();
  document.getElementById("save-count").textContent = count + " / " + RF.store.LIMIT + " saved in this browser";

  const active = RF.state.meta._saveId;
  const nameInput = document.getElementById("save-name");
  if (nameInput && document.activeElement !== nameInput) nameInput.value = RF.state.meta._saveName || "";

  if (!list.length) {
    wrap.innerHTML = '<div class="empty-note">No saved resumes yet. Name your current one above and hit Save.</div>';
    return;
  }
  wrap.innerHTML = list.map(s => `
    <div class="save-item ${s.id === active ? "is-active" : ""}">
      <div class="save-item__main">
        <div class="save-item__name">${RF.esc(s.name)}${s.id === active ? " (open)" : ""}</div>
        <div class="save-item__time">Updated ${timeAgo(s.updatedAt)}</div>
      </div>
      <div class="save-item__tools">
        <button class="mini-btn" data-save-action="load" data-id="${s.id}" title="Open">Open</button>
        <button class="mini-btn" data-save-action="rename" data-id="${s.id}" title="Rename">Edit</button>
        <button class="mini-btn" data-save-action="dup" data-id="${s.id}" title="Duplicate">Copy</button>
        <button class="mini-btn mini-btn--danger" data-save-action="del" data-id="${s.id}" title="Delete">Del</button>
      </div>
    </div>`).join("");
};

RF.app.openResumes = function () {
  document.getElementById("resumes-modal").hidden = false;
  RF.app.renderSavesList();
};
RF.app.closeResumes = function () { document.getElementById("resumes-modal").hidden = true; };

function wireResumes() {
  document.getElementById("btn-resumes").addEventListener("click", RF.app.openResumes);
  document.getElementById("modal-close").addEventListener("click", RF.app.closeResumes);
  document.querySelector("#resumes-modal .modal__backdrop").addEventListener("click", RF.app.closeResumes);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") RF.app.closeResumes(); });

  document.getElementById("save-as-btn").addEventListener("click", () => {
    const name = document.getElementById("save-name").value.trim();
    const active = RF.state.meta._saveId;
    if (active && name === (RF.state.meta._saveName || "")) {
      RF.store.update(active); toast("Updated: " + name);
    } else {
      const r = RF.store.saveAs(name);
      if (!r.ok) { toast(r.reason); return; }
      toast("Saved: " + (name || "Untitled resume"));
    }
    RF.app.renderSavesList();
  });

  document.getElementById("export-btn").addEventListener("click", () => { RF.store.exportCurrent(); toast("Exported .json backup"); });
  document.getElementById("import-input").addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    RF.store.importFile(file, (res) => {
      if (!res.ok) { toast(res.reason); return; }
      syncControls(); RF.app.refreshAll();
      if (RF.app._autoZoom) RF.app.setZoom(RF.app.computeFit());
      RF.app.renderSavesList();
      toast("Imported - now open in the editor");
    });
    e.target.value = "";
  });

  document.getElementById("saves-list").addEventListener("click", (e) => {
    const b = e.target.closest("[data-save-action]"); if (!b) return;
    const id = b.dataset.id, act = b.dataset.saveAction;
    if (act === "load") {
      if (RF.store.load(id)) {
        syncControls(); RF.app.refreshAll();
        if (RF.app._autoZoom) RF.app.setZoom(RF.app.computeFit());
        RF.app.renderSavesList();
        toast("Opened resume");
      }
    } else if (act === "rename") {
      const cur = RF.store.list().find(s => s.id === id);
      const name = prompt("Rename resume:", cur ? cur.name : "");
      if (name != null) { RF.store.rename(id, name); RF.app.renderSavesList(); }
    } else if (act === "dup") {
      const r = RF.store.duplicate(id);
      if (!r.ok) toast(r.reason || "Could not duplicate");
      else { RF.app.renderSavesList(); toast("Duplicated"); }
    } else if (act === "del") {
      if (confirm("Delete this saved resume? This cannot be undone.")) {
        RF.store.remove(id); RF.app.renderSavesList(); toast("Deleted");
      }
    }
  });
}

/* ================= TOP BAR ================= */
function fillTemplateSelect() {
  const sel = $("#select-template");
  sel.innerHTML = RF.templates.map(t => `<option value="${t.key}">${RF.esc(t.name)}</option>`).join("");
}

function wireTopbar() {
  $("#select-template").addEventListener("change", (e) => {
    RF.state.meta.template = e.target.value;
    RF.app.refreshAll();
  });
  $("#select-type").addEventListener("change", (e) => {
    const type = e.target.value;
    if (confirm("Load the sample content for this profile? Your current edits will be replaced.")) {
      RF.loadSample(type);
      syncControls();
      RF.app.refreshAll();
      if (RF.app._autoZoom) RF.app.setZoom(RF.app.computeFit());
    } else {
      e.target.value = RF.state.meta.type;
    }
  });
  $("#select-pagesize").addEventListener("change", (e) => {
    RF.state.meta.pageSize = e.target.value;
    RF.pdf.applyPageSize();
    RF.app.renderPreview();
    if (RF.app._autoZoom) RF.app.setZoom(RF.app.computeFit());
    RF.save();
  });
  $("#zoom-in").addEventListener("click", () => { RF.app._autoZoom = false; RF.app.setZoom((RF.state.meta.zoom || 1) + 0.1); });
  $("#zoom-out").addEventListener("click", () => { RF.app._autoZoom = false; RF.app.setZoom((RF.state.meta.zoom || 1) - 0.1); });
  const zoomInput = $("#zoom-val");
  if (zoomInput && zoomInput.tagName === "INPUT") {
    const applyZoomInput = () => {
      const n = parseInt((zoomInput.value || "").replace(/[^0-9]/g, ""), 10);
      RF.app._autoZoom = false;
      if (!isNaN(n) && n > 0) RF.app.setZoom(n / 100);
      else RF.app.setZoom(RF.state.meta.zoom || 1);
    };
    zoomInput.addEventListener("change", applyZoomInput);
    zoomInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); applyZoomInput(); zoomInput.blur(); }
    });
    zoomInput.addEventListener("focus", () => zoomInput.select());
  }
  $("#theme-toggle").addEventListener("click", RF.theme.toggle);
  $("#btn-download").addEventListener("click", RF.pdf.download);
  $("#btn-reset").addEventListener("click", () => {
    if (confirm("Reset to the sample for the current profile?")) {
      RF.loadSample(RF.state.meta.type);
      syncControls(); RF.app.refreshAll();
      if (RF.app._autoZoom) RF.app.setZoom(RF.app.computeFit());
    }
  });

  $("#add-section-btn").addEventListener("click", () => {
    const type = $("#add-section-select").value;
    RF.state.sections.push(newSection(type));
    RF.app.refreshAll();
  });

  const ps = $("#panel-switch");
  if (ps) ps.addEventListener("click", (e) => {
    const b = e.target.closest("[data-panel]"); if (!b) return;
    ps.querySelectorAll(".panel-switch__btn").forEach(x => x.classList.remove("is-active"));
    b.classList.add("is-active");
    ["left", "center", "right"].forEach(p =>
      document.getElementById("panel-" + p).classList.toggle("is-shown", p === b.dataset.panel));
  });
}

function syncControls() {
  $("#select-template").value = RF.state.meta.template;
  $("#select-type").value = RF.state.meta.type;
  $("#select-pagesize").value = RF.state.meta.pageSize || "A4";
}

/* ================= BOOT ================= */
RF.app.init = function () {
  RF.theme.init();
  const _atsRender = RF.ats.render;
  RF.ats.render = function () { _atsRender.apply(RF.ats, arguments); RF.app.applyTaHeights(); };
  if (!RF.restore()) RF.loadSample("experienced");
  if (!RF.state.meta.zoom) RF.state.meta.zoom = 1;

  fillTemplateSelect();
  syncControls();

  RF.editor.build();
  RF.app.renderPreview();
  RF.pdf.applyPageSize();
  RF.ats.render();

  const ed = document.getElementById("editor-root");
  ed.addEventListener("input", onEditorInput);
  ed.addEventListener("change", onEditorInput);
  ed.addEventListener("click", onEditorClick);
  ed.addEventListener("keydown", onEditorKeydown);
  wireDnD(ed);

  const at = document.getElementById("ats-root");
  at.addEventListener("click", onAtsClick);
  at.addEventListener("input", onAtsInput);
  at.addEventListener("paste", onAtsPaste);

  wireTopbar();
  wireResumes();

  document.addEventListener("mouseup", (e) => {
    if (e.target && e.target.tagName === "TEXTAREA") rememberTaHeight(e.target);
  });

  RF.app.setZoom(RF.app.computeFit());
  RF.app.applyTaHeights();

  const _ver = document.getElementById("app-version");
  if (_ver && RF.VERSION) _ver.textContent = "v" + RF.VERSION;
  window.addEventListener("resize", debounce(() => {
    if (RF.app._autoZoom) RF.app.setZoom(RF.app.computeFit());
  }, 150));
};

document.addEventListener("DOMContentLoaded", RF.app.init);
