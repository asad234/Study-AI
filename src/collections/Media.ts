import type { CollectionConfig } from "payload"

export const Media: CollectionConfig = {
  slug: "media",
  access: {
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => !!user,
    delete: ({ req: { user } }) => !!user,
    read: ({ req: { user } }) => !!user,
  },
  fields: [
    {
      name: "alt",
      label: "Alt Text",
      type: "text",
      required: false,
    },
    {
      name: "description",
      label: "Description",
      type: "textarea",
      required: false,
    },
  ],
  upload: {
    staticDir: "uploads",
    mimeTypes: [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ],
  },
}
