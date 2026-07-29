const buttons = [...document.querySelectorAll("[data-filter]")];
const rows = [...document.querySelectorAll("[data-platform]")];

for (const button of buttons) {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;
    for (const item of buttons) {
      item.classList.toggle("active", item === button);
      item.setAttribute("aria-pressed", item === button ? "true" : "false");
    }
    for (const row of rows) {
      row.hidden = filter !== "All" && row.dataset.platform !== filter;
    }
    const count = rows.filter((row) => !row.hidden).length;
    const counter = document.querySelector("[data-visible-count]");
    if (counter) counter.textContent = String(count).padStart(2, "0");
  });
}

const year = document.querySelector("[data-year]");
if (year) year.textContent = String(new Date().getFullYear());
