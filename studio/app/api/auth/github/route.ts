import { NextResponse } from "next/server";
import { createOAuthState, OAUTH_COOKIE } from "@/lib/auth";

export async function GET(request: Request) {
  if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
    return NextResponse.redirect(new URL("/studio?error=setup", request.url), 303);
  }

  const requestUrl = new URL(request.url);
  const { state, challenge, cookie } = createOAuthState(
    requestUrl.searchParams.get("returnTo"),
  );
  const callback = new URL("/api/auth/github/callback", request.url).toString();
  const authorization = new URL("https://github.com/login/oauth/authorize");
  authorization.searchParams.set("client_id", process.env.GITHUB_CLIENT_ID);
  authorization.searchParams.set("redirect_uri", callback);
  authorization.searchParams.set("scope", "read:user public_repo");
  authorization.searchParams.set("state", state);
  authorization.searchParams.set("code_challenge", challenge);
  authorization.searchParams.set("code_challenge_method", "S256");

  const response = NextResponse.redirect(authorization);
  response.cookies.set(OAUTH_COOKIE, cookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60,
  });
  return response;
}
