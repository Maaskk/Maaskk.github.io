"use client";

import { FormEvent, useMemo, useState } from "react";

type PublishState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; message: string; url: string }
  | { status: "error"; message: string };

const initial = {
  title: "",
  target: "",
  platform: "Hack The Box",
  difficulty: "Easy",
  operatingSystem: "Linux",
  status: "active",
  kind: "field-note",
  completedAt: new Date().toISOString().slice(0, 10),
  summary: "",
  tags: "",
  tools: "",
  recon: "",
  path: "",
  escalation: "",
  lessons: "",
  externalUrl: "",
  featured: false,
};

export default function StudioForm() {
  const [form, setForm] = useState(initial);
  const [publishState, setPublishState] = useState<PublishState>({
    status: "idle",
  });
  const activeTarget = form.status === "active";
  const slug = useMemo(
    () =>
      form.title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, ""),
    [form.title],
  );

  function update(name: string, value: string | boolean) {
    setForm((current) => {
      const next = { ...current, [name]: value };
      if (name === "status" && value === "active") {
        next.kind = "field-note";
        next.path = "";
        next.escalation = "";
      }
      return next;
    });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPublishState({ status: "loading" });
    try {
      const response = await fetch("/api/studio/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, slug }),
      });
      const result = (await response.json()) as {
        error?: string;
        url?: string;
        repoUrl?: string;
      };
      if (!response.ok) {
        throw new Error(result.error || "The note could not be published.");
      }
      setPublishState({
        status: "success",
        message: "Committed. GitHub Pages is rebuilding the journal now.",
        url: result.url ?? "/",
      });
    } catch (error) {
      setPublishState({
        status: "error",
        message:
          error instanceof Error ? error.message : "The publish request failed.",
      });
    }
  }

  return (
    <form className="studio-form" onSubmit={submit}>
      <div className="studio-grid">
        <section className="form-panel">
          <div className="panel-heading">
            <span>01</span>
            <div>
              <h2>Classify the note</h2>
              <p>The active-machine guard is enforced on the server.</p>
            </div>
          </div>
          <div className="form-fields two-up">
            <label>
              Platform
              <select
                value={form.platform}
                onChange={(event) => update("platform", event.target.value)}
              >
                <option>Hack The Box</option>
                <option>PortSwigger</option>
                <option>TryHackMe</option>
                <option>CTF</option>
                <option>Home Lab</option>
                <option>Research</option>
              </select>
            </label>
            <label>
              Disclosure status
              <select
                value={form.status}
                onChange={(event) => update("status", event.target.value)}
              >
                <option value="active">Active machine — spoiler safe</option>
                <option value="retired">Retired machine — full writeup</option>
                <option value="not-applicable">Not a machine</option>
              </select>
            </label>
            <label>
              Difficulty
              <select
                value={form.difficulty}
                onChange={(event) => update("difficulty", event.target.value)}
              >
                <option>Easy</option>
                <option>Medium</option>
                <option>Hard</option>
                <option>Insane</option>
                <option>Unrated</option>
              </select>
            </label>
            <label>
              Note type
              <select
                value={activeTarget ? "field-note" : form.kind}
                disabled={activeTarget}
                onChange={(event) => update("kind", event.target.value)}
              >
                <option value="field-note">Field note</option>
                <option value="writeup">Full writeup</option>
                <option value="research">Research</option>
              </select>
            </label>
          </div>
          {activeTarget ? (
            <div className="form-warning">
              <strong>Active-target lock is on.</strong>
              Attack-path and escalation fields are removed before publishing,
              even if a request is modified outside this form.
            </div>
          ) : null}
        </section>

        <section className="form-panel">
          <div className="panel-heading">
            <span>02</span>
            <div>
              <h2>Identify the work</h2>
              <p>Keep the title specific and the summary useful.</p>
            </div>
          </div>
          <div className="form-fields">
            <label>
              Title
              <input
                required
                maxLength={120}
                value={form.title}
                onChange={(event) => update("title", event.target.value)}
                placeholder="HTB: Machine name"
              />
            </label>
            <div className="two-up">
              <label>
                Target / machine
                <input
                  value={form.target}
                  onChange={(event) => update("target", event.target.value)}
                  placeholder="Machine or lab name"
                />
              </label>
              <label>
                Operating system
                <input
                  value={form.operatingSystem}
                  onChange={(event) =>
                    update("operatingSystem", event.target.value)
                  }
                  placeholder="Linux"
                />
              </label>
              <label>
                Completed
                <input
                  type="date"
                  required
                  value={form.completedAt}
                  onChange={(event) => update("completedAt", event.target.value)}
                />
              </label>
              <label>
                Slug
                <input value={slug} disabled aria-label="Generated URL slug" />
              </label>
            </div>
            <label>
              Summary
              <textarea
                required
                maxLength={360}
                rows={4}
                value={form.summary}
                onChange={(event) => update("summary", event.target.value)}
                placeholder="What made this lab worth documenting?"
              />
              <small>{form.summary.length}/360</small>
            </label>
          </div>
        </section>

        <section className="form-panel wide">
          <div className="panel-heading">
            <span>03</span>
            <div>
              <h2>Build the evidence chain</h2>
              <p>Plain text, deliberate paragraphs. No flag values or secrets.</p>
            </div>
          </div>
          <div className="form-fields evidence-fields">
            <label>
              Reconnaissance
              <textarea
                rows={7}
                value={form.recon}
                onChange={(event) => update("recon", event.target.value)}
                placeholder="What was visible? What did you infer? Which assumptions did you test?"
              />
            </label>
            <label className={activeTarget ? "locked-field" : ""}>
              Attack path
              <textarea
                rows={7}
                disabled={activeTarget}
                value={form.path}
                onChange={(event) => update("path", event.target.value)}
                placeholder={
                  activeTarget
                    ? "Locked until the machine is retired"
                    : "Explain the foothold and the decisions that led to it."
                }
              />
            </label>
            <label className={activeTarget ? "locked-field" : ""}>
              Privilege escalation
              <textarea
                rows={7}
                disabled={activeTarget}
                value={form.escalation}
                onChange={(event) => update("escalation", event.target.value)}
                placeholder={
                  activeTarget
                    ? "Locked until the machine is retired"
                    : "Document the escalation chain and why it worked."
                }
              />
            </label>
            <label>
              What survived
              <textarea
                rows={7}
                value={form.lessons}
                onChange={(event) => update("lessons", event.target.value)}
                placeholder="The transferable lesson, failed assumption, or method worth keeping."
              />
            </label>
          </div>
        </section>

        <section className="form-panel wide">
          <div className="panel-heading">
            <span>04</span>
            <div>
              <h2>Index and publish</h2>
              <p>Comma-separated fields become searchable archive metadata.</p>
            </div>
          </div>
          <div className="form-fields two-up">
            <label>
              Tools
              <input
                value={form.tools}
                onChange={(event) => update("tools", event.target.value)}
                placeholder="nmap, Burp Suite, ffuf"
              />
            </label>
            <label>
              Tags
              <input
                value={form.tags}
                onChange={(event) => update("tags", event.target.value)}
                placeholder="web, linux, privesc"
              />
            </label>
            <label>
              External reference
              <input
                type="url"
                value={form.externalUrl}
                onChange={(event) => update("externalUrl", event.target.value)}
                placeholder="https://..."
              />
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(event) => update("featured", event.target.checked)}
              />
              Feature this entry on the front page
            </label>
          </div>
          <div className="publish-bar">
            <div>
              <span className="eyebrow">DESTINATION</span>
              <strong>GitHub-backed public archive</strong>
            </div>
            <button
              className="button-primary"
              type="submit"
              disabled={
                publishState.status === "loading" ||
                !form.title ||
                !form.summary
              }
            >
              {publishState.status === "loading"
                ? "Publishing…"
                : "Publish field note →"}
            </button>
          </div>
          {publishState.status === "error" ? (
            <p className="publish-message error">{publishState.message}</p>
          ) : null}
          {publishState.status === "success" ? (
            <p className="publish-message success">
              {publishState.message}{" "}
              <a href={publishState.url} target="_blank" rel="noreferrer">
                Open the public URL ↗
              </a>
            </p>
          ) : null}
        </section>
      </div>
    </form>
  );
}
