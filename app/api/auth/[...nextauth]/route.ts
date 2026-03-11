// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth"; // Agora isso vai funcionar lindamente!

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };