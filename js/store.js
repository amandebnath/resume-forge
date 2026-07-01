/* ===========================================================
   store.js — named resumes saved locally (in this browser).
   Up to LIMIT named saves; plus Export / Import to a .json file
   for unlimited backups and moving between devices. 100% free,
   no account, nothing leaves the machine.
   =========================================================== */
window.RF = window.RF || {};
RF.store = {};

const SAVES_KEY = "resumeforge.saves";
RF.store.LIMIT = 50;

const clone = (o) => JSON.parse(JSON.stringify(o));

RF.store._read = function () {
  try { return JSON.parse(localStorage.getItem(SAVES_KEY)) || {}; }
  catch (e) { return {}; }
};
RF.store._write = function (map) {
  try { localStorage.setItem(SAVES_KEY, JSON.stringify(map)); return true; }
  catch (e) { return false; }
};

RF.store.list = function () {
  const map = RF.store._read();
  return Object.values(map).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
};
RF.store.count = function () { return Object.keys(RF.store._read()).length; };

/* save current working state as a NEW named resume */
RF.store.saveAs = function (name) {
  name = (name || "").trim() || "Untitled resume";
  const map = RF.store._read();
  if (Object.keys(map).length >= RF.store.LIMIT) {
    return { ok: false, reason: `You've reached the ${RF.store.LIMIT}-resume limit. Delete one, or use Export to back up before removing.` };
  }
  const id = RF.uid();
  const data = clone(RF.state);
  data.meta._saveId = id; data.meta._saveName = name;
  map[id] = { id, name, updatedAt: Date.now(), data };
  RF.store._write(map);
  RF.state.meta._saveId = id; RF.state.meta._saveName = name; RF.save();
  return { ok: true, id };
};

/* overwrite the resume the user currently has open */
RF.store.update = function (id) {
  const map = RF.store._read();
  if (!map[id]) return { ok: false, reason: "Save not found." };
  const data = clone(RF.state);
  data.meta._saveId = id; data.meta._saveName = map[id].name;
  map[id] = { id, name: map[id].name, updatedAt: Date.now(), data };
  RF.store._write(map);
  return { ok: true, id };
};

RF.store.load = function (id) {
  const map = RF.store._read();
  if (!map[id]) return false;
  RF.state = clone(map[id].data);
  RF.state.meta._saveId = id;
  RF.state.meta._saveName = map[id].name;
  RF.save();
  return true;
};

RF.store.rename = function (id, name) {
  const map = RF.store._read();
  if (!map[id]) return;
  map[id].name = (name || "").trim() || map[id].name;
  map[id].updatedAt = Date.now();
  RF.store._write(map);
  if (RF.state.meta._saveId === id) RF.state.meta._saveName = map[id].name;
};

RF.store.duplicate = function (id) {
  const map = RF.store._read();
  if (!map[id]) return { ok: false };
  if (Object.keys(map).length >= RF.store.LIMIT) return { ok: false, reason: `Limit of ${RF.store.LIMIT} reached.` };
  const nid = RF.uid();
  const data = clone(map[id].data);
  data.meta._saveId = nid;
  map[nid] = { id: nid, name: map[id].name + " (copy)", updatedAt: Date.now(), data };
  RF.store._write(map);
  return { ok: true, id: nid };
};

RF.store.remove = function (id) {
  const map = RF.store._read();
  delete map[id];
  RF.store._write(map);
  if (RF.state.meta._saveId === id) { RF.state.meta._saveId = null; RF.state.meta._saveName = null; }
};

/* ---------- Export / Import (file-based, unlimited) ---------- */
RF.store.exportCurrent = function () {
  const data = clone(RF.state);
  const name = (RF.state.meta._saveName || RF.state.basics.name || "resume").replace(/[^\w\-]+/g, "_");
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name + ".resumeforge.json";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

RF.store.importFile = function (file, cb) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!data || !data.basics || !Array.isArray(data.sections)) throw new Error("Not a ResumeForge file");
      // load it as the working doc; it becomes a new unsaved resume
      data.meta = data.meta || {};
      data.meta._saveId = null;
      data.meta._saveName = (file.name || "Imported").replace(/\.resumeforge\.json$|\.json$/i, "");
      RF.state = data;
      RF.save();
      cb && cb({ ok: true });
    } catch (e) {
      cb && cb({ ok: false, reason: "That doesn't look like a ResumeForge .json file." });
    }
  };
  reader.readAsText(file);
};
