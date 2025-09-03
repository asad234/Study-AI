import { v4 as uuidv4 } from 'uuid';
import type { CollectionConfig } from 'payload';

// ✅ Profiles Collection (users)
export const Profiles: CollectionConfig = {
  slug: 'profiles',
  admin: {
    defaultColumns: ['email', 'first_name', 'last_name', 'role'],
    useAsTitle: 'email',
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
    { name: 'email', type: 'text', required: true, unique: true },
    { name: 'first_name', type: 'text' },
    { name: 'last_name', type: 'text' },
    
    { name: 'avatar_url', type: 'text' },
    {
      name: 'role',
      type: 'select',
      options: [
        { label: 'User', value: 'user' },
        { label: 'Admin', value: 'admin' },
      ],
      defaultValue: 'user',
      required: true,
    },
    {
      name: 'subscription_plan',
      type: 'select',
      options: ['free', 'pro', 'enterprise'].map(v => ({ label: v, value: v })),
    },
    {
      name: 'subscription_status',
      type: 'select',
      options: ['active', 'inactive', 'trialing', 'canceled'].map(v => ({
        label: v,
        value: v,
      })),
    },
    { name: 'subscription_id', type: 'text' },
    { name: 'customer_id', type: 'text' },
    { name: 'trial_ends_at', type: 'date' },
    { name: 'created_at', type: 'date', required: true },
    { name: 'updated_at', type: 'date', required: true },
  ],
};

// ✅ Conversations
export const Conversations: CollectionConfig = {
  slug: 'conversations',
  fields: [
    {
      name: 'id',
      type: 'text',
      required: true,
      unique: true,
      defaultValue: () => uuidv4(),
    },
    { name: 'user', type: 'relationship', relationTo: 'profiles', required: true }, // user_id
    { name: 'title', type: 'text' },
    { name: 'created_at', type: 'date', required: true },
    { name: 'updated_at', type: 'date', required: true },
  ],
};

// ✅ Messages
export const Messages: CollectionConfig = {
  slug: 'messages',
  fields: [
    {
      name: 'id',
      type: 'text',
      required: true,
      unique: true,
      defaultValue: () => uuidv4(),
    },
    {
      name: 'conversation',
      type: 'relationship',
      relationTo: 'conversations',
      required: true,
    },
    { name: 'user', type: 'relationship', relationTo: 'profiles', required: true },
    {
      name: 'role',
      type: 'select',
      options: ['user', 'system', 'assistant'].map(v => ({ label: v, value: v })),
      required: true,
    },
    { name: 'content', type: 'textarea', required: true },
    { name: 'metadata', type: 'json' },
    { name: 'created_at', type: 'date', required: true },
  ],
};

// ✅ Documents
export const Documents: CollectionConfig = {
  slug: 'documents',
  fields: [
    { name: 'user', type: 'relationship', relationTo: 'profiles', required: true },
    { name: 'title', type: 'text' },
    { name: 'file_name', type: 'text' },
    { name: 'file_path', type: 'text' },
    { name: 'file_type', type: 'text' },
    { name: 'file_size', type: 'number' },
    {
      name: 'status',
      type: 'select',
      options: ['pending', 'processing', 'ready', 'failed'].map(v => ({
        label: v,
        value: v,
      })),
    },
    { name: 'processing_progress', type: 'number' },
    { name: 'metadata', type: 'json' },
    { name: 'created_at', type: 'date', required: true },
    { name: 'updated_at', type: 'date', required: true },
  ],
};
