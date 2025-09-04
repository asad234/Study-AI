import type { CollectionConfig } from "payload"

export const Documents: CollectionConfig = {
  slug: "documents",
  access: {
    create: ({ req: { user } }) => !!user,
    read: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => !!user,
    delete: ({ req: { user } }) => !!user,
  },
  fields: [
    {
      name: "user",
      type: "relationship",
      relationTo: "profiles",
      required: true,
    },
    {
      name: "title",
      type: "text",
      required: true,
    },
    {
      name: "file_name",
      type: "text",
      required: true,
    },
    {
      name: "file_path",
      type: "text",
      required: true,
    },
    {
      name: "file_type",
      type: "text",
      required: true,
    },
    {
      name: "file_size",
      type: "number",
      required: true,
    },
    {
      name: "status",
      type: "select",
      options: [
        { label: "Pending", value: "pending" },
        { label: "Processing", value: "processing" },
        { label: "Ready", value: "ready" },
        { label: "Failed", value: "failed" },
      ],
      defaultValue: "pending",
      required: true,
    },
    {
      name: "processing_progress",
      type: "number",
      defaultValue: 0,
    },
    {
      name: "metadata",
      type: "json",
    },
    {
      name: "media_file",
      type: "relationship",
      relationTo: "media",
    },
  ],
  timestamps: true,
}
