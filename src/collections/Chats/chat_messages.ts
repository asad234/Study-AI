import { v4 as uuidv4 } from 'uuid';
import type { CollectionConfig } from 'payload';
import { afterMessageChange, afterMessageDelete } from './hooks/revalidate';

export const ChatMessages: CollectionConfig = {
  slug: 'chat_messages',
  admin: {
    defaultColumns: ['conversation', 'user', 'role', 'created_at'],
    useAsTitle: 'content',
  },
  fields: [
    {
      name: 'conversation',
      type: 'relationship',
      relationTo: 'chat_conversations',
      required: true,
      admin: { description: 'The conversation this message belongs to' },
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'profiles',
      required: true,
      admin: { description: 'Author of the message' },
    },
    {
      name: 'role',
      type: 'select',
      options: [
        { label: 'User', value: 'user' },
        { label: 'Assistant', value: 'assistant' },
        { label: 'System', value: 'system' },
      ],
      required: true,
    },
    { name: 'content', type: 'text', required: true },
    { name: 'metadata', type: 'json' },
    {
      name: 'created_at',
      type: 'date',
      required: true,
      defaultValue: () => new Date().toISOString(),
    },
  ],
  hooks: {
    afterChange: [afterMessageChange],
    afterDelete: [afterMessageDelete],
  },
};
