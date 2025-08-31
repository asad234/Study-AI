// authOptions.ts
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { NextResponse } from "next/server";

// Define the user type
interface User {
  id: string;
  email: string;
  name: string;
  password: string; // In a real app, this would be a hashed password
}

// Mock database - in a real app, you would use a database like MongoDB, PostgreSQL, etc.
const users: User[] = [];

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        name: { label: "Name", type: "text" },
      },
      async authorize(credentials, req) {
        // Sign in logic
        if (req.method === "POST" && req.body?.action === "signup") {
          // Sign up logic
          const { email, password, name } = credentials || {};
          
          if (!email || !password || !name) {
            throw new Error("Missing required fields");
          }
          
          // Check if user already exists
          const existingUser = users.find((user) => user.email === email);
          if (existingUser) {
            throw new Error("User already exists");
          }
          
          // Create new user (in a real app, you would hash the password)
          const newUser: User = {
            id: Date.now().toString(),
            email,
            name,
            password, // In a real app: await bcrypt.hash(password, 10)
          };
          
          users.push(newUser);
          
          // Return user without password
          return {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
          };
        } else {
          // Sign in logic
          const { email, password } = credentials || {};
          
          if (!email || !password) {
            throw new Error("Missing email or password");
          }
          
          // Find user
          const user = users.find((user) => user.email === email);
          if (!user) {
            throw new Error("No user found with this email");
          }
          
          // Check password (in a real app, you would use bcrypt.compare)
          if (user.password !== password) {
            throw new Error("Incorrect password");
          }
          
          // Return user without password
          return {
            id: user.id,
            email: user.email,
            name: user.name,
          };
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    signUp: "/auth/signup",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};