import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authoption"
import { getPayload } from "payload"
import configPromise from "@payload-config"
import { UpdateProjectSchema } from "../project-schema"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

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

    console.log(" Looking for project with ID:", id)

    const project = await payload.findByID({
      collection: "projects",
      id: id,
      depth: 2,
    })

    console.log("Found project:", project ? `ID ${project.id}, user: ${project.user}` : "Not found")
    console.log("Current user profile ID:", userProfile.id)

    const projectUserId = typeof project.user === "object" && project.user !== null ? project.user.id : project.user
    if (projectUserId !== userProfile.id) {
      console.log("Access denied - user mismatch")
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      project,
    })
  } catch (error) {
    console.error("Error fetching project:", error)
    return NextResponse.json({ error: "Failed to fetch project" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = UpdateProjectSchema.parse(body)

    const { id } = await params

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

    console.log("Updating project with ID:", id)
    console.log("Update data:", validatedData)

    const existingProject = await payload.findByID({
      collection: "projects",
      id: id,
      depth: 2,
    })

    console.log(
      "Existing project found:",
      existingProject ? `ID ${existingProject.id}, user: ${existingProject.user}` : "Not found",
    )

    const projectUserId =
      typeof existingProject.user === "object" && existingProject.user !== null
        ? existingProject.user.id
        : existingProject.user
    if (projectUserId !== userProfile.id) {
      console.log("Update access denied - user mismatch")
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    if (validatedData.document_ids && validatedData.document_ids.length > 0) {
      console.log("Adding documents to project:", validatedData.document_ids)

      // Verify all documents belong to the user
      for (const documentId of validatedData.document_ids) {
        try {
          const document = await payload.findByID({
            collection: "documents",
            id: documentId,
          })

          const docUserId =
            typeof document.user === "object" && document.user !== null ? document.user.id : document.user
          if (docUserId !== userProfile.id) {
            console.error("Document", documentId, "does not belong to user")
            return NextResponse.json({ error: "Document access denied" }, { status: 403 })
          }

          console.log("Verified document", documentId, "belongs to user")
        } catch (docError) {
          console.error("Failed to verify document", documentId, ":", docError)
          return NextResponse.json({ error: "Document not found" }, { status: 404 })
        }
      }

      const existingDocuments = existingProject.documents || []
      const existingDocIds = Array.isArray(existingDocuments)
        ? existingDocuments.map((doc) => (typeof doc === "object" ? doc.id : doc).toString())
        : []
      const newDocIds = validatedData.document_ids.map((id) => id.toString())
      const combinedDocIds = [...new Set([...existingDocIds, ...newDocIds])]

      console.log("Existing documents:", existingDocIds)
      console.log("New documents:", newDocIds)
      console.log("Combined documents:", combinedDocIds)

      try {
        const documentIdsAsNumbers = combinedDocIds.map((id) => {
          const numId = Number.parseInt(id, 10)
          if (isNaN(numId)) {
            throw new Error(`Invalid document ID: ${id}`)
          }
          return numId
        })

        console.log("Document IDs as numbers:", documentIdsAsNumbers)

        const updatedProject = await payload.update({
          collection: "projects",
          id: id,
          data: {
            documents: documentIdsAsNumbers,
            file_count: documentIdsAsNumbers.length,
          },
        })

        console.log(
          "Project updated successfully:",
          updatedProject.id,
          "with",
          documentIdsAsNumbers.length,
          "documents",
        )

        return NextResponse.json({
          success: true,
          project: updatedProject,
        })
      } catch (updateError) {
        console.error("Error updating project with documents:", updateError)
        return NextResponse.json({ error: "Failed to associate documents with project" }, { status: 500 })
      }
    } else {
      // Regular project update without documents
      const project = await payload.update({
        collection: "projects",
        id: id,
        data: validatedData,
      })

      console.log("Project updated successfully:", project.id)

      return NextResponse.json({
        success: true,
        project,
      })
    }
  } catch (error) {
    console.error("Error updating project:", error)
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

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

    // First check if user owns this project
    const existingProject = await payload.findByID({
      collection: "projects",
      id: id,
    })

    const projectUserId =
      typeof existingProject.user === "object" && existingProject.user !== null
        ? existingProject.user.id
        : existingProject.user
    if (projectUserId !== userProfile.id) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Delete project
    await payload.delete({
      collection: "projects",
      id: id,
    })

    return NextResponse.json({
      success: true,
      message: "Project deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting project:", error)
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 })
  }
}
