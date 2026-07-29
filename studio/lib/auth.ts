import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

export const SESSION_COOKIE = "f1leo_session";
export const OAUTH_COOKIE = "f1leo_oauth";

export type Session = {
  accessToken: string;
  expires: number;
  user: {
    id: number;
    login: string;
    name: string | null;
    avatarUrl: string;
    profileUrl: string;
  };
};

type OAuthState = {
  state: string;
  verifier: string;
  returnTo: string;
  expires: number;
};

function key() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) return null;
  return createHash("sha256").update(secret).digest();
}

function encrypt(value: object) {
  const secret = key();
  if (!secret) throw new Error("Authentication is not configured.");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", secret, iv);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(value), "utf8"),
    cipher.final(),
  ]);
  return [
    "v1",
    iv.toString("base64url"),
    ciphertext.toString("base64url"),
    cipher.getAuthTag().toString("base64url"),
  ].join(".");
}

function decrypt<T>(token: string | undefined): T | null {
  const secret = key();
  if (!secret || !token) return null;
  const [version, ivValue, ciphertextValue, tagValue] = token.split(".");
  if (version !== "v1" || !ivValue || !ciphertextValue || !tagValue) return null;
  try {
    const decipher = createDecipheriv(
      "aes-256-gcm",
      secret,
      Buffer.from(ivValue, "base64url"),
    );
    decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
    return JSON.parse(
      Buffer.concat([
        decipher.update(Buffer.from(ciphertextValue, "base64url")),
        decipher.final(),
      ]).toString("utf8"),
    ) as T;
  } catch {
    return null;
  }
}

export function createSession(value: Omit<Session, "expires">) {
  return encrypt({
    ...value,
    expires: Date.now() + 30 * 24 * 60 * 60 * 1000,
  });
}

export function readSession(token: string | undefined) {
  const session = decrypt<Session>(token);
  if (
    !session ||
    typeof session.accessToken !== "string" ||
    typeof session.user?.login !== "string" ||
    session.expires <= Date.now()
  ) {
    return null;
  }
  return session;
}

function safeReturnTo(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/studio";
}

export function createOAuthState(returnTo: string | null) {
  const state = randomBytes(24).toString("base64url");
  const verifier = randomBytes(48).toString("base64url");
  return {
    state,
    challenge: createHash("sha256").update(verifier).digest("base64url"),
    cookie: encrypt({
      state,
      verifier,
      returnTo: safeReturnTo(returnTo),
      expires: Date.now() + 10 * 60 * 1000,
    }),
  };
}

export function verifyOAuthState(
  token: string | undefined,
  suppliedState: string,
) {
  const value = decrypt<OAuthState>(token);
  if (!value || value.expires <= Date.now()) return null;
  const expected = Buffer.from(value.state);
  const supplied = Buffer.from(suppliedState);
  if (
    expected.length !== supplied.length ||
    !timingSafeEqual(expected, supplied)
  ) {
    return null;
  }
  return value;
}

export function githubHeaders(accessToken: string) {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${accessToken}`,
    "User-Agent": "F1LEO-Field-Notes",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

export function isOwner(login: string) {
  return login.toLowerCase() ===
    (process.env.JOURNAL_OWNER ?? "Maaskk").toLowerCase();
}
