/* ===========================================================
   theme.js — light / dark toggle with persistence
   =========================================================== */
window.RF = window.RF || {};
RF.theme = {};

const THEME_KEY = "resumeforge.theme";

RF.theme.apply = function (mode) {
  document.documentElement.setAttribute("data-theme", mode);
  const icon = document.querySelector("#theme-toggle .theme-icon");
  if (icon) icon.textContent = mode === "dark" ? "☀️" : "🌙";
  try { localStorage.setItem(THEME_KEY, mode); } catch (e) {}
};

RF.theme.init = function () {
  let mode = null;
  try { mode = localStorage.getItem(THEME_KEY); } catch (e) {}
  if (!mode) mode = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  RF.theme.apply(mode);
};

RF.theme.toggle = function () {
  const cur = document.documentElement.getAttribute("data-theme");
  RF.theme.apply(cur === "dark" ? "light" : "dark");
};
