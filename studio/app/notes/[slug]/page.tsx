import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate, getPosts, readingTime } from "@/lib/journal";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = (await getPosts()).find((item) => item.slug === slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.summary,
    openGraph: {
      title: post.title,
      description: post.summary,
      type: "article",
      publishedTime: post.publishedAt,
      tags: post.tags,
    },
  };
}

function TextSection({
  index,
  title,
  body,
}: {
  index: string;
  title: string;
  body: string;
}) {
  if (!body) return null;
  return (
    <section className="article-section">
      <div className="article-section-label">
        <span>{index}</span>
        <h2>{title}</h2>
      </div>
      <div className="article-prose">
        {body.split(/\n{2,}/).map((paragraph, paragraphIndex) => (
          <p key={`${index}-${paragraphIndex}`}>{paragraph}</p>
        ))}
      </div>
    </section>
  );
}

export default async function NotePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = (await getPosts()).find((item) => item.slug === slug);
  if (!post) notFound();

  const fullWriteup = post.status !== "active";

  return (
    <main className="article-page">
      <div className="article-topline">
        <Link href="/#notes">← Archive</Link>
        <span>ENTRY / {post.slug.toUpperCase()}</span>
      </div>

      <header className="article-header">
        <div className="article-kicker">
          <span>{post.platform}</span>
          <span>{post.kind.replace("-", " ")}</span>
          <span>{formatDate(post.completedAt)}</span>
        </div>
        <h1>{post.title}</h1>
        <p>{post.summary}</p>
        <div className="article-facts">
          <div>
            <span>Target</span>
            <strong>{post.target || "—"}</strong>
          </div>
          <div>
            <span>System</span>
            <strong>{post.operatingSystem}</strong>
          </div>
          <div>
            <span>Difficulty</span>
            <strong>{post.difficulty}</strong>
          </div>
          <div>
            <span>Read</span>
            <strong>{readingTime(post)} min</strong>
          </div>
        </div>
      </header>

      {post.status === "active" ? (
        <aside className="spoiler-notice">
          <span>ACTIVE TARGET / REDACTED</span>
          <p>
            This entry is intentionally limited to transferable observations.
            The attack path, credentials, flags, and escalation chain are not
            published.
          </p>
        </aside>
      ) : null}

      <div className="article-body">
        <TextSection index="01" title="Reconnaissance" body={post.recon} />
        {fullWriteup ? (
          <TextSection index="02" title="Attack path" body={post.path} />
        ) : null}
        {fullWriteup ? (
          <TextSection
            index="03"
            title="Privilege escalation"
            body={post.escalation}
          />
        ) : null}
        <TextSection
          index={fullWriteup ? "04" : "02"}
          title="What survived"
          body={post.lessons}
        />
      </div>

      <footer className="article-footer">
        <div className="tool-index">
          <span className="eyebrow">TOOLS / TAGS</span>
          <div>
            {[...post.tools, ...post.tags].map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>
        {post.externalUrl ? (
          <a href={post.externalUrl} target="_blank" rel="noreferrer">
            External reference ↗
          </a>
        ) : (
          <Link href="/#notes">Return to archive →</Link>
        )}
      </footer>
    </main>
  );
}
