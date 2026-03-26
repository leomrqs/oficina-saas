// app/api/auth/impersonate/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyImpersonationToken } from "@/lib/impersonation";
import { encode } from "next-auth/jwt";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const result = verifyImpersonationToken(token, secret);
  if (!result) {
    return NextResponse.redirect(new URL("/login?error=TokenExpirado", req.url));
  }

  const user = await prisma.user.findUnique({
    where: { id: result.userId },
    select: { id: true, name: true, email: true, role: true, tenantId: true },
  });

  if (!user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Create a NextAuth-compatible JWT for the target user
  const jwt = await encode({
    secret,
    token: {
      name: user.name,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      id: user.id,
      sub: user.id,
      impersonating: true,
    },
  });

  const response = NextResponse.redirect(new URL("/dashboard", req.url));

  // Set the session cookie (NextAuth default cookie names)
  const isProduction = process.env.NODE_ENV === "production";
  const cookieName = isProduction
    ? "__Secure-next-auth.session-token"
    : "next-auth.session-token";

  response.cookies.set(cookieName, jwt, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60, // 1 hour session for impersonation
  });

  return response;
}
