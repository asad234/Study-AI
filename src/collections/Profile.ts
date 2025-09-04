import { v4 as uuidv4 } from "uuid"
import type { CollectionConfig } from "payload"

export const Profiles: CollectionConfig = {
  slug: "profiles",
  timestamps: true,
  admin: {
    defaultColumns: ["email", "first_name", "last_name", "role"],
    useAsTitle: "email",
  },
  fields: [
    {
      name: "id",
      type: "text",
      required: true,
      unique: true,
      defaultValue: () => uuidv4(),
      admin: { description: "UUID identifier" },
    },
    { name: "email", type: "text", required: true, unique: true },
    { name: "first_name", type: "text" },
    { name: "last_name", type: "text" },
    { name: "avatar_url", type: "text" },
    { name: "bio", type: "text" },
    { name: "location", type: "text" },
    {
      name: "role",
      type: "select",
      options: [
        { label: "User", value: "user" },
        { label: "Admin", value: "admin" },
      ],
      defaultValue: "user",
      required: true,
    },
    {
      name: "subscription_plan",
      type: "select",
      options: ["free", "pro", "enterprise"].map((v) => ({ label: v, value: v })),
    },
    {
      name: "subscription_status",
      type: "select",
      options: ["active", "inactive", "trialing", "canceled"].map((v) => ({
        label: v,
        value: v,
      })),
    },
    { name: "subscription_id", type: "text" },
    { name: "customer_id", type: "text" },
    { name: "trial_ends_at", type: "date" },
  ],
}
