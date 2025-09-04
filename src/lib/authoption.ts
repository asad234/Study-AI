import CredentialsProvider from "next-auth/providers/credentials"
import type { NextAuthOptions } from "next-auth"
import { getPayload } from "payload"
import config from "@payload-config"
import crypto from "crypto"

export const authOptions: NextAuthOptions = {
  providers: [
    // Credentials provider for email/password login auth
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        try {
          console.log("🔐 Credentials login attempt:", credentials?.email)

          const payload = await getPayload({ config })

          if (!credentials?.email || !credentials?.password) {
            return null
          }

          // Use Payload's built-in login method directly
          const result = await payload.login({
            collection: "users",
            data: {
              email: credentials.email,
              password: credentials.password,
            },
          })

          if (result.user) {
            console.log("✅ Credentials login successful:", result.user.id)
            return {
              id: result.user.id.toString(),
              email: result.user.email || "",
              name: result.user.name || "",
              // Additional properties will be handled in JWT callback
              roles: result.user.roles || ["client"],
              token: result.token,
              isNewUser: false,
            }
          }

          return null
        } catch (error: any) {
          console.error("❌ Credentials login failed:", error.message)
          return null
        }
      },
    }),
    // Google OAuth Provider
  ],
  callbacks: {
    // Handle sign-in callback - this runs when user signs in
    async signIn({ user, account, profile }) {
      console.log("🔍 SignIn callback triggered:", {
        provider: account?.provider,
        email: user.email,
        name: user.name,
      })

      // For OAuth providers (Google, LinkedIn, GitHub)
      if (account?.provider !== "credentials") {
        try {
          const payload = await getPayload({ config })

          // Ensure we have required data
          if (!user.email || !account) {
            console.error("❌ No email provided by OAuth provider or account is null")
            return false
          }

          // Check if user already exists
          const existingUser = await payload.find({
            collection: "users",
            where: {
              email: { equals: user.email },
            },
            limit: 1,
          })

          if (existingUser.docs.length === 0) {
            // Create new user for social sign-up
            console.log("✅ Creating new social user:", user.email)

            // Generate a name from email if not provided
            const userName = user.name || user.email.split("@")[0] || "User"

            // Determine authType safely
            const authType =
              account.provider === "google"
                ? "google"
                : account.provider === "linkedin"
                  ? "linkedin"
                  : account.provider === "github"
                    ? "github"
                    : "credentials"

            // Generate a secure random password for OAuth users
            // This satisfies Payload's auth requirements but won't be used by the user
            const randomPassword = crypto.randomBytes(32).toString("hex")

            console.log("🔄 Creating user with data:", {
              email: user.email,
              name: userName,
              roles: "client",
              authType,
              hasPassword: false,
              onboardingCompleted: false,
            })

            const newUser = await payload.create({
              collection: "users",
              data: {
                email: user.email,
                name: userName,
                roles: "client" as const,
                authType: authType as "credentials" | "google" | "linkedin" | "github",
                hasPassword: false,
                onboardingCompleted: false,
                password: randomPassword, // Add this to satisfy Payload's auth requirements
              },
              overrideAccess: true, // Bypass access control for OAuth user creation
            })

            console.log("✅ New social user created:", newUser.id)
            // Update the user object with the new ID and mark as new user
            user.id = newUser.id.toString()
            user.isNewUser = true
          } else {
            // Existing user - safely access the first document
            const existingUserDoc = existingUser.docs[0]
            if (existingUserDoc) {
              console.log("✅ Existing social user found:", existingUserDoc.id)
              user.id = existingUserDoc.id.toString()
              user.isNewUser = false
            } else {
              console.error("❌ Unexpected: existingUser.docs has length > 0 but first item is undefined")
              return false
            }
          }

          return true
        } catch (error) {
          console.error("❌ Error in social sign-in:", error)

          // Enhanced error logging
          if (error && typeof error === "object" && "data" in error) {
            console.error("❌ Payload error details:", error.data)
          }

          // Try to find if user was actually created despite the error
          if (user.email) {
            try {
              const payload = await getPayload({ config })
              const retryFind = await payload.find({
                collection: "users",
                where: {
                  email: { equals: user.email },
                },
                limit: 1,
              })

              if (retryFind.docs.length > 0 && retryFind.docs[0]) {
                const foundUser = retryFind.docs[0]
                console.log("🔍 Found user after creation error:", foundUser.id)
                user.id = foundUser.id.toString()
                user.isNewUser = !foundUser.onboardingCompleted
                return true
              }
            } catch (retryError) {
              console.error("❌ Retry find also failed:", retryError)
            }
          }

          return false
        }
      }

      // For credentials provider, allow through (existing logic)
      return true
    },

    // Handle redirect callback - determines where to redirect after sign-in
    async redirect({ url, baseUrl }) {
      console.log("🔄 Redirect callback:", { url, baseUrl })

      // If URL contains socialSignUp or newUser, redirect to dashboard with flag
      if (url.includes("socialSignUp=true") || url.includes("newUser=true")) {
        console.log("🎯 Redirecting new user to onboarding")
        return `${baseUrl}/dashboard?newUser=true`
      }

      // If it's a relative URL, make it absolute
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`
      }

      // If it's the same origin, allow it
      if (new URL(url).origin === baseUrl) {
        return url
      }

      // Default redirect for existing users
      console.log("🎯 Redirecting existing user to dashboard")
      return `${baseUrl}/dashboard`
    },

    // Handle JWT callback to store the token and additional user info in the JWT
    async jwt({ token, user, account, trigger }) {
      console.log("🔑 JWT callback:", {
        hasUser: !!user,
        provider: account?.provider,
        trigger,
        isNewUser: user?.isNewUser,
      })

      if (user) {
        // Safely assign user properties with proper null checks
        token.id = user.id || ""
        token.email = user.email || ""
        token.name = user.name || ""
        token.roles = user.roles || ["client"]
        token.isNewUser = user.isNewUser || false
        console.log("🔑 JWT token updated with user data:", {
          id: token.id,
          email: token.email,
          isNewUser: token.isNewUser,
        })
      }

      // Handle session update trigger to refresh user data from database
      if (trigger === "update" && token.id) {
        try {
          const payload = await getPayload({ config })
          const userResult = await payload.find({
            collection: "users",
            where: {
              id: { equals: token.id },
            },
            limit: 1,
          })

          if (userResult.docs.length > 0) {
            const user = userResult.docs[0]
            if (user) {
              token.isNewUser = !user.onboardingCompleted
              console.log("🔄 JWT updated from database:", {
                id: token.id,
                onboardingCompleted: user.onboardingCompleted,
                isNewUser: token.isNewUser,
              })
            }
          }
        } catch (error) {
          console.error("❌ Error updating JWT from database:", error)
        }
      }

      return token
    },

    // Handle session callback to map the user info from the JWT into the session
    async session({ session, token }) {
      if (session.user) {
        // Safely assign token properties with proper null checks
        session.user.id = (token.id as string) || ""
        session.user.email = (token.email as string) || ""
        session.user.name = (token.name as string) || ""
        session.user.roles = (token.roles as string[]) || ["client"]
        session.user.isNewUser = (token.isNewUser as boolean) || false
        console.log("👤 Session updated:", {
          id: session.user.id,
          email: session.user.email,
          isNewUser: session.user.isNewUser,
        })
      }
      return session
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET || process.env.PAYLOAD_SECRET,
  pages: {
    signIn: "/login",
    error: "/auth/error",
  },
  logger: {
    error(code, metadata) {
      console.error("🔴 NEXTAUTH ERROR", code, metadata)
    },
    warn(code) {
      console.warn("🟠 NEXTAUTH WARN", code)
    },
    debug(code, metadata) {
      console.debug("🟢 NEXTAUTH DEBUG", code, metadata)
    },
  },
  // Enable debug in development
  debug: process.env.NODE_ENV === "development",
}
