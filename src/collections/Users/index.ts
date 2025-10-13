import type { CollectionConfig } from "payload"

export const Users: CollectionConfig = {
  slug: "users",
  auth: {
    maxLoginAttempts: 5,
    lockTime: 600 * 1000, // 10 minutes
    verify: false, // Disable email verification for now
  },
  access: {
    admin: () => true,
    create: () => true,
    delete: () => true,
    read: () => true,
    update: () => true,
  },
  admin: {
    defaultColumns: ["name", "email", "roles", "plan", "subscriptionStatus"],
    useAsTitle: "name",
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
    },
    {
      name: "roles",
      type: "select",
      hasMany: false,
      options: [
        { label: "Admin", value: "admin" },
        { label: "Client", value: "client" },
      ],
      defaultValue: "client",
      required: true,
    },
    {
      name: "authType",
      type: "select",
      options: [
        { label: "Email/Password", value: "credentials" },
        { label: "Google OAuth", value: "google" },
        { label: "LinkedIn OAuth", value: "linkedin" },
        { label: "GitHub OAuth", value: "github" },
      ],
      defaultValue: "credentials",
      required: true,
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "hasPassword",
      type: "checkbox",
      defaultValue: true,
      admin: {
        hidden: true, // Hide from admin UI
      },
    },
    {
      name: "onboardingCompleted",
      type: "checkbox",
      defaultValue: false,
      admin: {
        position: "sidebar",
        description: "Whether the user has completed the onboarding process",
      },
    },
    // Stripe Subscription Fields
    {
      name: "plan",
      type: "select",
      options: [
        { label: "Free Trial", value: "free_trial" },
        { label: "Pro", value: "pro" },
      ],
      defaultValue: "free_trial",
      required: true,
      admin: {
        position: "sidebar",
        description: "User's current subscription plan",
      },
    },
    {
      name: "stripeCustomerId",
      type: "text",
      unique: true,
      admin: {
        position: "sidebar",
        description: "Stripe Customer ID",
        readOnly: true,
      },
    },
    {
      name: "subscriptionId",
      type: "text",
      admin: {
        position: "sidebar",
        description: "Stripe Subscription ID",
        readOnly: true,
      },
    },
    {
      name: "subscriptionStatus",
      type: "select",
      options: [
        { label: "Active", value: "active" },
        { label: "Canceled", value: "canceled" },
        { label: "Past Due", value: "past_due" },
        { label: "Unpaid", value: "unpaid" },
        { label: "Incomplete", value: "incomplete" },
        { label: "Trialing", value: "trialing" },
      ],
      admin: {
        position: "sidebar",
        description: "Current subscription status",
        readOnly: true,
      },
    },
    {
      name: "billingPeriod",
      type: "select",
      options: [
        { label: "Monthly", value: "monthly" },
        { label: "Yearly", value: "yearly" },
      ],
      admin: {
        position: "sidebar",
        description: "Billing cycle",
        readOnly: true,
      },
    },
    {
      name: "currentPeriodEnd",
      type: "date",
      admin: {
        position: "sidebar",
        description: "When the current billing period ends",
        readOnly: true,
        date: {
          displayFormat: "MMM dd, yyyy",
        },
      },
    },
    // Usage tracking fields
    {
      name: "usageStats",
      type: "group",
      admin: {
        description: "Track usage against plan limits",
      },
      fields: [
        {
          name: "documentsUploaded",
          type: "number",
          defaultValue: 0,
          admin: {
            description: "Number of documents uploaded this month",
          },
        },
        {
          name: "flashcardsGenerated",
          type: "number",
          defaultValue: 0,
          admin: {
            description: "Number of flashcards generated this month",
          },
        },
        {
          name: "quizzesTaken",
          type: "number",
          defaultValue: 0,
          admin: {
            description: "Number of quizzes taken this month",
          },
        },
        {
          name: "examSimulationsTaken",
          type: "number",
          defaultValue: 0,
          admin: {
            description: "Number of exam simulations taken this month",
          },
        },
        {
          name: "projectsCreated",
          type: "number",
          defaultValue: 0,
          admin: {
            description: "Number of projects created",
          },
        },
        {
          name: "lastResetDate",
          type: "date",
          admin: {
            description: "Last time usage stats were reset",
          },
        },
      ],
    },
  ],
  timestamps: true,
  hooks: {
    beforeValidate: [
      ({ data, operation }) => {
        // Ensure data exists before proceeding
        if (!data) {
          return data
        }

        // For OAuth users, mark as not having password
        if (data.authType && data.authType !== "credentials") {
          data.hasPassword = false
        } else {
          // For credentials users, mark as having password
          data.hasPassword = true
        }

        // Ensure authType is set - only set if it's not already defined
        if (!data.authType) {
          data.authType = "credentials"
        }

        // Initialize plan for new users
        if (operation === "create" && !data.plan) {
          data.plan = "free_trial"
        }

        return data
      },
    ],
    beforeChange: [
      ({ data, operation, req }) => {
        // For OAuth users creating accounts
        if (operation === "create" && data?.authType !== "credentials") {
          // Just mark that they don't have a user-set password
          data.hasPassword = false
          // The password should already be provided by the signIn callback
          // No need to generate it here since it's handled in authOptions
        }
        return data
      },
    ],
    afterChange: [
      async ({ doc, req, operation }) => {
        if (operation === "create") {
          const { name, email, id } = doc

          if (!name || typeof name !== "string") {
            console.error("❌ User name is missing or invalid:", { name, email, id })
            return
          }

          if (!email || typeof email !== "string") {
            console.error("❌ User email is missing or invalid:", { name, email, id })
            return
          }

          const nameParts = name.split(" ")
          const firstName = nameParts[0] || ""
          const lastName = nameParts.slice(1).join(" ") || ""

          console.log("🔄 User created hook triggered for:", email, "- Creating profile...")

          setTimeout(async () => {
            try {
              await req.payload.create({
                collection: "profiles",
                data: {
                  email,
                  first_name: firstName,
                  last_name: lastName,
                  role: "user",
                  created_at: new Date(),
                  updated_at: new Date(),
                },
              })
              console.log("✅ Profile created for user:", id)
            } catch (error) {
              console.error("❌ Deferred creation of Profile failed:", error)
            }
          }, 0)
        }
      },
    ],
  },
}