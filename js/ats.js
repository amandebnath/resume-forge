/* ===========================================================
   ats.js — right panel: live ATS score + checklist,
   role-based suggested keywords, and JD tailoring (categorized).
   =========================================================== */
window.RF = window.RF || {};
RF.ats = { _tab: "checklist", _jd: "", _jdResult: null };

function tokenize(text) { return new Set((text.toLowerCase().match(/[a-z0-9+#.]+/g) || [])); }
function contains(text, tokenSet, kw) {
  const k = kw.toLowerCase().trim();
  if (/[ \-\/]/.test(k)) return text.includes(k);
  return tokenSet.has(k);
}

/* ================= scoring ================= */
RF.ats.analyze = function () {
  const st = RF.state, b = st.basics;
  const checks = [];
  const add = (status, title, desc, weight) => checks.push({ status, title, desc, weight });

  const expSecs = st.sections.filter(s => !s.hidden && (s.type === "experience" || s.type === "custom"));
  const allEntries = expSecs.flatMap(s => s.entries || []);
  const projSecs = st.sections.filter(s => !s.hidden && s.type === "projects");
  const projEntries = projSecs.flatMap(s => s.entries || []);
  const eduSecs = st.sections.filter(s => !s.hidden && s.type === "education");
  const skillSecs = st.sections.filter(s => !s.hidden && s.type === "skills");
  const skillCount = skillSecs.flatMap(s => (s.groups || []).flatMap(g => g.items || [])).length;
  const allBullets = allEntries.flatMap(e => e.bullets || []).concat(projEntries.flatMap(e => e.bullets || [])).filter(x => x && x.trim());

  add(b.name ? "good" : "bad", b.name ? "Name present" : "Name missing",
      b.name ? "Your name helps recruiters identify you." : "Add your full name at the top.", 8);

  const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(b.email || "");
  add(emailOk ? "good" : "bad", emailOk ? "Email present" : "Email missing or invalid",
      emailOk ? "A valid email is essential - 75% of recruiters expect one." : "Add a valid email address.", 8);

  add(b.phone ? "good" : "warn", b.phone ? "Phone present" : "Phone missing",
      b.phone ? "Phone number lets recruiters reach you fast." : "Add a phone number.", 5);

  add(b.location ? "good" : "warn", b.location ? "Location present" : "Location missing",
      b.location ? "Location gives recruiters useful context." : "Add your city - it can give you an edge over applicants far from the role.", 6);

  const hasLink = (b.links || []).some(l => l.label && l.url);
  add(hasLink ? "good" : "warn", hasLink ? "Profile link present" : "No profile / portfolio link",
      hasLink ? "Links to LinkedIn / portfolio add credibility." : "Add a LinkedIn, GitHub or portfolio link.", 4);

  const summarySec = st.sections.find(s => !s.hidden && s.type === "summary");
  const sumWords = summarySec && summarySec.text ? summarySec.text.trim().split(/\s+/).length : 0;
  add(sumWords >= 25 ? "good" : "warn",
      sumWords >= 25 ? "Strong summary" : "Summary too short",
      sumWords >= 25 ? "A focused summary frames the rest of your resume." : "Aim for 25-60 words summarising your value.", 5);

  add(allEntries.length || projEntries.length ? "good" : "bad",
      allEntries.length || projEntries.length ? "Experience / projects present" : "No experience or projects",
      allEntries.length || projEntries.length ? "Recruiters scan experience first." : "Add at least one role or project.", 9);

  const missingLoc = allEntries.filter(e => !e.location).length;
  add(allEntries.length === 0 ? "warn" : (missingLoc === 0 ? "good" : "warn"),
      missingLoc === 0 ? "Company locations present" : `Company location missing (${missingLoc})`,
      missingLoc === 0 ? "Locations give context to each role." : "Add a location to each work entry - recruiters look for it.", 5);

  const missingDates = allEntries.filter(e => !(e.start || e.end)).length;
  add(allEntries.length === 0 ? "warn" : (missingDates === 0 ? "good" : "warn"),
      missingDates === 0 ? "Dates present" : `Dates missing (${missingDates})`,
      missingDates === 0 ? "Clear dates show a consistent timeline." : "Add start/end dates to each role.", 5);

  const verbs = RF.keywords.actionVerbs;
  const verbStarts = allBullets.filter(t => verbs.includes(t.trim().split(/\s+/)[0].toLowerCase().replace(/[^a-z]/g, ""))).length;
  const verbPct = allBullets.length ? verbStarts / allBullets.length : 0;
  add(allBullets.length === 0 ? "warn" : (verbPct >= 0.6 ? "good" : "warn"),
      verbPct >= 0.6 ? "Action-verb bullets" : "Weak bullet openers",
      verbPct >= 0.6 ? "Most bullets start with strong action verbs." : "Start bullets with verbs like Led, Built, Improved.", 6);

  const quantified = allBullets.filter(t => /\d/.test(t)).length;
  add(allBullets.length === 0 ? "warn" : (quantified >= Math.max(1, Math.ceil(allBullets.length * 0.3)) ? "good" : "warn"),
      quantified >= 1 ? "Quantified achievements" : "No measurable results",
      quantified >= 1 ? "Numbers make impact concrete and ATS-friendly." : "Add metrics (%, $, time, scale) to your bullets.", 7);

  add(eduSecs.length ? "good" : "bad", eduSecs.length ? "Education present" : "Education missing",
      eduSecs.length ? "Education is a standard expected section." : "Add an Education section.", 6);

  add(skillCount >= 6 ? "good" : "warn", skillCount >= 6 ? "Skills listed" : "Add more skills",
      skillCount >= 6 ? `${skillCount} skills help keyword matching.` : "List at least 6 relevant skills for ATS keyword matching.", 6);

  const longBullet = allBullets.some(t => t.length > 240);
  add(longBullet ? "warn" : "good", longBullet ? "Some bullets are long" : "Bullet length looks good",
      longBullet ? "Keep bullets to 1-2 lines for readability." : "Concise bullets read and parse well.", 3);

  let got = 0, total = 0;
  checks.forEach(c => { total += c.weight; got += c.weight * (c.status === "good" ? 1 : c.status === "warn" ? 0.5 : 0); });
  const score = Math.round((got / total) * 100);

  const order = { bad: 0, warn: 1, good: 2 };
  checks.sort((a, b2) => order[a.status] - order[b2.status]);
  return { score, checks };
};

/* ================= suggested keywords (template role) ================= */
RF.ats.suggestedKeywords = function () {
  const role = RF.getTemplate(RF.state.meta.template).role;
  const dict = RF.keywords.skillsByRole[role] || {};
  const present = tokenize(RF.resumePlainText());
  const fullText = RF.resumePlainText().toLowerCase();
  const pool = [];
  Object.values(dict).forEach(a => a.forEach(k => pool.push(k)));
  return pool.filter(k => !contains(fullText, present, k)).slice(0, 14);
};

/* ================= JD tailoring ================= */
RF.ats.runJD = function (jd) {
  RF.ats._jd = jd;
  RF.ats._jdResult = jd && jd.trim() ? RF.jd.analyze(jd) : null;
  RF.ats.render();
};

/* apply actions */
RF.ats.addKeyword = function (kw) {
  let sk = RF.state.sections.find(s => s.type === "skills");
  if (!sk) {
    sk = { id: RF.uid(), type: "skills", title: "Skills", groups: [{ label: "Core Skills", items: [] }] };
    RF.state.sections.push(sk);
  }
  if (!sk.groups || !sk.groups.length) sk.groups = [{ label: "Core Skills", items: [] }];
  const g = sk.groups[sk.groups.length - 1];
  if (!g.items.map(x => x.toLowerCase()).includes(kw.toLowerCase())) g.items.push(kw);
  RF.app.refreshAll();
};
RF.ats.setHeadline = function (v) { RF.state.basics.headline = v; RF.app.refreshAll(); };
RF.ats.setLocation = function (v) { RF.state.basics.location = v; RF.app.refreshAll(); };

/* ================= render ================= */
function gauge(score) {
  const r = 30, c = 2 * Math.PI * r;
  const off = c * (1 - score / 100);
  const col = score >= 80 ? "var(--good)" : score >= 60 ? "var(--warn)" : "var(--bad)";
  return `<div class="gauge" style="--col:${col}">
    <svg width="74" height="74" viewBox="0 0 74 74">
      <circle class="gauge__track" cx="37" cy="37" r="${r}" fill="none" stroke-width="7"></circle>
      <circle class="gauge__bar" cx="37" cy="37" r="${r}" fill="none" stroke-width="7"
        stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}"></circle>
    </svg>
    <div class="gauge__num">${score}%</div>
  </div>`;
}

function jdCategory(title, items, addAction) {
  if (!items || !items.length) return "";
  const missing = items.filter(i => !i.inResume);
  const have = items.filter(i => i.inResume);
  let h = `<div class="kw-section-title">${RF.esc(title)}</div>`;
  if (missing.length)
    h += `<div class="suggest-chips">${missing.map(i =>
      `<button class="suggest-chip" data-action="${addAction}" data-val="${RF.esc(i.term)}">${RF.esc(i.term)}</button>`).join("")}</div>`;
  if (have.length)
    h += `<div class="chips" style="margin-top:6px">${have.map(i =>
      `<span class="chip chip--have" title="Already in your resume">${RF.esc(i.term)}</span>`).join("")}</div>`;
  return h;
}

function jdResultBlocks(jr) {
  const totalDetected = jr.roles.length + jr.locations.length + jr.skills.length + jr.other.length;
  if (!totalDetected) return `<div class="empty-note">No clear keywords detected - try pasting more of the job description.</div>`;
  const barCol = jr.matchPct >= 70 ? "var(--good)" : jr.matchPct >= 40 ? "var(--warn)" : "var(--bad)";
  return `
    <div class="kw-section-title">Skill match - ${jr.matchPct}% (${jr.matchedCount}/${jr.totalCount})</div>
    <div class="match-bar"><div class="match-bar__fill" style="width:${jr.matchPct}%;background:${barCol}"></div></div>
    ${jdCategory("Job role - click to set as your headline", jr.roles, "ats-sethead")}
    ${jdCategory("Location - click to set", jr.locations, "ats-setloc")}
    ${jdCategory("Skills to add", jr.skills, "ats-addkw")}
    ${jdCategory("Other keywords", jr.other, "ats-addkw")}`;
}

RF.ats.render = function () {
  const root = document.getElementById("ats-root");
  if (!root) return;
  const { score, checks } = RF.ats.analyze();
  const problems = checks.filter(c => c.status !== "good").length;
  const tip = score >= 80 ? "Strong - minor polish left." : score >= 60 ? "Decent - fix the flagged items to climb higher." : "Needs work - resolve the red items first.";

  // keep JD match status live as the resume changes
  if (RF.ats._jd && RF.ats._jdResult) RF.ats._jdResult = RF.jd.analyze(RF.ats._jd);

  const checklistHTML = checks.map(c => `
    <div class="check">
      <span class="check__icon check__icon--${c.status}">${c.status === "good" ? "+" : "!"}</span>
      <div class="check__body">
        <div class="check__title">${RF.esc(c.title)}</div>
        <div class="check__desc">${RF.esc(c.desc)}</div>
      </div>
    </div>`).join("");

  const suggs = RF.ats.suggestedKeywords();
  const suggHTML = suggs.length
    ? `<div class="suggest-chips">${suggs.map(s => `<button class="suggest-chip" data-action="ats-addkw" data-val="${RF.esc(s)}">${RF.esc(s)}</button>`).join("")}</div>`
    : `<div class="empty-note">Nice - your resume already covers the common keywords for this template.</div>`;

  const tabChecklist = RF.ats._tab === "checklist";
  const jr = RF.ats._jdResult;

  root.innerHTML = `
    <div class="score-card">
      ${gauge(score)}
      <div class="score-meta">
        <div class="score-meta__title">ATS readiness</div>
        <div class="score-meta__sub">${RF.esc(tip)}</div>
      </div>
    </div>

    <div class="tabs">
      <button class="tab ${tabChecklist ? "is-active" : ""}" data-action="ats-tab" data-tab="checklist">
        Checklist ${problems ? `<span class="tab__count">${problems}</span>` : ""}
      </button>
      <button class="tab ${!tabChecklist ? "is-active" : ""}" data-action="ats-tab" data-tab="tailor">Tailor to JD</button>
    </div>

    ${tabChecklist ? `<div class="checklist">${checklistHTML}</div>` : `
      <div class="kw-section-title">Paste a job description</div>
      <textarea class="textarea" id="jd-input" style="min-height:120px"
        placeholder="Paste the full job description here - skills, role, location and other keywords are captured automatically.">${RF.esc(RF.ats._jd)}</textarea>
      <button class="btn btn--primary btn--block" id="jd-analyze" style="margin-top:8px">Analyze &amp; tailor</button>
      ${jr ? jdResultBlocks(jr) : `<div class="empty-note">After you paste, the captured keywords appear here automatically.</div>`}
      <hr class="divider" />
      <div class="kw-section-title">Suggested keywords for this template</div>
      ${suggHTML}
    `}
  `;
};
