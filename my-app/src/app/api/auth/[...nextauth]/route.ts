// pages/api/auth/[...nextauth].ts
import NextAuth ,  {type AuthOptions}from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import {prisma}  from "../../../lib/prisma"
 const authOptions : AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
     clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!

    }),
  ],
  session: {
    strategy: "database",
  },
 
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
