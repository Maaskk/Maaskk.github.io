export type Platform =
  | "Hack The Box"
  | "PortSwigger"
  | "TryHackMe"
  | "CTF"
  | "Home Lab"
  | "Research";

export type Difficulty = "Easy" | "Medium" | "Hard" | "Insane" | "Unrated";
export type MachineStatus = "active" | "retired" | "not-applicable";
export type NoteKind = "field-note" | "writeup" | "research";

export type JournalPost = {
  schemaVersion: 1;
  slug: string;
  title: string;
  platform: Platform;
  target: string;
  difficulty: Difficulty;
  operatingSystem: string;
  status: MachineStatus;
  kind: NoteKind;
  completedAt: string;
  publishedAt: string;
  summary: string;
  tags: string[];
  tools: string[];
  recon: string;
  path: string;
  escalation: string;
  lessons: string;
  externalUrl: string;
  featured: boolean;
};

export const OWNER = process.env.JOURNAL_OWNER ?? "Maaskk";
export const CONTENT_REPO =
  process.env.JOURNAL_REPO ?? "Maaskk.github.io";
export const CONTENT_FILE = "content/journal.json";

export const introPost: JournalPost = {
  schemaVersion: 1,
  slug: "signal-starts-here",
  title: "Signal starts here.",
  platform: "Research",
  target: "Field Journal",
  difficulty: "Unrated",
  operatingSystem: "Mixed",
  status: "not-applicable",
  kind: "research",
  completedAt: "2026-07-29",
  publishedAt: "2026-07-29T00:00:00.000Z",
  summary:
    "A living record of machines, mistakes, attack paths, and the small observations that survive after the shell closes.",
  tags: ["journal", "methodology", "offsec"],
  tools: [],
  recon:
    "This journal exists to make the work legible. Every entry starts with what was visible, what looked wrong, and which assumption was worth testing.",
  path:
    "Full attack paths appear only when a target is retired or the material is safe to disclose. Active machines receive spoiler-safe field notes.",
  escalation:
    "The point is not the flag. The useful part is the decision trail: why one route died, why another opened, and what should be remembered next time.",
  lessons:
    "Write while the evidence is fresh. Separate observation from inference. Keep the commands that mattered. Remove secrets. Publish what teaches.",
  externalUrl: "",
  featured: true,
};

function isString(value: unknown): value is string {
  return typeof value === "string";
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 72);
}

export function normalizeList(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter(isString).map((item) => item.trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

export function sanitizePost(value: unknown): JournalPost | null {
  if (!value || typeof value !== "object") return null;
  const input = value as Record<string, unknown>;
  if (!isString(input.title) || !isString(input.summary)) return null;

  const platformValues: Platform[] = [
    "Hack The Box",
    "PortSwigger",
    "TryHackMe",
    "CTF",
    "Home Lab",
    "Research",
  ];
  const difficultyValues: Difficulty[] = [
    "Easy",
    "Medium",
    "Hard",
    "Insane",
    "Unrated",
  ];
  const statusValues: MachineStatus[] = [
    "active",
    "retired",
    "not-applicable",
  ];
  const kindValues: NoteKind[] = ["field-note", "writeup", "research"];
  const status = statusValues.includes(input.status as MachineStatus)
    ? (input.status as MachineStatus)
    : "not-applicable";
  const requestedKind = kindValues.includes(input.kind as NoteKind)
    ? (input.kind as NoteKind)
    : "field-note";
  const kind = status === "active" ? "field-note" : requestedKind;
  const slug = slugify(isString(input.slug) ? input.slug : input.title);
  if (!slug) return null;

  const safeText = (key: string, max: number) =>
    isString(input[key]) ? input[key].trim().slice(0, max) : "";

  return {
    schemaVersion: 1,
    slug,
    title: safeText("title", 120),
    platform: platformValues.includes(input.platform as Platform)
      ? (input.platform as Platform)
      : "Research",
    target: safeText("target", 100),
    difficulty: difficultyValues.includes(input.difficulty as Difficulty)
      ? (input.difficulty as Difficulty)
      : "Unrated",
    operatingSystem: safeText("operatingSystem", 40) || "Unknown",
    status,
    kind,
    completedAt:
      safeText("completedAt", 10) ||
      new Date().toISOString().slice(0, 10),
    publishedAt:
      safeText("publishedAt", 40) || new Date().toISOString(),
    summary: safeText("summary", 360),
    tags: normalizeList(input.tags).slice(0, 12),
    tools: normalizeList(input.tools).slice(0, 12),
    recon: safeText("recon", 12000),
    path: status === "active" ? "" : safeText("path", 16000),
    escalation: status === "active" ? "" : safeText("escalation", 16000),
    lessons: safeText("lessons", 12000),
    externalUrl: safeText("externalUrl", 500),
    featured: input.featured === true,
  };
}

export async function getPosts(): Promise<JournalPost[]> {
  const url = `https://api.github.com/repos/${OWNER}/${CONTENT_REPO}/contents/${CONTENT_FILE}`;
  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "F1LEO-Field-Notes",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      next: { revalidate: 60 },
    });
    if (!response.ok) return [introPost];
    const payload = (await response.json()) as { content?: unknown };
    if (typeof payload.content !== "string") return [introPost];
    const decoded = Buffer.from(
      payload.content.replace(/\n/g, ""),
      "base64",
    ).toString("utf8");
    const raw = JSON.parse(decoded) as unknown;
    if (!Array.isArray(raw)) return [introPost];
    const remote = raw
      .map(sanitizePost)
      .filter((post): post is JournalPost => Boolean(post));
    return [introPost, ...remote].sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );
  } catch {
    return [introPost];
  }
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value.slice(0, 10)}T00:00:00.000Z`));
}

export function readingTime(post: JournalPost) {
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
}
