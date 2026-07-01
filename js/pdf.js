/* ===========================================================
   pdf.js — download = browser "Save as PDF" on a real-text page.
   Selectable text -> fully ATS-parseable. Honours A4 / Letter.
   Page margins come from @page; the print clone flows naturally
   (see preview.css) so it won't spill onto a spurious 2nd page.
   =========================================================== */
window.RF = window.RF || {};
RF.pdf = {};

RF.pdf.applyPageSize = function () {
  const size = RF.state.meta.pageSize === "Letter" ? "Letter" : "A4";
  const margin = size === "Letter" ? "0.55in 0.6in" : "13mm 14mm";
  const styleEl = document.getElementById("page-size-style");
  styleEl.textContent = "@page { size: " + size + " portrait; margin: " + margin + "; }";
  const page = document.getElementById("resume-page");
  if (page) page.setAttribute("data-size", size);
};

RF.pdf.download = function () {
  // 1. render a clean copy into the dedicated print container
  const area = document.getElementById("print-area");
  const page = document.createElement("div");
  RF.renderResume(page);                 // applies template + page size
  page.style.boxShadow = "none";
  page.style.zoom = "1";
  area.innerHTML = "";
  area.appendChild(page);

  RF.pdf.applyPageSize();

  // 2. nicer default filename via the document title
  const safeName = (RF.state.basics.name || "resume").replace(/[^\w\-]+/g, "_");
  const prevTitle = document.title;
  document.title = safeName + "_Resume";

  // 3. print only the print-area
  document.body.classList.add("is-printing");

  const cleanup = () => {
    document.body.classList.remove("is-printing");
    area.innerHTML = "";
    document.title = prevTitle;
    window.removeEventListener("afterprint", cleanup);
  };
  window.addEventListener("afterprint", cleanup);

  setTimeout(() => window.print(), 60);
  setTimeout(() => { if (document.body.classList.contains("is-printing")) cleanup(); }, 4000);
};
