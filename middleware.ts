// middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // Se o usuário acessar a raiz "/", manda ele pro Dashboard (que vai exigir login)
    if (req.nextUrl.pathname === "/") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token, 
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    "/", // <- Adicionamos a vigília na rota principal
    "/dashboard/:path*", 
  ],
};