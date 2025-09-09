import { buildConfig, type PayloadRequest } from "payload"
import { postgresAdapter } from "@payloadcms/db-postgres"
import { lexicalEditor } from "@payloadcms/richtext-lexical"
import path from "path"
import { fileURLToPath } from "url"

// Import collections
import { Users } from "./src/collections/Users"
import { Pages } from "./src/collections/Pages"
import { Categories } from "./src/collections/Categories"
import { Posts } from "./src/collections/Posts"
import { Profiles } from "@/collections/Profile"
import { Flashcards } from "@/collections/Flashcards"
import { Documents } from "@/collections/Documents"
import { Quizzes } from "@/collections/Quize/Quizzes"
import { QuizAttempts } from "@/collections/Quize/QuizeAttemps"
import { ChatConversations } from "@/collections/Chats/chat_conversations"
import { ChatMessages } from "@/collections/Chats/chat_messages"
import { Exams } from "@/collections/Exams/exams"
import { ExamQuestions } from "@/collections/Exams/exam-questions"
import { ExamAttempts } from "@/collections/Exams/exam-attempts"
import { Media } from "@/collections/Media"
import Projects from "@/collections/projects/route"

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000",

  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
    user: Users.slug,
    livePreview: {
      breakpoints: [
        { label: "Mobile", name: "mobile", width: 375, height: 667 },
        { label: "Tablet", name: "tablet", width: 768, height: 1024 },
        { label: "Desktop", name: "desktop", width: 1440, height: 900 },
      ],
    },
  },

  editor: lexicalEditor({}),

  db: postgresAdapter({
    pool: {
      connectionString: process.env.PAYLOAD_DATABASE_URL || "",
    },
  }),

  collections: [
    Users,
    Media,
    Pages,
    Categories,
    Posts,
    Profiles,
    Documents,
    Quizzes,
    Flashcards,
    QuizAttempts,
    Exams,
    ExamQuestions,
    ExamAttempts,
    ChatConversations,
    ChatMessages,
    Projects,
  ],

  secret: process.env.PAYLOAD_SECRET || "",

  typescript: {
    outputFile: path.resolve(dirname, "src/payload-types.ts"),
  },

  graphQL: {
    disable: false,
  },

  csrf: [
    "https://study-rf1okjecj-asad234s-projects.vercel.app",
    process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000",
  ],

  jobs: {
    access: {
      run: ({ req }: { req: PayloadRequest }): boolean => {
        if (req.user) return true
        const authHeader = req.headers.get("authorization")
        return authHeader === `Bearer ${process.env.CRON_SECRET}`
      },
    },
    tasks: [],
  },
})
