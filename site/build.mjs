import { copyFile, cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "dist");
const siteUrl = "https://maaskk.github.io";
const githubUrl = "https://github.com/Maaskk";
const htbUrl = "https://app.hackthebox.com/profile";
const assetVersion = "20260729-field-journal";
const avatarSource =
  "https://berserk.fandom.com/wiki/File:1997_Anime_Guts_Portrait_in_the_post_Credit_Scene.png";

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

const safeAsset = (value = "") =>
  /^\/[a-zA-Z0-9/_-]+\.(?:jpg|jpeg|png|webp|gif|svg)$/.test(value)
    ? escapeHtml(value)
    : "";

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
    post.intro,
    ...(post.sections ?? []).flatMap((section) => [
      section.body,
      section.note,
      ...(section.terminal?.lines ?? []),
    ]),
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

const tags = [...new Set(posts.flatMap((post) => post.tags ?? []))].sort();
const platforms = [...new Set(posts.map((post) => post.platform))].sort();

function sidebar() {
  return `<aside class="profile-rail">
    <a class="identity" href="/" aria-label="F1LEO home">
      <span class="avatar-frame"><img src="/media/guts-avatar.jpg" alt="Guts from Berserk"></span>
      <strong>f1leo</strong>
      <small>#MA</small>
    </a>
    <p class="identity-copy">Cybersecurity labs, AI security, forensics, and the paths that actually reached a flag.</p>
    <nav class="side-nav" aria-label="Journal navigation">
      <a href="/#home" data-view-link="home"><span>⌂</span>Home</a>
      <a href="/#categories" data-view-link="categories"><span>▤</span>Categories</a>
      <a href="/#tags" data-view-link="tags"><span>◇</span>Tags</a>
      <a href="/#archives" data-view-link="archives"><span>▣</span>Archives</a>
      <a href="/#about" data-view-link="about"><span>●</span>About</a>
    </nav>
    <div class="rail-links">
      <a href="${githubUrl}" target="_blank" rel="noreferrer" aria-label="GitHub profile">GH</a>
      <a href="${htbUrl}" target="_blank" rel="noreferrer" aria-label="Hack The Box profile">HTB</a>
      <a href="/rss.xml" aria-label="RSS feed">RSS</a>
    </div>
    <a class="avatar-credit" href="${avatarSource}" target="_blank" rel="noreferrer">Guts · Berserk (1997) ↗</a>
  </aside>`;
}

function layout({ title, description, canonical, content, article = false }) {
  const pageTitle =
    title === "F1LEO — Cybersecurity Journal" ? title : `${title} — F1LEO`;
  const url = `${siteUrl}${canonical}`;
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="theme-color" content="#0d0c0b">
    <meta name="description" content="${escapeHtml(description)}">
    <link rel="canonical" href="${url}">
    <link rel="alternate" type="application/rss+xml" title="F1LEO Cybersecurity Journal" href="${siteUrl}/rss.xml">
    <link rel="stylesheet" href="/styles.css?v=${assetVersion}">
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
    <div class="backdrop" aria-hidden="true"></div>
    <div class="app-shell">
      ${sidebar()}
      <div class="site-canvas">
        ${content}
        <footer class="site-footer">
          <span>© <span data-year>2026</span> F1LEO</span>
          <span>Built on GitHub Pages · <a href="/rss.xml">RSS</a></span>
        </footer>
      </div>
    </div>
    <script src="/app.js" defer></script>
  </body>
</html>`;
}

function postCard(post) {
  const searchable = [
    post.title,
    post.summary,
    post.platform,
    post.difficulty,
    ...(post.tags ?? []),
    ...(post.tools ?? []),
  ]
    .join(" ")
    .toLowerCase();
  return `<article class="post-card" data-post-card data-search="${escapeHtml(searchable)}">
    <a href="/notes/${escapeHtml(post.slug)}/">
      <span class="post-card-icon" aria-hidden="true">${escapeHtml(post.symbol || "›_")}</span>
      <div class="card-heading">
        <div>
          <span class="card-platform">${escapeHtml(post.platform)}</span>
          ${post.status === "active" ? '<span class="safe-label">spoiler-safe</span>' : ""}
          <span class="evidence-label">${post.status === "completed" ? "captured" : "progress log"}</span>
        </div>
        <span class="card-arrow" aria-hidden="true">↗</span>
      </div>
      <h2>${escapeHtml(post.title)}</h2>
      <p>${escapeHtml(post.summary)}</p>
      <div class="card-meta">
        <span>▣ ${formatDate(post.completedAt)}</span>
        <span>▰ ${escapeHtml(post.difficulty)}</span>
        <span>◷ ${readingTime(post)} min</span>
      </div>
    </a>
  </article>`;
}

function recentList() {
  return posts
    .slice(0, 5)
    .map(
      (post) =>
        `<li><a href="/notes/${escapeHtml(post.slug)}/">${escapeHtml(post.title)}</a><time>${formatDate(post.completedAt)}</time></li>`,
    )
    .join("");
}

function topbar(label = "Home", includeSearch = true) {
  return `<header class="topbar">
    <button class="menu-button" type="button" aria-label="Open navigation" aria-expanded="false">☰</button>
    <span class="crumb"><a href="/">F1LEO</a><i>/</i><b data-page-label>${escapeHtml(label)}</b></span>
    ${
      includeSearch
        ? `<label class="search-box">
            <span aria-hidden="true">⌕</span>
            <input type="search" placeholder="Search notes…" aria-label="Search journal entries" data-search-input>
            <kbd>/</kbd>
          </label>`
        : `<a class="top-link" href="/#home">Back to journal</a>`
    }
  </header>`;
}

const categoryCards = platforms
  .map((platform) => {
    const count = posts.filter((post) => post.platform === platform).length;
    return `<a class="taxonomy-card" href="/#home" data-category-filter="${escapeHtml(platform)}">
      <span>${String(count).padStart(2, "0")}</span>
      <strong>${escapeHtml(platform)}</strong>
      <small>${count === 1 ? "entry" : "entries"}</small>
    </a>`;
  })
  .join("");

const tagCloud = tags.length
  ? tags
      .map(
        (tag) =>
          `<a href="/#home" class="tag" data-tag-filter="${escapeHtml(tag)}">#${escapeHtml(tag)}</a>`,
      )
      .join("")
  : '<span class="empty-copy">Tags appear as notes are published.</span>';

const archiveRows = posts
  .map(
    (post) => `<a class="archive-row" href="/notes/${escapeHtml(post.slug)}/">
      <time>${formatDate(post.completedAt)}</time>
      <strong>${escapeHtml(post.title)}</strong>
      <span>${escapeHtml(post.platform)}</span>
    </a>`,
  )
  .join("");

const home = layout({
  title: "F1LEO — Cybersecurity Journal",
  description:
    "Cybersecurity labs, Hack The Box notes, research, and writeups by f1leo.",
  canonical: "/",
  content: `
    ${topbar()}
    <main class="journal">
      <section class="view-panel active" data-view="home">
        <div class="cover-card reference-cover">
          <div>
            <span class="micro-label">F1LEO / OFFENSIVE SECURITY NOTES</span>
            <h1>Writeups and progress logs.</h1>
            <p>Completed paths and substantial unfinished investigations reconstructed from my saved terminal history. No scoreboard filler, no invented completions.</p>
          </div>
          <a href="${htbUrl}" target="_blank" rel="noreferrer">f1leo on HTB ↗</a>
        </div>
        <div class="content-grid">
          <section class="post-feed" aria-label="Journal entries">
            <div class="feed-heading">
              <div><span class="micro-label">LATEST</span><h2>Writeups & investigations</h2></div>
              <span><b data-visible-count>${posts.length}</b> published</span>
            </div>
            <div class="empty-search" data-empty-search hidden>No notes match that search.</div>
            ${posts.map(postCard).join("")}
          </section>
          <aside class="discovery">
            <section>
              <h2>Recently updated</h2>
              <ol>${recentList()}</ol>
            </section>
            <section>
              <h2>Tags</h2>
              <div class="tag-cloud">${tagCloud}</div>
            </section>
            <section class="disclosure-card">
              <span class="status-dot"></span>
              <div><strong>Recovered from real history</strong><p>Commands follow the saved Claude sessions. Flags and per-instance secrets show a recognizable prefix, then masking.</p></div>
            </section>
          </aside>
        </div>
      </section>

      <section class="view-panel" data-view="categories" hidden>
        <header class="section-intro"><span class="micro-label">BROWSE</span><h1>Categories</h1><p>Notes grouped by the place the work happened.</p></header>
        <div class="taxonomy-grid">${categoryCards || '<span class="empty-copy">Categories appear as notes are published.</span>'}</div>
      </section>

      <section class="view-panel" data-view="tags" hidden>
        <header class="section-intro"><span class="micro-label">INDEX</span><h1>Tags</h1><p>Tools, techniques, and subjects across the journal.</p></header>
        <div class="large-tag-cloud">${tagCloud}</div>
      </section>

      <section class="view-panel" data-view="archives" hidden>
        <header class="section-intro"><span class="micro-label">TIMELINE</span><h1>Archives</h1><p>Everything published, newest first.</p></header>
        <div class="archive-list">${archiveRows}</div>
      </section>

      <section class="view-panel" data-view="about" hidden>
        <header class="section-intro"><span class="micro-label">ABOUT</span><h1>f1leo <em>#MA</em></h1></header>
        <div class="about-grid">
          <article>
            <h2>I learn by breaking things carefully.</h2>
            <p>This is my personal cybersecurity journal: completed chains, substantial unfinished investigations, failed assumptions, and the commands worth keeping after the terminal closes.</p>
            <p>Entries are reconstructed from my saved sessions. Incomplete labs state exactly where I stopped and never pretend the final flag was captured.</p>
          </article>
          <div class="profile-links">
            <a href="${githubUrl}" target="_blank" rel="noreferrer"><span>Code & projects</span><strong>GitHub ↗</strong></a>
            <a href="${htbUrl}" target="_blank" rel="noreferrer"><span>Labs & progress</span><strong>Hack The Box ↗</strong></a>
            <a href="/rss.xml"><span>Follow updates</span><strong>RSS feed ↗</strong></a>
          </div>
        </div>
      </section>
    </main>`,
});

function terminalLine(line = "") {
  const escaped = escapeHtml(line);
  if (/^(flag_|N7SEC\{)/i.test(line.trim())) {
    return `<span class="term-flag">${escaped}</span>`;
  }
  const command = line.match(/^(\$|#|[a-z0-9_-]+@[a-z0-9_-]+[#$]|PS>)\s?(.*)$/i);
  if (command) {
    return `<span class="term-prompt">${escapeHtml(command[1])}</span>${command[2] ? ` <span class="term-command">${escapeHtml(command[2])}</span>` : ""}`;
  }
  if (/^(HTTP\/|event:|data:|\[\*\]|\[\+\]|\[info\]|tool:|argument:)/i.test(line.trim())) {
    return `<span class="term-info">${escaped}</span>`;
  }
  if (/^(error|cat:|permission denied|enoent)/i.test(line.trim())) {
    return `<span class="term-error">${escaped}</span>`;
  }
  if (/^(uid=|root@|submission:|status:|result:)/i.test(line.trim())) {
    return `<span class="term-success">${escaped}</span>`;
  }
  return `<span class="term-output">${escaped}</span>`;
}

function terminal(session) {
  if (!session?.lines?.length) return "";
  return `<figure class="terminal-window">
    <figcaption>
      <span class="terminal-lights" aria-hidden="true"><i></i><i></i><i></i></span>
      <b>${escapeHtml(session.title || "terminal")}</b>
      <small>reconstructed from saved history</small>
    </figcaption>
    <pre><code>${session.lines.map((line) => terminalLine(line)).join("\n")}</code></pre>
  </figure>`;
}

function articleSection(section, index) {
  const id = `step-${String(index + 1).padStart(2, "0")}`;
  return `<section class="article-section" id="${id}">
    <h2><span>${String(index + 1).padStart(2, "0")}</span>${escapeHtml(section.title)}</h2>
    <div class="article-prose">${paragraphs(section.body)}</div>
    ${terminal(section.terminal)}
    ${section.note ? `<aside class="step-note"><strong>Why it mattered</strong>${paragraphs(section.note)}</aside>` : ""}
  </section>`;
}

function comments(post) {
  return `<section class="comments" id="comments">
    <div class="comments-heading">
      <div><span class="micro-label">DISCUSSION</span><h2>Comments</h2></div>
      <p>Sign in with GitHub to join the discussion. Comments are stored as GitHub issues.</p>
    </div>
    <script src="https://utteranc.es/client.js"
      repo="Maaskk/Maaskk.github.io"
      issue-term="pathname"
      label="comments"
      theme="github-dark"
      crossorigin="anonymous"
      async></script>
    <noscript>Enable JavaScript to load GitHub comments for ${escapeHtml(post.title)}.</noscript>
  </section>`;
}

function article(post) {
  const externalUrl = safeUrl(post.externalUrl);
  const heroIcon = safeUrl(post.heroIcon);
  const sections = post.sections ?? [];
  return layout({
    title: post.title,
    description: post.summary,
    canonical: `/notes/${post.slug}/`,
    article: true,
    content: `${topbar(post.platform, false)}
      <main class="article-page reference-article">
        <div class="article-column">
          <a class="back-link" href="/#home">← All writeups</a>
          <header class="article-header">
            <div class="article-kicker"><span>${escapeHtml(post.platform)}</span><span>${escapeHtml(post.difficulty)}</span></div>
            <h1>${escapeHtml(post.title)}</h1>
            <div class="article-byline"><span>Posted ${formatDate(post.completedAt)}</span><span>By f1leo</span><span>${readingTime(post)} min read</span></div>
            ${
              heroIcon
                ? `<figure class="machine-emblem"><img src="${heroIcon}" alt="${escapeHtml(post.heroAlt || `${post.title} icon`)}"><figcaption>${escapeHtml(post.target || "")}</figcaption></figure>`
                : `<figure class="machine-emblem text-emblem"><span>${escapeHtml(post.symbol || "›_")}</span><figcaption>${escapeHtml(post.target || "")}</figcaption></figure>`
            }
            <p class="article-lead">${escapeHtml(post.intro || post.summary)}</p>
            <div class="article-facts">
              <div><span>Target</span><strong>${escapeHtml(post.target || "—")}</strong></div>
              <div><span>System</span><strong>${escapeHtml(post.operatingSystem)}</strong></div>
              <div><span>Flag</span><strong>${escapeHtml(post.maskedFlag || "captured")}</strong></div>
            </div>
          </header>
          <aside class="evidence-notice"><span>Recovered writeup</span><p>${escapeHtml(post.evidenceNote || "Steps are reconstructed from saved terminal history. Per-instance secrets are partially masked.")}</p></aside>
          <div class="article-body">${sections.map(articleSection).join("")}</div>
          <footer class="article-footer">
            <div><span class="micro-label">TOOLS / TAGS</span><div class="tag-cloud">${[...(post.tools ?? []), ...(post.tags ?? [])].map((item) => `<span class="tag">#${escapeHtml(item)}</span>`).join("")}</div></div>
            ${externalUrl ? `<a href="${externalUrl}" target="_blank" rel="noreferrer">External reference ↗</a>` : '<a href="/#home">Return to journal →</a>'}
          </footer>
          ${comments(post)}
        </div>
        <aside class="article-toc">
          <section><h2>Contents</h2><ol>${sections.map((section, index) => `<li><a href="#step-${String(index + 1).padStart(2, "0")}">${escapeHtml(section.title)}</a></li>`).join("")}<li><a href="#comments">Comments</a></li></ol></section>
          <section><h2>Trending tags</h2><div class="tag-cloud">${(post.tags ?? []).slice(0, 7).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div></section>
        </aside>
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
<title>F1LEO — Cybersecurity Journal</title>
<link>${siteUrl}</link>
<description>Cybersecurity field notes by f1leo.</description>
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
await cp(path.join(root, "site", "media"), path.join(output, "media"), {
  recursive: true,
});
await writeFile(path.join(output, ".nojekyll"), "");

for (const post of posts) {
  const directory = path.join(output, "notes", post.slug);
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, "index.html"), article(post));
}

const notFound = layout({
  title: "Not found",
  description: "The requested field note could not be found.",
  canonical: "/404.html",
  content: `${topbar("404", false)}<main class="not-found"><span class="micro-label">404 / NOT FOUND</span><h1>No note at this address.</h1><p>It may have moved, been redacted, or never existed.</p><a href="/" class="action-link">Return home →</a></main>`,
});
await writeFile(path.join(output, "404.html"), notFound);

console.log(`Built ${posts.length} journal entries into ${output}`);
