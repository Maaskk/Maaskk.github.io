import { cookies } from "next/headers";
import StudioForm from "@/app/components/studio-form";
import { isOwner, readSession, SESSION_COOKIE } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function StudioPage() {
  const cookieStore = await cookies();
  const session = readSession(cookieStore.get(SESSION_COOKIE)?.value);

  if (!session) {
    return (
      <main className="studio-shell studio-gate">
        <span className="eyebrow">PRIVATE PUBLISHING SURFACE</span>
        <h1>One form. One commit. Published.</h1>
        <p>
          The studio is separate from the public journal. GitHub verifies the
          owner, and every note is committed to a dedicated content repository.
        </p>
        <a
          className="button-primary"
          href="/api/auth/github?returnTo=/studio"
        >
          Continue with GitHub →
        </a>
        <a href="https://maaskk.github.io">← Return to the journal</a>
      </main>
    );
  }

  if (!isOwner(session.user.login)) {
    return (
      <main className="studio-shell studio-gate">
        <span className="eyebrow">ACCESS DENIED</span>
        <h1>This studio belongs to f1leo.</h1>
        <p>
          Signed in as @{session.user.login}. Publishing is restricted to the
          configured journal owner.
        </p>
        <a className="button-primary" href="/api/auth/signout">
          Sign out
        </a>
        <a href="https://maaskk.github.io">← Return to the journal</a>
      </main>
    );
  }

  return (
    <main className="studio-shell">
      <header className="studio-header">
        <div>
          <span className="eyebrow">PRIVATE STUDIO / @{session.user.login}</span>
          <h1>Publish what mattered.</h1>
          <p>
            No code edits. The studio validates, redacts, commits, and updates
            the public archive.
          </p>
        </div>
        <div className="studio-header-actions">
          <a href="https://maaskk.github.io">View journal ↗</a>
          <a href="/api/auth/signout">Sign out</a>
        </div>
      </header>
      <StudioForm />
    </main>
  );
}
