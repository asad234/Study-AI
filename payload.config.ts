import { buildConfig } from "payload"
import { postgresAdapter } from "@payloadcms/db-postgres"
import { lexicalEditor } from "@payloadcms/richtext-lexical"
import { Users } from "./src/collections/Users"
import { Media } from "./src/collections/Media"
import { Pages } from "./src/collections/Pages"
import { Categories } from "./src/collections/Categories"

export default buildConfig({
  admin: {
    user: Users.slug,
  },
  collections: [Users, Media, Pages, Categories],
  editor: lexicalEditor({}),
  secret: process.env.PAYLOAD_SECRET || "",
  typescript: {
    outputFile: "./src/payload-types.ts",
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.PAYLOAD_DATABASE_URI || process.env.DATABASE_URL,
    },
  }),
  // plugins array has been completely removed
})