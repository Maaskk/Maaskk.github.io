const views = [...document.querySelectorAll("[data-view]")];
const viewLinks = [...document.querySelectorAll("[data-view-link]")];
const pageLabel = document.querySelector("[data-page-label]");
const searchInput = document.querySelector("[data-search-input]");
const cards = [...document.querySelectorAll("[data-post-card]")];
const emptySearch = document.querySelector("[data-empty-search]");
const count = document.querySelector("[data-visible-count]");
const menuButton = document.querySelector(".menu-button");
const tocLinks = [...document.querySelectorAll("[data-toc-link]")];
const articleSections = [
  ...document.querySelectorAll(".article-section[id], .comments[id]"),
];
const readingProgress = document.querySelector(".reading-progress span");

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
  if (
    !document.body.classList.contains("nav-open") ||
    event.target.closest(".profile-rail") ||
    event.target.closest(".menu-button")
  ) {
    return;
  }
  document.body.classList.remove("nav-open");
  menuButton?.setAttribute("aria-expanded", "false");
});

for (const link of tocLinks) {
  link.addEventListener("click", (event) => {
    const id = link.getAttribute("href")?.slice(1);
    const target = id ? document.getElementById(id) : null;
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    history.replaceState(null, "", `#${id}`);
    link.closest("details")?.removeAttribute("open");
  });
}

function markActiveSection(id) {
  for (const link of tocLinks) {
    const active = link.getAttribute("href") === `#${id}`;
    link.classList.toggle("active", active);
    if (active) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  }
}

if (articleSections.length && "IntersectionObserver" in window) {
  const visibleSections = new Map();
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          visibleSections.set(entry.target.id, entry.boundingClientRect.top);
        } else {
          visibleSections.delete(entry.target.id);
        }
      }
      const active = [...visibleSections.entries()].sort(
        (a, b) => Math.abs(a[1]) - Math.abs(b[1]),
      )[0];
      if (active) markActiveSection(active[0]);
    },
    { rootMargin: "-18% 0px -68% 0px", threshold: [0, 0.1, 0.5] },
  );
  for (const section of articleSections) observer.observe(section);
}

function updateReadingProgress() {
  if (!readingProgress) return;
  const scrollable =
    document.documentElement.scrollHeight - document.documentElement.clientHeight;
  const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
  readingProgress.style.transform = `scaleX(${Math.min(1, Math.max(0, progress))})`;
}

if (readingProgress) {
  updateReadingProgress();
  window.addEventListener("scroll", updateReadingProgress, { passive: true });
  window.addEventListener("resize", updateReadingProgress);
}

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
