const views = [...document.querySelectorAll("[data-view]")];
const viewLinks = [...document.querySelectorAll("[data-view-link]")];
const pageLabel = document.querySelector("[data-page-label]");
const searchInput = document.querySelector("[data-search-input]");
const cards = [...document.querySelectorAll("[data-post-card]")];
const emptySearch = document.querySelector("[data-empty-search]");
const count = document.querySelector("[data-visible-count]");
const menuButton = document.querySelector(".menu-button");

function showView(requested) {
  if (!views.length) return;
  const name = views.some((view) => view.dataset.view === requested)
    ? requested
    : "home";
  for (const view of views) {
    const active = view.dataset.view === name;
    view.hidden = !active;
    view.classList.toggle("active", active);
  }
  for (const link of viewLinks) {
    link.classList.toggle("active", link.dataset.viewLink === name);
  }
  if (pageLabel) {
    pageLabel.textContent = name[0].toUpperCase() + name.slice(1);
  }
  document.body.classList.remove("nav-open");
  menuButton?.setAttribute("aria-expanded", "false");
}

function routeFromHash() {
  showView(location.hash.slice(1) || "home");
}

function filterCards(term) {
  const query = term.trim().toLowerCase();
  let visible = 0;
  for (const card of cards) {
    const matches = !query || card.dataset.search.includes(query);
    card.hidden = !matches;
    if (matches) visible += 1;
  }
  if (count) count.textContent = String(visible);
  if (emptySearch) emptySearch.hidden = visible !== 0;
}

window.addEventListener("hashchange", routeFromHash);
routeFromHash();

searchInput?.addEventListener("input", (event) => {
  if (location.hash !== "#home") {
    location.hash = "home";
  }
  filterCards(event.currentTarget.value);
});

document.addEventListener("keydown", (event) => {
  if (
    event.key === "/" &&
    searchInput &&
    document.activeElement?.tagName !== "INPUT" &&
    document.activeElement?.tagName !== "TEXTAREA"
  ) {
    event.preventDefault();
    searchInput.focus();
  }
  if (event.key === "Escape") {
    document.body.classList.remove("nav-open");
    menuButton?.setAttribute("aria-expanded", "false");
    searchInput?.blur();
  }
});

menuButton?.addEventListener("click", () => {
  const open = document.body.classList.toggle("nav-open");
  menuButton.setAttribute("aria-expanded", String(open));
});

document.addEventListener("click", (event) => {
  const category = event.target.closest("[data-category-filter]");
  const tag = event.target.closest("[data-tag-filter]");
  const filter = category?.dataset.categoryFilter || tag?.dataset.tagFilter;
  if (filter && searchInput) {
    searchInput.value = filter;
    filterCards(filter);
  }
});

const year = document.querySelector("[data-year]");
if (year) year.textContent = String(new Date().getFullYear());
