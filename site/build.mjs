import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "dist");
const siteUrl = "https://maaskk.github.io";
const githubUrl = "https://github.com/Maaskk";
const htbUrl = "https://app.hackthebox.com/profile/f1leo";

const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const safeUrl = (value = "") => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:"
      ? escapeHtml(url.toString())
      : "";
  } catch {
    return "";
  }
};

const formatDate = (value) =>
  new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${String(value).slice(0, 10)}T00:00:00.000Z`));

const readingTime = (post) => {
  const words = [
    post.summary,
    post.recon,
    post.path,
    post.escalation,
    post.lessons,
  ]
    .join(" ")
    .trim()
    .split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 210));
};

const paragraphs = (value = "") =>
  String(value)
    .trim()
    .split(/\n{2,}/)
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replaceAll("\n", "<br>")}</p>`)
    .join("");

const raw = JSON.parse(
  await readFile(path.join(root, "content", "journal.json"), "utf8"),
);
const posts = raw
  .filter((post) => post && post.slug && post.title && post.summary)
  .sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );

const mark = `
  <svg aria-hidden="true" viewBox="0 0 48 48" class="brand-mark">
    <path d="M8 8h32v32H8z"></path>
    <path d="M14 16h20M14 24h12M14 32h20"></path>
    <path d="m29 22 5 5-5 5"></path>
  </svg>`;

function layout({ title, description, canonical, content, article = false }) {
  const pageTitle =
    title === "F1LEO — Field Notes" ? title : `${title} — F1LEO`;
  const url = `${siteUrl}${canonical}`;
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="theme-color" content="#0b0b0a">
    <meta name="description" content="${escapeHtml(description)}">
    <link rel="canonical" href="${url}">
    <link rel="alternate" type="application/rss+xml" title="F1LEO Field Notes" href="${siteUrl}/rss.xml">
    <link rel="stylesheet" href="/styles.css">
    <link rel="icon" href="/favicon.svg" type="image/svg+xml">
    <meta property="og:type" content="${article ? "article" : "website"}">
    <meta property="og:title" content="${escapeHtml(pageTitle)}">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:url" content="${url}">
    <meta property="og:image" content="${siteUrl}/og.jpg">
    <meta name="twitter:card" content="summary_large_image">
    <title>${escapeHtml(pageTitle)}</title>
  </head>
  <body>
    <div class="noise" aria-hidden="true"></div>
    <header class="site-header">
      <a href="/" class="brand" aria-label="F1LEO Field Notes home">
        ${mark}
        <span><b>F1LEO</b><small>FIELD NOTES / #MA</small></span>
      </a>
      <nav aria-label="Primary navigation">
        <a href="/#notes">Notes</a>
        <a href="/#protocol">Protocol</a>
        <a href="${githubUrl}" target="_blank" rel="noreferrer">GitHub ↗</a>
        <a href="${htbUrl}" target="_blank" rel="noreferrer" title="Hack The Box handle: f1leo #MA">HTB ↗</a>
      </nav>
    </header>
    ${content}
    <footer class="site-footer">
      <div>
        <span class="eyebrow">END OF TRANSMISSION</span>
        <p>Built from evidence, not aesthetics alone.</p>
      </div>
      <div class="footer-links">
        <a href="/rss.xml">RSS</a>
        <a href="${githubUrl}" target="_blank" rel="noreferrer">Source ↗</a>
      </div>
      <p class="footer-signature">f1leo // #MA · <span data-year>2026</span></p>
    </footer>
    <script src="/app.js" defer></script>
  </body>
</html>`;
}

function noteRow(post, index) {
  return `
    <a href="/notes/${escapeHtml(post.slug)}/" class="note-row" data-platform="${escapeHtml(post.platform)}">
      <span class="row-index">${String(index + 1).padStart(2, "0")}</span>
      <div class="row-title">
        <div class="row-tags">
          <span>${escapeHtml(post.platform)}</span>
          <span>${escapeHtml(post.difficulty)}</span>
          ${post.status === "active" ? '<span class="safe-label">SPOILER-SAFE</span>' : ""}
        </div>
        <h3>${escapeHtml(post.title)}</h3>
        <p>${escapeHtml(post.summary)}</p>
      </div>
      <div class="row-meta">
        <span>${formatDate(post.completedAt)}</span>
        <span>${escapeHtml(post.operatingSystem)}</span>
        <b>↗</b>
      </div>
    </a>`;
}

const featured = posts.find((post) => post.featured) ?? posts[0];
const htbCount = posts.filter((post) => post.platform === "Hack The Box").length;
const toolCount = new Set(posts.flatMap((post) => post.tools ?? [])).size;
const filters = ["All", "Hack The Box", "PortSwigger", "CTF", "Home Lab", "Research"];

const home = layout({
  title: "F1LEO — Field Notes",
  description:
    "Machines. Methods. Mistakes worth remembering. An offensive security field journal by f1leo.",
  canonical: "/",
  content: `
  <main>
    <section class="hero">
      <div class="hero-rail" aria-hidden="true">
        <span>35.7595° N</span><span>05.8340° W</span>
      </div>
      <div class="hero-copy">
        <span class="eyebrow">OFFENSIVE SECURITY / PERSONAL ARCHIVE</span>
        <h1>Machines. Methods.<br><em>Mistakes worth remembering.</em></h1>
        <p>A field journal by <strong>f1leo</strong>, documenting labs, attack paths, failed assumptions, and the lessons left after root.</p>
        <div class="hero-actions">
          <a href="#notes" class="button-primary">Enter the archive <span>↓</span></a>
          <a href="${githubUrl}" target="_blank" rel="noreferrer" class="button-quiet">github.com/Maaskk ↗</a>
        </div>
      </div>
      <div class="hero-signal" aria-hidden="true">
        <div class="signal-orbit orbit-one"></div>
        <div class="signal-orbit orbit-two"></div>
        <div class="signal-orbit orbit-three"></div>
        <div class="signal-core"><span>F1</span><small>LEO</small></div>
        <p>OBSERVE → TEST → DOCUMENT</p>
      </div>
      <div class="hero-stats">
        <div><strong>${String(posts.length).padStart(2, "0")}</strong><span>published notes</span></div>
        <div><strong>${String(htbCount).padStart(2, "0")}</strong><span>HTB records</span></div>
        <div><strong>${String(toolCount).padStart(2, "0")}</strong><span>tools indexed</span></div>
        <div class="status-live"><i></i><span>archive online</span></div>
      </div>
    </section>

    <section class="journal-section" id="notes">
      ${
        featured
          ? `<a href="/notes/${escapeHtml(featured.slug)}/" class="featured-note">
              <div class="featured-index">01</div>
              <div class="featured-copy">
                <span class="eyebrow">LATEST TRANSMISSION</span>
                <h2>${escapeHtml(featured.title)}</h2>
                <p>${escapeHtml(featured.summary)}</p>
                <span class="text-link">Read field note →</span>
              </div>
              <div class="featured-meta">
                <span>${escapeHtml(featured.platform)}</span>
                <span>${formatDate(featured.completedAt)}</span>
                <span>${readingTime(featured)} min read</span>
              </div>
            </a>`
          : ""
      }
      <div class="index-toolbar">
        <div>
          <span class="eyebrow">ARCHIVE / <span data-visible-count>${String(posts.length).padStart(2, "0")}</span></span>
          <h2>Collected evidence</h2>
        </div>
        <div class="filters" aria-label="Filter journal entries">
          ${filters
            .map(
              (filter, index) =>
                `<button type="button" data-filter="${filter}" class="${index === 0 ? "active" : ""}" aria-pressed="${index === 0}">${filter === "Hack The Box" ? "HTB" : filter}</button>`,
            )
            .join("")}
        </div>
      </div>
      <div class="notes-list">${posts.map(noteRow).join("")}</div>
    </section>

    <section class="protocol" id="protocol">
      <div class="protocol-heading">
        <span class="eyebrow">DISCLOSURE PROTOCOL</span>
        <h2>Useful without ruining the work.</h2>
      </div>
      <div class="protocol-grid">
        <article><span>01</span><h3>Active machines stay safe.</h3><p>Only high-level observations, methodology, and lessons. No flags, credentials, footholds, or privilege-escalation paths.</p></article>
        <article><span>02</span><h3>Retired means reproducible.</h3><p>Full writeups preserve the chain of evidence: recon, exploitation, escalation, dead ends, and what made the difference.</p></article>
        <article><span>03</span><h3>Every note earns its place.</h3><p>The archive favors transferable ideas over flag screenshots and command dumps. If it teaches nothing, it stays private.</p></article>
      </div>
    </section>
  </main>`,
});

function textSection(index, title, body) {
  if (!body) return "";
  return `<section class="article-section">
    <div class="article-section-label"><span>${index}</span><h2>${title}</h2></div>
    <div class="article-prose">${paragraphs(body)}</div>
  </section>`;
}

function article(post) {
  const fullWriteup = post.status !== "active";
  const externalUrl = safeUrl(post.externalUrl);
  return layout({
    title: post.title,
    description: post.summary,
    canonical: `/notes/${post.slug}/`,
    article: true,
    content: `<main class="article-page">
      <div class="article-topline"><a href="/#notes">← Archive</a><span>ENTRY / ${escapeHtml(post.slug.toUpperCase())}</span></div>
      <header class="article-header">
        <div class="article-kicker"><span>${escapeHtml(post.platform)}</span><span>${escapeHtml(post.kind.replace("-", " "))}</span><span>${formatDate(post.completedAt)}</span></div>
        <h1>${escapeHtml(post.title)}</h1>
        <p>${escapeHtml(post.summary)}</p>
        <div class="article-facts">
          <div><span>Target</span><strong>${escapeHtml(post.target || "—")}</strong></div>
          <div><span>System</span><strong>${escapeHtml(post.operatingSystem)}</strong></div>
          <div><span>Difficulty</span><strong>${escapeHtml(post.difficulty)}</strong></div>
          <div><span>Read</span><strong>${readingTime(post)} min</strong></div>
        </div>
      </header>
      ${
        post.status === "active"
          ? `<aside class="spoiler-notice"><span>ACTIVE TARGET / REDACTED</span><p>This entry is intentionally limited to transferable observations. The attack path, credentials, flags, and escalation chain are not published.</p></aside>`
          : ""
      }
      <div class="article-body">
        ${textSection("01", "Reconnaissance", post.recon)}
        ${fullWriteup ? textSection("02", "Attack path", post.path) : ""}
        ${fullWriteup ? textSection("03", "Privilege escalation", post.escalation) : ""}
        ${textSection(fullWriteup ? "04" : "02", "What survived", post.lessons)}
      </div>
      <footer class="article-footer">
        <div class="tool-index"><span class="eyebrow">TOOLS / TAGS</span><div>${[...(post.tools ?? []), ...(post.tags ?? [])].map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div></div>
        ${externalUrl ? `<a href="${externalUrl}" target="_blank" rel="noreferrer">External reference ↗</a>` : '<a href="/#notes">Return to archive →</a>'}
      </footer>
    </main>`,
  });
}

function rss() {
  const items = posts
    .map(
      (post) => `<item>
  <title>${escapeHtml(post.title)}</title>
  <link>${siteUrl}/notes/${escapeHtml(post.slug)}/</link>
  <guid>${siteUrl}/notes/${escapeHtml(post.slug)}/</guid>
  <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>
  <description>${escapeHtml(post.summary)}</description>
</item>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0"><channel>
<title>F1LEO — Field Notes</title>
<link>${siteUrl}</link>
<description>Offensive security field notes by f1leo.</description>
<language>en</language>
${items}
</channel></rss>`;
}

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await writeFile(path.join(output, "index.html"), home);
await writeFile(path.join(output, "rss.xml"), rss());
await copyFile(path.join(root, "site", "styles.css"), path.join(output, "styles.css"));
await copyFile(path.join(root, "site", "app.js"), path.join(output, "app.js"));
await copyFile(path.join(root, "site", "favicon.svg"), path.join(output, "favicon.svg"));
await copyFile(path.join(root, "site", "og.jpg"), path.join(output, "og.jpg"));
await writeFile(path.join(output, ".nojekyll"), "");

for (const post of posts) {
  const directory = path.join(output, "notes", post.slug);
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, "index.html"), article(post));
}

const notFound = layout({
  title: "Signal lost",
  description: "The requested field note could not be found.",
  canonical: "/404.html",
  content: `<main class="not-found"><span class="eyebrow">404 / SIGNAL LOST</span><h1>No evidence at this coordinate.</h1><p>The entry may have moved, been redacted, or never existed.</p><a href="/" class="button-primary">Return to archive →</a></main>`,
});
await writeFile(path.join(output, "404.html"), notFound);

console.log(`Built ${posts.length} journal entries into ${output}`);
