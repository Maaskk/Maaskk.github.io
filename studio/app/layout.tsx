import type { Metadata } from "next";
import Link from "next/link";
import "./styles.css";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://maaskk.github.io";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "F1LEO — Field Notes",
    template: "%s — F1LEO",
  },
  description:
    "Offensive security field notes, retired-machine writeups, and research from f1leo.",
  openGraph: {
    title: "F1LEO — Field Notes",
    description:
      "Machines. Methods. Mistakes worth remembering. An offensive security field journal.",
    type: "website",
    url: siteUrl,
    siteName: "F1LEO — Field Notes",
    images: [{ url: "https://maaskk.github.io/og.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "F1LEO — Field Notes",
    description:
      "Machines. Methods. Mistakes worth remembering. An offensive security field journal.",
    images: ["https://maaskk.github.io/og.jpg"],
  },
  robots: { index: true, follow: true },
};

function Mark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className="brand-mark">
      <path d="M8 8h32v32H8z" />
      <path d="M14 16h20M14 24h12M14 32h20" />
      <path d="m29 22 5 5-5 5" />
    </svg>
  );
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <div className="noise" aria-hidden="true" />
        <header className="site-header">
          <Link href="/" className="brand" aria-label="F1LEO Field Notes home">
            <Mark />
            <span>
              <b>F1LEO</b>
              <small>FIELD NOTES / #MA</small>
            </span>
          </Link>
          <nav aria-label="Primary navigation">
            <Link href="/#notes">Notes</Link>
            <Link href="/#protocol">Protocol</Link>
            <a
              href="https://github.com/Maaskk"
              target="_blank"
              rel="noreferrer"
            >
              GitHub ↗
            </a>
            <a
              href="https://app.hackthebox.com/"
              target="_blank"
              rel="noreferrer"
              title="Hack The Box handle: f1leo #MA"
            >
              HTB ↗
            </a>
          </nav>
        </header>
        {children}
        <footer className="site-footer">
          <div>
            <span className="eyebrow">END OF TRANSMISSION</span>
            <p>Built from evidence, not aesthetics alone.</p>
          </div>
          <div className="footer-links">
            <a href="/rss.xml">RSS</a>
            <Link href="/studio">Private studio</Link>
          </div>
          <p className="footer-signature">f1leo // #MA</p>
        </footer>
      </body>
    </html>
  );
}
