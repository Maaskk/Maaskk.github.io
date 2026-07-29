import { NextRequest, NextResponse } from "next/server";
import {
  createSession,
  githubHeaders,
  OAUTH_COOKIE,
  SESSION_COOKIE,
  verifyOAuthState,
} from "@/lib/auth";

type GitHubUser = {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
};

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const oauth = state
    ? verifyOAuthState(request.cookies.get(OAUTH_COOKIE)?.value, state)
    : null;
  if (!code || !oauth) {
    return NextResponse.redirect(new URL("/studio?error=oauth", request.url), 303);
  }

  const callback = new URL("/api/auth/github/callback", request.url).toString();
  const tokenResponse = await fetch(
    "https://github.com/login/oauth/access_token",
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: callback,
        code_verifier: oauth.verifier,
      }),
      cache: "no-store",
    },
  );
  const token = (await tokenResponse.json()) as { access_token?: unknown };
  if (!tokenResponse.ok || typeof token.access_token !== "string") {
    return NextResponse.redirect(new URL("/studio?error=oauth", request.url), 303);
  }

  const userResponse = await fetch("https://api.github.com/user", {
    headers: githubHeaders(token.access_token),
    cache: "no-store",
  });
  if (!userResponse.ok) {
    return NextResponse.redirect(new URL("/studio?error=oauth", request.url), 303);
  }
  const github = (await userResponse.json()) as GitHubUser;
  if (typeof github.id !== "number" || typeof github.login !== "string") {
    return NextResponse.redirect(new URL("/studio?error=oauth", request.url), 303);
  }

  const session = createSession({
    accessToken: token.access_token,
    user: {
      id: github.id,
      login: github.login,
      name: github.name,
      avatarUrl: github.avatar_url,
      profileUrl: github.html_url,
    },
  });
  const response = NextResponse.redirect(new URL(oauth.returnTo, request.url), 303);
  response.cookies.set(SESSION_COOKIE, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  });
  response.cookies.set(OAUTH_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
