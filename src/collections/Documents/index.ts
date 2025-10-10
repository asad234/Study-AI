// src/collections/Documents.ts
import { CollectionConfig } from "payload"

export const Documents: CollectionConfig = {
  slug: "documents",
  auth: false,
  admin: {
    useAsTitle: "title",
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
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
    },
    {
      name: "file_path",
      type: "text",
    },
    {
      name: "file_type",
      type: "text",
    },
    {
      name: "file_size",
      type: "number",
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
    },
    {
      name: "processing_progress",
      type: "number",
      defaultValue: 0,
      min: 0,
      max: 100,
    },
    // ✅ ADD THIS FIELD - This is where extracted text will be stored
    {
      name: "notes",
      type: "textarea",
      admin: {
        description: "Extracted text content from the uploaded document",
        placeholder: "Text will be automatically extracted after upload...",
      },
    },
    {
      name: "metadata",
      type: "json",
    },
    {
      name: "media_file",
      type: "upload",
      relationTo: "media",
      required: true,
    },
    {
      name: "project",
      type: "relationship",
      relationTo: "projects",
    },
  ],
}

export default Documents