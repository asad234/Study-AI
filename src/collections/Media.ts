import { CollectionConfig } from 'payload';

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    create: () => true,
    update: ({ req: { user } }) => user?.roles === 'admin',
    delete: ({ req: { user } }) => user?.roles === 'admin',
    read: () => true,
  },
  fields: [
    {
      name: 'alt',
      label: 'Alt Text',
      type: 'text',
      required: false,
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      required: false,
    },
  ],
  upload: true,
};
