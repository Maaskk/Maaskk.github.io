import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  githubHeaders,
  isOwner,
  readSession,
  SESSION_COOKIE,
} from "@/lib/auth";
import {
  CONTENT_FILE,
  CONTENT_REPO,
  OWNER,
  sanitizePost,
  type JournalPost,
} from "@/lib/journal";

type ContentPayload = {
  content?: unknown;
  sha?: unknown;
};

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

async function githubFetch(
  path: string,
  token: string,
  init?: RequestInit,
) {
  return fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      ...githubHeaders(token),
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
}

async function ensureRepository(token: string) {
  const existing = await githubFetch(`/repos/${OWNER}/${CONTENT_REPO}`, token);
  if (existing.ok) return;
  if (existing.status !== 404) {
    throw new Error("GitHub could not check the journal repository.");
  }

  const created = await githubFetch("/user/repos", token, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: CONTENT_REPO,
      description:
        "F1LEO offensive-security field journal, published with GitHub Pages.",
      private: false,
      auto_init: true,
      has_issues: false,
      has_projects: false,
      has_wiki: false,
    }),
  });
  if (!created.ok) {
    const payload = (await created.json().catch(() => null)) as {
      message?: string;
    } | null;
    throw new Error(payload?.message || "The content repository could not be created.");
  }
}

async function readRemotePosts(token: string) {
  const response = await githubFetch(
    `/repos/${OWNER}/${CONTENT_REPO}/contents/${CONTENT_FILE}`,
    token,
  );
  if (response.status === 404) {
    return { posts: [] as JournalPost[], sha: undefined as string | undefined };
  }
  if (!response.ok) throw new Error("The existing journal could not be read.");
  const payload = (await response.json()) as ContentPayload;
  if (typeof payload.content !== "string") {
    throw new Error("The journal content file is malformed.");
  }
  const decoded = Buffer.from(
    payload.content.replace(/\n/g, ""),
    "base64",
  ).toString("utf8");
  const raw = JSON.parse(decoded) as unknown;
  return {
    posts: Array.isArray(raw)
      ? raw
          .map(sanitizePost)
          .filter((post): post is JournalPost => Boolean(post))
      : [],
    sha: typeof payload.sha === "string" ? payload.sha : undefined,
  };
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }
  const cookieStore = await cookies();
  const session = readSession(cookieStore.get(SESSION_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ error: "Sign in to publish." }, { status: 401 });
  }
  if (!isOwner(session.user.login)) {
    return NextResponse.json(
      { error: "This GitHub account is not the journal owner." },
      { status: 403 },
    );
  }

  const input = await request.json().catch(() => null);
  const post = sanitizePost(input);
  if (!post || !post.title || !post.summary) {
    return NextResponse.json(
      { error: "A title and summary are required." },
      { status: 400 },
    );
  }

  try {
    await ensureRepository(session.accessToken);
    let remote: Awaited<ReturnType<typeof readRemotePosts>>;
    try {
      remote = await readRemotePosts(session.accessToken);
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 750));
      remote = await readRemotePosts(session.accessToken);
    }
    const publishedPost: JournalPost = {
      ...post,
      publishedAt:
        remote.posts.find((item) => item.slug === post.slug)?.publishedAt ??
        new Date().toISOString(),
    };
    const posts = [
      publishedPost,
      ...remote.posts.filter((item) => item.slug !== post.slug),
    ];
    const body: Record<string, unknown> = {
      message: `journal: publish ${publishedPost.slug}`,
      content: Buffer.from(JSON.stringify(posts, null, 2) + "\n").toString(
        "base64",
      ),
      branch: "main",
    };
    if (remote.sha) body.sha = remote.sha;

    const saved = await githubFetch(
      `/repos/${OWNER}/${CONTENT_REPO}/contents/${CONTENT_FILE}`,
      session.accessToken,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );
    if (!saved.ok) {
      const result = (await saved.json().catch(() => null)) as {
        message?: string;
      } | null;
      throw new Error(result?.message || "GitHub rejected the journal update.");
    }

    return NextResponse.json({
      ok: true,
      url: `https://maaskk.github.io/notes/${publishedPost.slug}/`,
      repoUrl: `https://github.com/${OWNER}/${CONTENT_REPO}`,
      disclosure:
        publishedPost.status === "active"
          ? "spoiler-safe field note"
          : "full note",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "The note could not be published.",
      },
      { status: 502 },
    );
  }
}
