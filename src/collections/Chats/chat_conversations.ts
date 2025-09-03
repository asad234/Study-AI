import { v4 as uuidv4 } from 'uuid';
import type { CollectionConfig } from 'payload';
import { afterConversationChange, afterConversationDelete } from './hooks/revalidate';

export const ChatConversations: CollectionConfig = {
  slug: 'chat_conversations',
  admin: {
    defaultColumns: ['title', 'user', 'created_at'],
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'profiles', // must match Profiles.slug
      required: true,
      admin: { description: 'Owner of the conversation' },
    },
    { name: 'title', type: 'text' },
    {
      name: 'created_at',
      type: 'date',
      required: true,
      defaultValue: () => new Date().toISOString(),
    },
    {
      name: 'updated_at',
      type: 'date',
      required: true,
      defaultValue: () => new Date().toISOString(),
    },
  ],
  hooks: {
    afterChange: [afterConversationChange],
    afterDelete: [afterConversationDelete],
  },
};
