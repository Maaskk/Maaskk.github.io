"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  formatDate,
  readingTime,
  type JournalPost,
  type Platform,
} from "@/lib/journal";

const filters: Array<"All" | Platform> = [
  "All",
  "Hack The Box",
  "PortSwigger",
  "CTF",
  "Home Lab",
  "Research",
];

export default function JournalIndex({ posts }: { posts: JournalPost[] }) {
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const visible = useMemo(
    () =>
      filter === "All"
        ? posts
        : posts.filter((post) => post.platform === filter),
    [filter, posts],
  );
  const featured = posts.find((post) => post.featured) ?? posts[0];

  return (
    <>
      {featured ? (
        <Link href={`/notes/${featured.slug}`} className="featured-note">
          <div className="featured-index">01</div>
          <div className="featured-copy">
            <span className="eyebrow">LATEST TRANSMISSION</span>
            <h2>{featured.title}</h2>
            <p>{featured.summary}</p>
            <span className="text-link">Read field note →</span>
          </div>
          <div className="featured-meta">
            <span>{featured.platform}</span>
            <span>{formatDate(featured.completedAt)}</span>
            <span>{readingTime(featured)} min read</span>
          </div>
        </Link>
      ) : null}

      <div className="index-toolbar">
        <div>
          <span className="eyebrow">ARCHIVE / {posts.length.toString().padStart(2, "0")}</span>
          <h2>Collected evidence</h2>
        </div>
        <div className="filters" aria-label="Filter journal entries">
          {filters.map((item) => (
            <button
              type="button"
              key={item}
              className={filter === item ? "active" : ""}
              onClick={() => setFilter(item)}
            >
              {item === "Hack The Box" ? "HTB" : item}
            </button>
          ))}
        </div>
      </div>

      <div className="notes-list">
        {visible.map((post, index) => (
          <Link
            href={`/notes/${post.slug}`}
            className="note-row"
            key={post.slug}
          >
            <span className="row-index">
              {(index + 1).toString().padStart(2, "0")}
            </span>
            <div className="row-title">
              <div className="row-tags">
                <span>{post.platform}</span>
                <span>{post.difficulty}</span>
                {post.status === "active" ? (
                  <span className="safe-label">SPOILER-SAFE</span>
                ) : null}
              </div>
              <h3>{post.title}</h3>
              <p>{post.summary}</p>
            </div>
            <div className="row-meta">
              <span>{formatDate(post.completedAt)}</span>
              <span>{post.operatingSystem}</span>
              <b>↗</b>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
