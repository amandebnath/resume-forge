/* ===========================================================
   editor.js — builds the left panel form from RF.state.
   Text edits update state in place (no rebuild -> focus kept);
   structural changes (add/remove/reorder/chips) rebuild the form.
   =========================================================== */
window.RF = window.RF || {};
RF.editor = {};

const esc = (s) => RF.esc(s);
const escAttr = (s) => RF.esc(s);

/* ---------- small field helpers ---------- */
function inputField(label, ds, value, opts = {}) {
  const list = opts.list ? ` list="${opts.list}"` : "";
  const ph = opts.ph ? ` placeholder="${escAttr(opts.ph)}"` : "";
  return `<div class="field">
    <label class="field__label">${esc(label)}</label>
    <input class="input" ${ds}${list}${ph} value="${escAttr(value || "")}" />
  </div>`;
}
function textArea(label, ds, value, opts = {}) {
  const ph = opts.ph ? ` placeholder="${escAttr(opts.ph)}"` : "";
  return `<div class="field">
    <label class="field__label">${esc(label)}</label>
    <textarea class="textarea" ${ds}${ph}>${esc(value || "")}</textarea>
  </div>`;
}

/* ---------- bullets editor ---------- */
function bulletsBlock(secId, entryId, bullets) {
  const rows = (bullets || []).map((b, i) => `
    <div class="bullet-row">
      <textarea class="textarea" data-sec="${secId}" data-entry="${entryId}" data-bullet="${i}" placeholder="Describe an achievement - start with an action verb, add a number where you can.">${esc(b)}</textarea>
      <button class="mini-btn mini-btn--danger" data-action="bullet-del" data-sec="${secId}" data-entry="${entryId}" data-bullet="${i}" title="Remove bullet">X</button>
    </div>`).join("");
  return `<div class="bullets">${rows}
    <button class="add-link" data-action="bullet-add" data-sec="${secId}" data-entry="${entryId}">+ Add bullet</button>
  </div>`;
}

/* ---------- entry editors per shape ---------- */
function entryHead(title, secId, entryId, idx, count) {
  return `<div class="entry__bar">
    <span class="entry__title">${esc(title)} ${idx + 1}</span>
    <span class="entry__tools">
      <button class="mini-btn" data-action="entry-up" data-sec="${secId}" data-entry="${entryId}" title="Move up" ${idx === 0 ? "disabled" : ""}>&uarr;</button>
      <button class="mini-btn" data-action="entry-down" data-sec="${secId}" data-entry="${entryId}" title="Move down" ${idx === count - 1 ? "disabled" : ""}>&darr;</button>
      <button class="mini-btn mini-btn--danger" data-action="entry-del" data-sec="${secId}" data-entry="${entryId}" title="Delete">Del</button>
    </span>
  </div>`;
}

function expEntry(sec, e, i, n) {
  const d = (k) => `data-sec="${sec.id}" data-entry="${e.id}" data-key="${k}"`;
  return `<div class="entry">
    ${entryHead("Role", sec.id, e.id, i, n)}
    ${inputField("Job title", d("title"), e.title, { list: "dl-titles", ph: "Software Engineer" })}
    <div class="field-row">
      ${inputField("Company / Organization", d("org"), e.org, { ph: "Company name" })}
      ${inputField("Location", d("location"), e.location, { ph: "City, Country" })}
    </div>
    <div class="field-row">
      ${inputField("Start", d("start"), e.start, { ph: "Jun 2022" })}
      ${inputField("End", d("end"), e.end, { ph: "Present" })}
    </div>
    ${bulletsBlock(sec.id, e.id, e.bullets)}
  </div>`;
}

function customEntry(sec, e, i, n) {
  const d = (k) => `data-sec="${sec.id}" data-entry="${e.id}" data-key="${k}"`;
  return `<div class="entry">
    ${entryHead("Item", sec.id, e.id, i, n)}
    ${inputField("Title", d("title"), e.title, { ph: "Heading" })}
    <div class="field-row">
      ${inputField("Subtitle", d("subtitle"), e.subtitle, { ph: "Sub-heading / org" })}
      ${inputField("Location", d("location"), e.location, { ph: "City" })}
    </div>
    <div class="field-row">
      ${inputField("Start", d("start"), e.start)}
      ${inputField("End", d("end"), e.end)}
    </div>
    ${bulletsBlock(sec.id, e.id, e.bullets)}
  </div>`;
}

function eduEntry(sec, e, i, n) {
  const d = (k) => `data-sec="${sec.id}" data-entry="${e.id}" data-key="${k}"`;
  return `<div class="entry">
    ${entryHead("Education", sec.id, e.id, i, n)}
    ${inputField("Degree", d("degree"), e.degree, { list: "dl-degrees", ph: "B.Tech in Computer Science" })}
    <div class="field-row">
      ${inputField("School / University", d("school"), e.school, { ph: "University name" })}
      ${inputField("Location", d("location"), e.location, { ph: "City, Country" })}
    </div>
    <div class="field-row">
      ${inputField("Start", d("start"), e.start, { ph: "2021" })}
      ${inputField("End", d("end"), e.end, { ph: "2025" })}
    </div>
    ${bulletsBlock(sec.id, e.id, e.bullets)}
  </div>`;
}

function projEntry(sec, e, i, n) {
  const d = (k) => `data-sec="${sec.id}" data-entry="${e.id}" data-key="${k}"`;
  return `<div class="entry">
    ${entryHead("Project", sec.id, e.id, i, n)}
    ${inputField("Project name", d("name"), e.name, { ph: "Project title" })}
    ${inputField("Tech / Stack", d("tech"), e.tech, { ph: "React, Node.js, PostgreSQL" })}
    <div class="field-row">
      ${inputField("Start", d("start"), e.start)}
      ${inputField("End", d("end"), e.end)}
    </div>
    ${bulletsBlock(sec.id, e.id, e.bullets)}
  </div>`;
}

/* ---------- skills editor ---------- */
function roleSuggestions(groupLabel) {
  const role = RF.getTemplate(RF.state.meta.template).role;
  const dict = RF.keywords.skillsByRole[role] || {};
  let pool = [];
  const match = Object.keys(dict).find(k => k.toLowerCase() === (groupLabel || "").toLowerCase());
  if (match) pool = dict[match];
  else Object.values(dict).forEach(a => pool = pool.concat(a));
  return pool;
}

function skillsBlock(sec) {
  const groups = (sec.groups || []).map((g, gi) => {
    const chips = (g.items || []).map((it, ii) => `
      <span class="chip">${esc(it)}<span class="chip__x" data-action="skill-del" data-sec="${sec.id}" data-group="${gi}" data-item="${ii}">x</span></span>`).join("");
    const present = new Set((g.items || []).map(x => x.toLowerCase()));
    const suggs = roleSuggestions(g.label).filter(s => !present.has(s.toLowerCase())).slice(0, 10)
      .map(s => `<button class="suggest-chip" data-action="skill-suggest" data-sec="${sec.id}" data-group="${gi}" data-val="${escAttr(s)}">${esc(s)}</button>`).join("");
    return `<div class="skillgroup">
      <div class="skillgroup__head">
        <input class="input" data-sec="${sec.id}" data-group="${gi}" data-key="label" value="${escAttr(g.label)}" placeholder="Group label e.g. Languages" />
        <button class="mini-btn mini-btn--danger" data-action="group-del" data-sec="${sec.id}" data-group="${gi}" title="Remove group">Del</button>
      </div>
      <div class="chips">${chips || '<span class="subtle">No items yet</span>'}</div>
      <div class="add-item-row">
        <input class="input" data-customskill="${sec.id}:${gi}" placeholder="Add a skill, press Enter" />
        <button class="btn btn--soft" data-action="skill-add" data-sec="${sec.id}" data-group="${gi}">Add</button>
      </div>
      ${suggs ? `<div class="suggest-chips">${suggs}</div>` : ""}
    </div>`;
  }).join("");
  return groups + `<button class="add-link" data-action="group-add" data-sec="${sec.id}">+ Add skill group</button>`;
}

/* ---------- list editors ---------- */
function languagesBlock(sec) {
  const chips = (sec.items || []).map((it, i) => `
    <span class="chip">${esc(it)}<span class="chip__x" data-action="item-del" data-sec="${sec.id}" data-item="${i}">x</span></span>`).join("");
  const present = new Set((sec.items || []).map(x => x.toLowerCase()));
  const suggs = RF.keywords.spokenLanguages.filter(s => !present.has(s.toLowerCase())).slice(0, 10)
    .map(s => `<button class="suggest-chip" data-action="item-suggest" data-sec="${sec.id}" data-val="${escAttr(s)}">${esc(s)}</button>`).join("");
  return `<div class="chips">${chips || '<span class="subtle">No languages yet</span>'}</div>
    <div class="add-item-row">
      <input class="input" data-customitem="${sec.id}" placeholder="e.g. Spanish - Fluent, press Enter" />
      <button class="btn btn--soft" data-action="item-add" data-sec="${sec.id}">Add</button>
    </div>
    <div class="suggest-chips">${suggs}</div>`;
}

function listBlock(sec, useTextarea) {
  const rows = (sec.items || []).map((it, i) => `
    <div class="bullet-row">
      ${useTextarea
        ? `<textarea class="textarea" data-sec="${sec.id}" data-item="${i}">${esc(it)}</textarea>`
        : `<input class="input" data-sec="${sec.id}" data-item="${i}" value="${escAttr(it)}" />`}
      <button class="mini-btn mini-btn--danger" data-action="item-del" data-sec="${sec.id}" data-item="${i}" title="Remove">X</button>
    </div>`).join("");
  return `${rows}<button class="add-link" data-action="item-add" data-sec="${sec.id}">+ Add item</button>`;
}

/* ---------- section body dispatch ---------- */
function sectionBody(sec) {
  const t = sec.type;
  if (t === "summary") return textArea("Text", `data-sectext="${sec.id}"`, sec.text, { ph: "2-4 lines on who you are and what you do best." });
  if (t === "experience") {
    return (sec.entries || []).map((e, i) => expEntry(sec, e, i, sec.entries.length)).join("") +
      `<button class="add-link" data-action="entry-add" data-sec="${sec.id}">+ Add role</button>`;
  }
  if (t === "education") {
    return (sec.entries || []).map((e, i) => eduEntry(sec, e, i, sec.entries.length)).join("") +
      `<button class="add-link" data-action="entry-add" data-sec="${sec.id}">+ Add education</button>`;
  }
  if (t === "projects") {
    return (sec.entries || []).map((e, i) => projEntry(sec, e, i, sec.entries.length)).join("") +
      `<button class="add-link" data-action="entry-add" data-sec="${sec.id}">+ Add project</button>`;
  }
  if (t === "custom") {
    return (sec.entries || []).map((e, i) => customEntry(sec, e, i, sec.entries.length)).join("") +
      `<button class="add-link" data-action="entry-add" data-sec="${sec.id}">+ Add item</button>`;
  }
  if (t === "skills") return skillsBlock(sec);
  if (t === "languages") return languagesBlock(sec);
  if (t === "publications") return listBlock(sec, true);
  return listBlock(sec, false);
}

/* ---------- section card ---------- */
function sectionCard(sec, idx, count) {
  const hidden = !!sec.hidden;
  return `<div class="sec ${sec._collapsed ? "is-collapsed" : ""}" data-seccard="${sec.id}" draggable="true">
    <div class="sec__head" data-action="toggle-collapse" data-sec="${sec.id}">
      <span class="sec__grip" title="Drag to reorder">::</span>
      <input class="sec__name-input input" style="background:transparent;border:none;padding:0;font-weight:700;flex:1 1 auto"
             data-sectitle="${sec.id}" value="${escAttr(sec.title)}" onclick="event.stopPropagation()" />
      <span class="sec__tools">
        <button class="mini-btn" data-action="sec-up" data-sec="${sec.id}" title="Move up" ${idx === 0 ? "disabled" : ""}>&uarr;</button>
        <button class="mini-btn" data-action="sec-down" data-sec="${sec.id}" title="Move down" ${idx === count - 1 ? "disabled" : ""}>&darr;</button>
        <button class="mini-btn" data-action="sec-hide" data-sec="${sec.id}" title="${hidden ? "Show" : "Hide"} on resume">${hidden ? "Show" : "Hide"}</button>
        <button class="mini-btn mini-btn--danger" data-action="sec-del" data-sec="${sec.id}" title="Delete section">Del</button>
      </span>
      <span class="sec__caret">v</span>
    </div>
    <div class="sec__body">${hidden ? '<div class="subtle" style="margin-bottom:8px">Hidden from resume - toggle Show to include it.</div>' : ""}${sectionBody(sec)}</div>
  </div>`;
}

/* ---------- basics card ---------- */
function basicsCard() {
  const b = RF.state.basics;
  const links = (b.links || []).map((l, i) => `
    <div class="field-row" style="margin-bottom:6px">
      <input class="input" data-link="${i}" data-key="label" value="${escAttr(l.label)}" placeholder="Label e.g. LinkedIn" />
      <div style="display:flex;gap:6px">
        <input class="input" data-link="${i}" data-key="url" value="${escAttr(l.url)}" placeholder="https://" />
        <button class="mini-btn mini-btn--danger" data-action="link-del" data-link="${i}" title="Remove">X</button>
      </div>
    </div>`).join("");
  return `<div class="sec" data-seccard="basics">
    <div class="sec__head" data-action="toggle-collapse" data-sec="basics">
      <span class="sec__grip" title="Drag to reorder">::</span>
      <span class="sec__name">Personal details</span>
      <span class="sec__caret">v</span>
    </div>
    <div class="sec__body">
      ${inputField("Full name", `data-bind="name"`, b.name, { ph: "Your Name" })}
      ${inputField("Headline / target role", `data-bind="headline"`, b.headline, { ph: "Software Engineer" })}
      <div class="field-row">
        ${inputField("Phone", `data-bind="phone"`, b.phone)}
        ${inputField("Email", `data-bind="email"`, b.email)}
      </div>
      ${inputField("Location", `data-bind="location"`, b.location, { ph: "City, Country" })}
      <label class="field__label" style="margin-top:4px">Links</label>
      ${links}
      <button class="add-link" data-action="link-add">+ Add link</button>
      <label class="checkrow">
        <input type="checkbox" data-toggle="showSocialIcons" ${RF.state.meta.showSocialIcons ? "checked" : ""} />
        <span>Show LinkedIn / GitHub icons next to links<br><span class="subtle">Colour on coloured templates, solid black on the classic B/W one.</span></span>
      </label>
    </div>
  </div>`;
}

/* ---------- datalists ---------- */
function datalists() {
  const dl = (id, arr) => `<datalist id="${id}">${arr.map(v => `<option value="${escAttr(v)}"></option>`).join("")}</datalist>`;
  return dl("dl-titles", RF.keywords.jobTitles) + dl("dl-degrees", RF.keywords.degrees);
}

/* ================= public ================= */
RF.editor.build = function () {
  const root = document.getElementById("editor-root");
  const cards = RF.state.sections.map((s, i) => sectionCard(s, i, RF.state.sections.length)).join("");
  root.innerHTML = datalists() + basicsCard() + cards;
  RF.editor.fillAddSectionMenu();
};

RF.editor.fillAddSectionMenu = function () {
  const sel = document.getElementById("add-section-select");
  if (!sel) return;
  sel.innerHTML = Object.entries(RF.SECTION_TYPES)
    .map(([k, v]) => `<option value="${k}">${esc(v.label)}</option>`).join("");
};
