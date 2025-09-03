// src/collections/Documents.ts
import type { CollectionConfig } from 'payload';

export const Documents: CollectionConfig = {
  slug: 'documents', // <-- must be exactly 'documents'
  fields: [
    { name: 'user', type: 'relationship', relationTo: 'profiles', required: true },
    { name: 'title', type: 'text' },
    { name: 'file_name', type: 'text' },
    { name: 'file_path', type: 'text' },
    { name: 'file_type', type: 'text' },
    { name: 'file_size', type: 'number' },
    { name: 'status', type: 'select', options: ['pending','processing','ready','failed'].map(v => ({label: v, value: v})) },
    { name: 'processing_progress', type: 'number' },
    { name: 'metadata', type: 'json' },
    { name: 'created_at', type: 'date', required: true },
    { name: 'updated_at', type: 'date', required: true },
  ],
};
