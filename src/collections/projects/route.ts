import type { CollectionConfig } from "payload"
import { afterProjectChange, afterProjectDelete } from "./hooks/project-revalidate"

const Projects: CollectionConfig = {
  slug: "projects",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "category", "status", "progress", "createdAt"],
  },
  access: {
    read: () => true, // Allow reading projects (filtering handled in API)
    create: () => true, // Allow creating projects (user validation in API)
    update: () => true, // Allow updating projects (user validation in API)
    delete: () => true, // Allow deleting projects (user validation in API)
  },
  hooks: {
    afterChange: [afterProjectChange],
    afterDelete: [afterProjectDelete],
  },
  fields: [
    {
      name: "user",
      type: "relationship",
      relationTo: "profiles",
      required: true,
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "name",
      type: "text",
      required: true,
      admin: {
        description: "The name of your project",
      },
    },
    {
      name: "description",
      type: "textarea",
      admin: {
        description: "A brief description of your project",
      },
    },
    {
      name: "category",
      type: "select",
      options: [
        { label: "Mathematics", value: "mathematics" },
        { label: "Science", value: "science" },
        { label: "History", value: "history" },
        { label: "Literature", value: "literature" },
        { label: "Computer Science", value: "computer_science" },
        { label: "Languages", value: "languages" },
        { label: "Business", value: "business" },
        { label: "Other", value: "other" },
      ],
    },
    {
      name: "study_goal",
      type: "select",
      options: [
        { label: "Exam Preparation", value: "exam_preparation" },
        { label: "Course Completion", value: "course_completion" },
        { label: "General Knowledge", value: "general_knowledge" },
        { label: "Skill Development", value: "skill_development" },
      ],
    },
    {
      name: "status",
      type: "select",
      defaultValue: "active",
      options: [
        { label: "Active", value: "active" },
        { label: "In Progress", value: "in_progress" },
        { label: "Completed", value: "completed" },
        { label: "On Hold", value: "on_hold" },
      ],
    },
    {
      name: "progress",
      type: "number",
      defaultValue: 0,
      min: 0,
      max: 100,
      admin: {
        description: "Progress percentage (0-100)",
      },
    },
    {
      name: "target_date",
      type: "date",
      admin: {
        description: "Target completion date",
      },
    },
    {
      name: "estimated_hours",
      type: "number",
      admin: {
        description: "Estimated study hours",
      },
    },
    {
      name: "documents",
      type: "relationship",
      relationTo: "documents",
      hasMany: true,
      admin: {
        description: "Documents associated with this project",
      },
    },
    {
      name: "file_count",
      type: "number",
      defaultValue: 0,
      admin: {
        description: "Number of files in this project",
      },
    },
  ],
}

export default Projects
