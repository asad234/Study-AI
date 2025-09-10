import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authoption"
import { getPayload } from "payload"
import configPromise from "@payload-config"
import { CreateProjectSchema } from "./project-schema"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await getPayload({ config: configPromise })

    // Get user profile
    const profiles = await payload.find({
      collection: "profiles",
      where: {
        email: {
          equals: session.user.email,
        },
      },
    })

    if (!profiles.docs.length) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    const userProfile = profiles.docs[0]

    const projects = await payload.find({
      collection: "projects",
      where: {
        user: {
          equals: userProfile.id,
        },
      },
      depth: 0, // Don't populate relationships automatically
      sort: "-createdAt",
    })

    const projectsWithDocuments = await Promise.all(
      projects.docs.map(async (project) => {
        try {
          const documents = await payload.find({
            collection: "documents",
            where: {
              project: {
                equals: project.id,
              },
            },
            depth: 1,
          })

          return {
            ...project,
            documents: documents.docs,
            file_count: documents.docs.length,
          } as typeof project & {
            documents: any[]
            file_count: number
          }
        } catch (error) {
          console.error(`[v0] Error fetching documents for project ${project.id}:`, error)
          return {
            ...project,
            documents: [],
            file_count: 0,
          } as typeof project & {
            documents: any[]
            file_count: number
          }
        }
      }),
    )

    console.log("[v0] Fetched projects count:", projectsWithDocuments.length)
    projectsWithDocuments.forEach((project, index) => {
      console.log(`[v0] Project ${index}:`, {
        id: project.id,
        name: project.name,
        documents: project.documents.length,
        file_count: project.file_count,
      })
    })

    return NextResponse.json({
      success: true,
      projects: projectsWithDocuments,
    })
  } catch (error) {
    console.error("Error fetching projects:", error)
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    console.log("[v0] Received project data:", JSON.stringify(body, null, 2))

    const validatedData = CreateProjectSchema.parse(body)
    console.log("[v0] Validation successful:", validatedData)

    const payload = await getPayload({ config: configPromise })

    // Get user profile
    const profiles = await payload.find({
      collection: "profiles",
      where: {
        email: {
          equals: session.user.email,
        },
      },
    })

    if (!profiles.docs.length) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    const userProfile = profiles.docs[0]
    console.log("[v0] User profile found:", { id: userProfile.id, email: userProfile.email })

    if (validatedData.document_ids && validatedData.document_ids.length > 0) {
      console.log("[v0] Validating document IDs:", validatedData.document_ids)

      for (const docId of validatedData.document_ids) {
        try {
          const document = await payload.findByID({
            collection: "documents",
            id: docId,
          })
          console.log("[v0] Found document:", { id: document.id, user: document.user })

          const documentUserId =
            typeof document.user === "object" && document.user !== null ? document.user.id : document.user

          if (documentUserId !== userProfile.id) {
            console.log("[v0] Document access denied - user mismatch")
            return NextResponse.json({ error: `Document ${docId} not found or access denied` }, { status: 403 })
          }
        } catch (docError) {
          console.log("[v0] Document validation error:", docError)
          return NextResponse.json({ error: `Document ${docId} not found` }, { status: 404 })
        }
      }
    }

    console.log("[v0] Creating project without documents first...")
    const projectData = {
      user: userProfile.id,
      name: validatedData.name,
      description: validatedData.description,
      category: validatedData.category,
      study_goal: validatedData.study_goal,
      target_date: validatedData.target_date,
      estimated_hours: validatedData.estimated_hours,
      status: "active",
      progress: 0,
      file_count: validatedData.document_ids?.length || 0,
    }
    console.log("[v0] Project data to create:", JSON.stringify(projectData, null, 2))

    const project = await payload.create({
      collection: "projects",
      data: projectData,
    })

    console.log("[v0] Project created successfully:", JSON.stringify(project, null, 2))

    try {
      const verifyProject = await payload.findByID({
        collection: "projects",
        id: project.id,
      })
      console.log("[v0] Project verification successful:", { id: verifyProject.id, name: verifyProject.name })
    } catch (verifyError) {
      console.error("[v0] Project verification failed:", verifyError)
    }

    if (validatedData.document_ids && validatedData.document_ids.length > 0) {
      console.log("[v0] Associating documents with project...")
      try {
        for (const docId of validatedData.document_ids) {
          await payload.update({
            collection: "documents",
            id: docId,
            data: {
              project: project.id,
            },
          })
          console.log("[v0] Associated document", docId, "with project", project.id)
        }
        console.log("[v0] All documents associated successfully")
      } catch (updateError) {
        console.error("[v0] Error associating documents:", updateError)
        // Don't fail the entire request if document association fails
      }
    }

    return NextResponse.json({
      success: true,
      project: project,
    })
  } catch (error) {
    console.error("[v0] Error creating project:", error)
    if (error instanceof Error && "issues" in error) {
      console.log("[v0] Validation issues:", (error as any).issues)
    }
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 })
  }
}
