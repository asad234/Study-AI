import type { CollectionConfig } from "payload"
import { afterConversationChange, afterConversationDelete } from "./hooks/chat-validate"

export const ChatConversations: CollectionConfig = {
  slug: "chat_conversations",
  admin: {
    defaultColumns: ["title", "user", "createdAt"],
    useAsTitle: "title",
  },
  fields: [
    {
      name: "user",
      type: "relationship",
      relationTo: "profiles",
      required: true,
      admin: { description: "Owner of the conversation" },
    },
    { name: "title", type: "text" },
  ],
  hooks: {
    afterChange: [afterConversationChange],
    afterDelete: [afterConversationDelete],
  },
}
