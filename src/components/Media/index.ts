// collections/Media/index.ts
import { v4 as uuidv4 } from 'uuid'
import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    useAsTitle: 'filename',
    defaultColumns: ['filename', 'mimeType', 'created_at'],
  },
  fields: [
    {
      name: 'id',
      type: 'text',
      required: true,
      unique: true,
      defaultValue: () => uuidv4(),
      admin: { description: 'UUID identifier' },
    },
    { name: 'filename', type: 'text', required: true },
    { name: 'mimeType', type: 'text', required: true }, // image, video, pdf, docx, pptx
    { name: 'alt', type: 'text' },
    { name: 'url', type: 'text' },
    { name: 'width', type: 'number' },
    { name: 'height', type: 'number' },
    { name: 'filesize', type: 'number' },
    { name: 'created_at', type: 'date', required: true, defaultValue: () => new Date().toISOString() },
    { name: 'updated_at', type: 'date', required: true, defaultValue: () => new Date().toISOString() },
  ],
}
