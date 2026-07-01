/* ===========================================================
   render.js — build the real-text resume HTML from RF.state
   The same markup is used on screen AND for the PDF (print),
   so the preview is exactly what the user downloads.
   =========================================================== */
window.RF = window.RF || {};

RF.esc = function (s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
};

const _dates = (a, b) => {
  a = (a || "").trim(); b = (b || "").trim();
  if (a && b) return RF.esc(a) + " - " + RF.esc(b);
  return RF.esc(a || b);
};

const _bullets = (arr) => {
  const items = (arr || []).filter(x => x && x.trim());
  if (!items.length) return "";
  return '<ul class="r-bullets">' +
    items.map(b => "<li>" + RF.esc(b) + "</li>").join("") + "</ul>";
};

/* ---- per-type section body renderers ---- */
const SECTION_RENDER = {

  summary(sec) {
    if (!sec.text || !sec.text.trim()) return "";
    return '<p class="r-summary">' + RF.esc(sec.text) + "</p>";
  },

  experience(sec) {
    return (sec.entries || []).map(e => `
      <div class="r-entry">
        <div class="r-entry__row">
          <div class="r-entry__left"><span class="r-entry__title">${RF.esc(e.title)}</span></div>
          <div class="r-entry__right"><span class="r-entry__date">${_dates(e.start, e.end)}</span></div>
        </div>
        <div class="r-entry__row">
          <div class="r-entry__left"><span class="r-entry__sub">${RF.esc(e.org)}</span></div>
          <div class="r-entry__right">${RF.esc(e.location)}</div>
        </div>
        ${_bullets(e.bullets)}
      </div>`).join("");
  },

  custom(sec) {
    return (sec.entries || []).map(e => `
      <div class="r-entry">
        <div class="r-entry__row">
          <div class="r-entry__left"><span class="r-entry__title">${RF.esc(e.title)}</span></div>
          <div class="r-entry__right"><span class="r-entry__date">${_dates(e.start, e.end)}</span></div>
        </div>
        <div class="r-entry__row">
          <div class="r-entry__left"><span class="r-entry__sub">${RF.esc(e.subtitle)}</span></div>
          <div class="r-entry__right">${RF.esc(e.location)}</div>
        </div>
        ${_bullets(e.bullets)}
      </div>`).join("");
  },

  education(sec) {
    return (sec.entries || []).map(e => `
      <div class="r-entry">
        <div class="r-entry__row">
          <div class="r-entry__left"><span class="r-entry__title">${RF.esc(e.school)}</span></div>
          <div class="r-entry__right">${RF.esc(e.location)}</div>
        </div>
        <div class="r-entry__row">
          <div class="r-entry__left"><span class="r-entry__sub">${RF.esc(e.degree)}</span></div>
          <div class="r-entry__right"><span class="r-entry__date">${_dates(e.start, e.end)}</span></div>
        </div>
        ${_bullets(e.bullets)}
      </div>`).join("");
  },

  projects(sec) {
    return (sec.entries || []).map(e => {
      const head = e.tech && e.tech.trim()
        ? `<span class="r-entry__title">${RF.esc(e.name)}</span> | <span class="r-entry__sub">${RF.esc(e.tech)}</span>`
        : `<span class="r-entry__title">${RF.esc(e.name)}</span>`;
      return `
      <div class="r-entry">
        <div class="r-entry__row">
          <div class="r-entry__left">${head}</div>
          <div class="r-entry__right"><span class="r-entry__date">${_dates(e.start, e.end)}</span></div>
        </div>
        ${_bullets(e.bullets)}
      </div>`;
    }).join("");
  },

  skills(sec) {
    return (sec.groups || []).filter(g => (g.items || []).length).map(g =>
      `<div class="r-skillline"><b>${RF.esc(g.label)}:</b> ${RF.esc((g.items || []).join(", "))}</div>`
    ).join("");
  },

  publications(sec) {
    return (sec.items || []).filter(x => x && x.trim())
      .map(p => `<div class="r-pub">${RF.esc(p)}</div>`).join("");
  },

  languages(sec) {
    const items = (sec.items || []).filter(x => x && x.trim());
    if (!items.length) return "";
    return `<div class="r-skillline">${RF.esc(items.join("   |   "))}</div>`;
  },

  _list(sec) {
    return _bullets(sec.items);
  }
};
SECTION_RENDER.certifications = SECTION_RENDER._list;
SECTION_RENDER.awards = SECTION_RENDER._list;
SECTION_RENDER.customList = SECTION_RENDER._list;

/* ---- brand icons (optional, theme-matched) ---- */
const ICON_PATHS = {
  linkedin: "M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 11-.01-4.13 2.06 2.06 0 01.01 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.23 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.23 0z",
  github: "M12 .3a12 12 0 00-3.8 23.4c.6.1.82-.26.82-.58v-2.03c-3.34.73-4.04-1.6-4.04-1.6-.55-1.4-1.34-1.77-1.34-1.77-1.08-.74.09-.73.09-.73 1.2.08 1.83 1.23 1.83 1.23 1.07 1.83 2.8 1.3 3.49 1 .1-.78.42-1.3.76-1.6-2.66-.3-5.47-1.34-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.11-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 016.01 0c2.29-1.55 3.3-1.23 3.3-1.23.65 1.66.24 2.88.12 3.18.77.84 1.23 1.91 1.23 3.22 0 4.6-2.81 5.62-5.49 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.69.82.57A12 12 0 0012 .3z"
};
function brandIcon(kind, style) {
  const fill = kind === "linkedin" ? (style === "color" ? "#0A66C2" : "#111") : "#111";
  return `<svg class="r-ico" viewBox="0 0 24 24" width="11" height="11" aria-hidden="true"><path fill="${fill}" d="${ICON_PATHS[kind]}"/></svg>`;
}
function detectBrand(l) {
  const s = ((l.url || "") + " " + (l.label || "")).toLowerCase();
  if (s.includes("linkedin")) return "linkedin";
  if (s.includes("github")) return "github";
  return null;
}

/* ---- header ---- */
function renderHeader(b) {
  const showIcons = !!RF.state.meta.showSocialIcons;
  const style = RF.getTemplate(RF.state.meta.template).iconStyle || "mono";
  const parts = [];
  if (b.phone) parts.push(RF.esc(b.phone));
  if (b.location) parts.push(RF.esc(b.location));
  if (b.email) parts.push(`<a href="mailto:${RF.esc(b.email)}">${RF.esc(b.email)}</a>`);
  (b.links || []).forEach(l => {
    if (l && l.label) {
      const kind = showIcons ? detectBrand(l) : null;
      const ico = kind ? brandIcon(kind, style) : "";
      parts.push(`<a href="${RF.esc(l.url || "#")}">${ico}${RF.esc(l.label)}</a>`);
    }
  });
  const contact = parts.join('<span class="sep">|</span>');
  return `
    <div class="r-name">${RF.esc(b.name) || "Your Name"}</div>
    ${b.headline ? `<div class="r-headline">${RF.esc(b.headline)}</div>` : ""}
    <div class="r-contact">${contact}</div>`;
}

/* ---- whole resume ---- */
RF.buildResumeHTML = function () {
  const st = RF.state;
  const body = (st.sections || []).map(sec => {
    if (sec.hidden) return "";
    const fn = SECTION_RENDER[sec.type] || SECTION_RENDER._list;
    const inner = fn(sec);
    if (!inner) return "";
    return `<section class="r-section">
      <div class="r-section__title">${RF.esc(sec.title || (RF.SECTION_TYPES[sec.type] && RF.SECTION_TYPES[sec.type].label) || "Section")}</div>
      ${inner}
    </section>`;
  }).join("");
  return renderHeader(st.basics) + body;
};

/* render into a target element, applying template + page size */
RF.renderResume = function (el) {
  const tpl = RF.getTemplate(RF.state.meta.template);
  el.className = "resume-page " + tpl.cssClass;
  el.setAttribute("data-size", RF.state.meta.pageSize || "A4");
  el.style.setProperty("--accent", tpl.accent);
  el.innerHTML = RF.buildResumeHTML();
};

/* plain text version - used for ATS keyword scanning */
RF.resumePlainText = function () {
  const st = RF.state, out = [];
  const b = st.basics;
  out.push(b.name, b.headline, b.phone, b.location, b.email);
  (b.links || []).forEach(l => out.push(l.label));
  (st.sections || []).forEach(sec => {
    if (sec.hidden) return;
    out.push(sec.title);
    if (sec.text) out.push(sec.text);
    (sec.entries || []).forEach(e => {
      out.push(e.title, e.org, e.subtitle, e.degree, e.school, e.name, e.tech, e.location);
      (e.bullets || []).forEach(x => out.push(x));
    });
    (sec.groups || []).forEach(g => { out.push(g.label); (g.items || []).forEach(i => out.push(i)); });
    (sec.items || []).forEach(i => out.push(i));
  });
  return out.filter(Boolean).join("\n");
};
