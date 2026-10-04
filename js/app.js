const themeStorageKey = "n1-study:theme";
const themeToggles = document.querySelectorAll("[data-theme-toggle]");
const themeColorMeta = document.querySelector('meta[name="theme-color"]');
let themeChangeSequence = 0;

function readSavedTheme() {
  try {
    const savedTheme = localStorage.getItem(themeStorageKey);
    return savedTheme === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

function setTheme(theme, save = false) {
  const isDark = theme === "dark";
  const root = document.documentElement;
  const changeSequence = ++themeChangeSequence;
  root.classList.add("theme-changing");
  root.dataset.theme = isDark ? "dark" : "light";

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (changeSequence === themeChangeSequence) {
        root.classList.remove("theme-changing");
      }
    });
  });

  themeToggles.forEach((toggle) => {
    const label = isDark ? "切换到浅色模式" : "切换到暗色模式";
    toggle.setAttribute("aria-pressed", String(isDark));
    toggle.setAttribute("aria-label", label);
    toggle.title = label;
  });

  if (themeColorMeta) themeColorMeta.content = isDark ? "#171d26" : "#f7f8fa";

  if (save) {
    try {
      localStorage.setItem(themeStorageKey, isDark ? "dark" : "light");
    } catch {
      // Theme switching still works for this page when storage is unavailable.
    }
  }
}

setTheme(readSavedTheme());

themeToggles.forEach((toggle) => {
  toggle.addEventListener("click", () => {
    const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    setTheme(nextTheme, true);
  });
});


