import { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "./prisma"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { Adapter } from "next-auth/adapters"
import * as bcrypt from "bcryptjs"

export async function verifyUserCredentials(email?: string, password?: string) {
  if (!email || !password) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { email }
  })

  if (!user || !user.password) {
    return null
  }

  let isPasswordValid = false

  // Check if stored password is a bcrypt hash (starts with $2)
  if (user.password.startsWith('$2')) {
    isPasswordValid = await bcrypt.compare(password, user.password)
  } else {
    // Fallback to plaintext for legacy users
    isPasswordValid = password === user.password

    // If valid plaintext, upgrade to bcrypt hash
    if (isPasswordValid) {
      const hashedPassword = await bcrypt.hash(password, 10)
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword }
      })
    }
  }

  if (!isPasswordValid) {
    return null
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        return verifyUserCredentials(credentials?.email, credentials?.password)
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          access_type: "offline",
          prompt: "consent",
          scope: "openid email profile"
        }
      }
    }),
  ],
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id
      }
      return token
    },
    async session({ session, token }) {
      if (session?.user) {
        (session.user as any).id = token.id as string
      }
      return session
    }
  },
  secret: process.env.NEXTAUTH_SECRET || process.env.SESSION_SECRET,
}
