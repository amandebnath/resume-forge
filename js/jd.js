/* ===========================================================
   jd.js — job-description extraction engine (offline, no deps)
   Pulls SKILLS, JOB ROLE, LOCATION and OTHER keywords out of a
   pasted JD and marks which are already present in the resume.
   =========================================================== */
window.RF = window.RF || {};
RF.jd = {};

/* ---- small text utils ---- */
function jdTokenize(text) {
  return new Set((text.toLowerCase().match(/[a-z0-9+#.]+/g) || []));
}
function jdContains(textLower, tokenSet, kw) {
  const k = kw.toLowerCase().trim();
  if (/[ \-\/.&]/.test(k)) return textLower.includes(k);
  return tokenSet.has(k);
}
function titleCase(s) {
  return s.replace(/\s+/g, " ").trim().replace(/\b([a-z])/g, (m, c) => c.toUpperCase());
}

/* ---- dictionaries ---- */
RF.jd.workModes = ["Remote", "Hybrid", "On-site", "Onsite", "Work From Home", "In-office", "Relocation"];

RF.jd.roleNouns = ["engineer","developer","designer","manager","analyst","scientist","researcher",
  "architect","consultant","specialist","administrator","coordinator","director","strategist",
  "associate","intern","programmer","marketer","writer","accountant","recruiter","lead","officer"];

RF.jd.places = [
  // work-mode handled separately; here: cities, states, countries
  "Bengaluru","Bangalore","Mumbai","Delhi","New Delhi","Gurugram","Gurgaon","Noida","Hyderabad",
  "Chennai","Pune","Kolkata","Ahmedabad","Jaipur","Kochi","India",
  "San Francisco","New York","Seattle","Austin","Boston","Chicago","Los Angeles","Denver","Atlanta",
  "Dallas","Houston","Washington","San Jose","Mountain View","Palo Alto","United States","USA","Canada",
  "Toronto","Vancouver","London","Manchester","United Kingdom","UK","Berlin","Munich","Germany","Paris",
  "France","Amsterdam","Netherlands","Dublin","Ireland","Zurich","Switzerland","Singapore","Dubai","UAE",
  "Sydney","Melbourne","Australia","Tokyo","Japan","Remote-first"];

RF.jd.otherDict = [
  "Agile","Scrum","Kanban","Waterfall","Stakeholder Management","Communication","Leadership",
  "Problem Solving","Teamwork","Collaboration","Time Management","Cross-functional","Mentoring",
  "Mentorship","Roadmap","KPIs","OKRs","Budgeting","Forecasting","Reporting","Presentation",
  "Negotiation","Project Management","Product Management","Program Management","Data Analysis",
  "A/B Testing","Public Speaking","Customer Service","Strategic Planning","Process Improvement",
  "Risk Management","Vendor Management","Quality Assurance","Documentation","Analytical Skills",
  "Attention to Detail","Adaptability","Critical Thinking","Ownership","Stakeholder",
  "MBA","Bachelor's Degree","Master's Degree","PhD","PMP","Scrum Master","Six Sigma","AWS Certified"];

/* skill dictionary = role dicts + master + common extras (deduped) */
let _skillDict = null;
RF.jd.skillDict = function () {
  if (_skillDict) return _skillDict;
  const set = new Set();
  Object.values(RF.keywords.skillsByRole).forEach(groups =>
    Object.values(groups).forEach(arr => arr.forEach(k => set.add(k))));
  (RF.keywords.master || []).forEach(k => set.add(k));
  ["GraphQL","REST","gRPC","Redis","Kafka","RabbitMQ","Elasticsearch","MongoDB","MySQL","PostgreSQL",
   "Redux","Vue","Angular","Svelte","Sass","Tailwind","Webpack","Vite","Jest","Cypress","Selenium",
   "Photoshop","Illustrator","InDesign","After Effects","Premiere Pro","Blender","Unity","Figma","Sketch",
   "TensorFlow","PyTorch","Keras","Pandas","NumPy","Spark","Hadoop","Airflow","Tableau","Power BI","Looker",
   "Excel","Jira","Confluence","Git","CI/CD","Linux","Bash","Terraform","Ansible","Azure","Kubernetes","Docker"
  ].forEach(k => set.add(k));
  _skillDict = Array.from(set);
  return _skillDict;
};

/* ---- extractors ---- */
function dictHits(text, dict, limit) {
  const tl = text.toLowerCase(), tk = jdTokenize(text);
  const out = [], seen = new Set();
  dict.forEach(s => {
    const k = s.toLowerCase();
    if (!seen.has(k) && jdContains(tl, tk, s)) { seen.add(k); out.push(s); }
  });
  return limit ? out.slice(0, limit) : out;
}

function extractRoles(text) {
  const found = new Map();
  const tl = text.toLowerCase(), tk = jdTokenize(text);
  RF.keywords.jobTitles.forEach(t => { if (jdContains(tl, tk, t)) found.set(t.toLowerCase(), t); });
  const re = new RegExp(
    "\\b((?:senior|junior|lead|staff|principal|chief|head of|sr|jr)\\s+)?([a-z][a-z]+(?:\\s+[a-z][a-z]+)?)\\s+(" +
    RF.jd.roleNouns.join("|") + ")\\b", "gi");
  let m;
  while ((m = re.exec(tl))) {
    let phrase = ((m[1] || "") + m[2] + " " + m[3]).replace(/\s+/g, " ").trim();
    let words = phrase.split(" ");
    while (words.length && RF.keywords.stopwords.has(words[0])) words.shift();
    phrase = words.join(" ");
    if (phrase.split(" ").length >= 2 && phrase.length <= 40) found.set(phrase.toLowerCase(), titleCase(phrase));
  }
  return Array.from(found.values()).slice(0, 6);
}

function extractLocations(text) {
  const out = new Map();
  const tl = text.toLowerCase(), tk = jdTokenize(text);
  RF.jd.workModes.forEach(w => { if (jdContains(tl, tk, w)) out.set(w.toLowerCase(), w); });
  RF.jd.places.forEach(p => { if (jdContains(tl, tk, p)) out.set(p.toLowerCase(), titleCase(p)); });
  let m;
  const re = /(?:based in|located in|location\s*:|office in|work location\s*:)\s*([a-z][a-zA-Z.\- ]{2,30})/gi;
  while ((m = re.exec(text))) {
    const loc = m[1].split(/[,.;\n]/)[0].trim();
    if (loc.length > 1) out.set(loc.toLowerCase(), titleCase(loc));
  }
  const re2 = /\b([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)?),\s*([A-Z]{2})\b/g;
  while ((m = re2.exec(text))) { const loc = m[1] + ", " + m[2]; out.set(loc.toLowerCase(), loc); }
  return Array.from(out.values()).slice(0, 6);
}

function extractOther(text) {
  const out = dictHits(text, RF.jd.otherDict, 0);
  const ym = text.toLowerCase().match(/(\d+)\s*\+?\s*years?/);
  if (ym) out.push(ym[1] + "+ years experience");
  const seen = new Set(); const dedup = [];
  out.forEach(o => { const k = o.toLowerCase(); if (!seen.has(k)) { seen.add(k); dedup.push(o); } });
  return dedup.slice(0, 12);
}

/* ---- main ---- */
RF.jd.analyze = function (jd) {
  jd = jd || "";
  const resume = RF.resumePlainText();
  const rl = resume.toLowerCase(), rk = jdTokenize(resume);
  const seen = new Set();
  const mark = (arr) => {
    const out = [];
    arr.forEach(t => {
      const k = t.toLowerCase();
      if (seen.has(k)) return;          // claimed by an earlier category
      seen.add(k);
      out.push({ term: t, inResume: jdContains(rl, rk, t) });
    });
    return out;
  };
  // priority: role > location > other (soft/process) > skills (hard).
  // marking "other" before "skills" keeps soft skills out of the Skills bucket.
  const roles = mark(extractRoles(jd));
  const locations = mark(extractLocations(jd));
  const other = mark(extractOther(jd));
  const skills = mark(dictHits(jd, RF.jd.skillDict(), 0).slice(0, 28));

  const all = skills.concat(other);
  const matched = all.filter(x => x.inResume).length;
  const pct = all.length ? Math.round((matched / all.length) * 100) : 0;
  return { roles, locations, skills, other, matchPct: pct, matchedCount: matched, totalCount: all.length };
};
