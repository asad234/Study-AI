// src/payload-types.ts

// Base type from Payload
export interface TypeWithID {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// Users collection
export interface User extends TypeWithID {
  name?: string;
  email: string;
  password: string;
  roles: ('admin' | 'user')[];
  subscription_status?: 'active' | 'inactive' | 'canceled';
}

// Media collection
export interface Media extends TypeWithID {
  alt: string;
  url?: string;
  filename: string;
  mimeType: string;
  filesize: number;
  width?: number;
  height?: number;
}

// Categories collection
export interface Category extends TypeWithID {
  name: string;
  slug: string;
}

// Pages collection
export interface Page extends TypeWithID {
  title: string;
  slug: string;
  content?: any; // could be rich text
  heroImage?: string | Media;
}

// Posts collection
export interface Post extends TypeWithID {
  title: string;
  slug: string;
  heroImage?: string | Media;
  content: any; // Lexical RichText JSON
  relatedPosts?: (string | Post)[];
  categories?: (string | Category)[];
  authors?: (string | User)[];
  populatedAuthors?: { id: string; name?: string }[];
  meta?: {
    title?: string;
    description?: string;
    image?: string | Media;
    overview?: string;
    preview?: string;
  };
  publishedAt?: string;
  _status?: 'draft' | 'published';
}
