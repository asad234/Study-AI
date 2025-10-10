// api/documents/[id]/extract/route.ts
// This endpoint will extract text from uploaded documents

import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authoption"
import { getPayload } from "payload"
import config from "@payload-config"
import pdf from "pdf-parse"
import mammoth from "mammoth"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check for internal API key OR session
    const internalApiKey = request.headers.get("x-internal-api-key")
    const isInternalCall = internalApiKey === process.env.INTERNAL_API_KEY
    
    let userEmail: string | undefined
    
    if (isInternalCall) {
      // Internal call - skip session check
      console.log("Internal API call detected")
    } else {
      // External call - require session
      const session = await getServerSession(authOptions)
      if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
      userEmail = session.user.email
    }

    const { id } = await params
    const payload = await getPayload({ config })

    // Get the document first to find the user
    const document = await payload.findByID({
      collection: "documents",
      id: id,
    })

    // If not an internal call, verify ownership
    if (!isInternalCall && userEmail) {
      // Get user profile to verify ownership
      const userProfiles = await payload.find({
        collection: "profiles",
        where: { email: { equals: userEmail } },
        limit: 1,
      })

      if (!userProfiles.docs.length) {
        return NextResponse.json({ error: "User profile not found" }, { status: 404 })
      }

      const userProfile = userProfiles.docs[0]

      // Verify ownership
      const documentUserId =
        typeof document.user === "object" && document.user !== null
          ? document.user.id
          : document.user

      if (documentUserId !== userProfile.id) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 })
      }
    }

    // Check if document has a file
    if (!document.media_file) {
      return NextResponse.json({ error: "No file attached to document" }, { status: 400 })
    }

    // Get the file from Payload
    const mediaFile = typeof document.media_file === "object" 
      ? document.media_file 
      : await payload.findByID({ collection: "media", id: document.media_file })

    if (!mediaFile || !mediaFile.url) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    console.log("Processing file:", {
      id: mediaFile.id,
      filename: mediaFile.filename,
      mimeType: mediaFile.mimeType,
      url: mediaFile.url,
    })

    // Update status to processing
    await payload.update({
      collection: "documents",
      id: id,
      data: {
        status: "processing",
        processing_progress: 10,
      },
    })

    // Fetch the file
    const fileUrl = mediaFile.url.startsWith("http") 
      ? mediaFile.url 
      : `${process.env.NEXT_PUBLIC_SERVER_URL}${mediaFile.url}`
    
    console.log("Fetching file from URL:", fileUrl)
    
    const fileResponse = await fetch(fileUrl)
    console.log("File fetch response status:", fileResponse.status)
    
    if (!fileResponse.ok) {
      const errorText = await fileResponse.text()
      console.error("Failed to fetch file:", {
        status: fileResponse.status,
        statusText: fileResponse.statusText,
        error: errorText.substring(0, 200)
      })
      throw new Error(`Failed to fetch file: ${fileResponse.status} ${fileResponse.statusText}`)
    }

    const fileBuffer = Buffer.from(await fileResponse.arrayBuffer())
    let extractedText = ""

    // Extract text based on file type
    const mimeType = mediaFile.mimeType || ""

    try {
      if (mimeType === "application/pdf") {
        // PDF extraction
        console.log("Extracting text from PDF...")
        const pdfData = await pdf(fileBuffer)
        extractedText = pdfData.text
        console.log(`Extracted ${extractedText.length} characters from PDF`)

      } else if (
        mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        mimeType === "application/msword"
      ) {
        // Word document extraction
        console.log("Extracting text from Word document...")
        const result = await mammoth.extractRawText({ buffer: fileBuffer })
        extractedText = result.value
        console.log(`Extracted ${extractedText.length} characters from Word document`)

      } else if (mimeType.startsWith("text/")) {
        // Plain text files
        console.log("Reading plain text file...")
        extractedText = fileBuffer.toString("utf-8")
        console.log(`Read ${extractedText.length} characters from text file`)

      } else if (mimeType.startsWith("image/")) {
        // For images, you would need OCR (Tesseract.js or external API)
        console.log("Image file detected - OCR not implemented")
        extractedText = "[Image content - OCR not yet implemented. Please use text-based documents for best results.]"

      } else {
        console.log("Unsupported file type:", mimeType)
        extractedText = `[Unsupported file type: ${mimeType}. Please upload PDF, Word, or text documents.]`
      }

      // Update progress
      await payload.update({
        collection: "documents",
        id: id,
        data: {
          processing_progress: 50,
        },
      })

      // Clean up the extracted text
      extractedText = extractedText
        .replace(/\s+/g, " ") // Replace multiple spaces with single space
        .replace(/\n{3,}/g, "\n\n") // Replace multiple newlines with max 2
        .trim()

      console.log("Final extracted text length:", extractedText.length)
      console.log("Text preview:", extractedText.substring(0, 200))

      // Save the extracted text to the notes field
      await payload.update({
        collection: "documents",
        id: id,
        data: {
          notes: extractedText,
          status: "ready",
          processing_progress: 100,
        },
      })

      return NextResponse.json({
        success: true,
        message: "Text extracted successfully",
        textLength: extractedText.length,
        preview: extractedText.substring(0, 200),
      })

    } catch (extractError) {
      console.error("Text extraction error:", extractError)
      
      // Update status to failed
      await payload.update({
        collection: "documents",
        id: id,
        data: {
          status: "failed",
          processing_progress: 0,
        },
      })

      throw extractError
    }

  } catch (error) {
    console.error("Document processing error:", error)
    return NextResponse.json(
      { error: "Failed to process document" },
      { status: 500 }
    )
  }
}