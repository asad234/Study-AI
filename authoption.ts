// authOptions.ts
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// Define the user type for your database
interface DatabaseUser {
  id: string;
  email: string;
  name: string;
  password: string;
}

// Define the returned user type (without password)
interface AuthUser {
  id: string;
  email: string;
  name: string;
}

// Mock database
const users: DatabaseUser[] = [];

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
        if (req.method === "POST" && (req.body as { action?: string })?.action === "signup") {
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
          
          // Create new user
          const newUser: DatabaseUser = {
            id: Date.now().toString(),
            email,
            name,
            password, // In real app: await bcrypt.hash(password, 10)
          };
          
          users.push(newUser);
          
          // Return user without password
          const authUser: AuthUser = {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
          };
          
          return authUser;
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
          
          // Check password
          if (user.password !== password) {
            throw new Error("Incorrect password");
          }
          
          // Return user without password
          const authUser: AuthUser = {
            id: user.id,
            email: user.email,
            name: user.name,
          };
          
          return authUser;
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
        // Use type assertion to avoid TypeScript errors
        (session.user as { id: string }).id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    // Use type assertion for custom pages
    ...({ signUp: "/auth/signup" } as any),
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};