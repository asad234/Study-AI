import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authoption"
import { getPayload } from "payload"
import config from "@payload-config"
import OpenAI from "openai"
import { zodResponseFormat } from "openai/helpers/zod"
import { z } from "zod"
import { ExamGenerationSchema } from "@/lib/exam-schema"

export const runtime = "nodejs"
export const maxDuration = 60

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Zod schema for OpenAI structured output
const ExamResponseSchema = z.object({
  title: z.string(),
  description: z.string(),
  questions: z.array(
    z.object({
      id: z.string(),
      type: z.enum(["multiple-choice", "true-false", "written", "multiple-select"]),
      question: z.string(),
      options: z.array(z.string()).nullable(),
      correctAnswer: z.union([z.number(), z.array(z.number()), z.string()]),
      explanation: z.string(),
      category: z.string(),
      difficulty: z.enum(["easy", "medium", "hard"]),
      marks: z.number(),
    }),
  ),
})

export async function POST(request: NextRequest) {
  const requestId = Date.now()
  console.time(`exam-generation-${requestId}`)

  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = ExamGenerationSchema.parse(body)

    // DEBUG: Log what question types were requested
    console.log('🎯 Requested question types:', validatedData.questionTypes)
    console.log('📊 Total questions:', validatedData.questionCount)
    console.log('📄 Documents:', validatedData.documentIds.length)

    if (!validatedData.questionTypes || validatedData.questionTypes.length === 0) {
      return NextResponse.json(
        { error: "No question types selected. Please select at least one question type." },
        { status: 400 }
      )
    }

    // Ensure we have at least the requested question types available
    if (validatedData.questionCount < validatedData.questionTypes.length) {
      return NextResponse.json(
        { 
          error: `Not enough questions requested for the selected types. You selected ${validatedData.questionTypes.length} question types but only requested ${validatedData.questionCount} questions.`,
          solution: `Please increase the number of questions to at least ${validatedData.questionTypes.length}, or reduce the number of question types.`
        },
        { status: 400 }
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 })
    }

    const payload = await getPayload({ config })

    // Get user profile
    const userProfiles = await payload.find({
      collection: "profiles",
      where: { email: { equals: session.user.email } },
      limit: 1,
    })

    if (!userProfiles.docs.length) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    const userProfile = userProfiles.docs[0]

    // Track results like flashcards do
    const allGeneratedQuestions: any[] = []
    const processedDocuments: string[] = []
    const failedDocuments: string[] = []

    console.log(`Processing ${validatedData.documentIds.length} documents for exam generation`)

    // Calculate questions per document
    const questionsPerDoc = Math.ceil(validatedData.questionCount / validatedData.documentIds.length)

    // Calculate distribution of question types
    const typeDistribution = calculateQuestionTypeDistribution(
      questionsPerDoc,
      validatedData.questionTypes
    )

    // Process each document individually
    for (const documentId of validatedData.documentIds) {
      try {
        console.log(`Processing document: ${documentId}`)

        const document = await payload.findByID({
          collection: "documents",
          id: Number(documentId),
        })

        if (!document) {
          console.error(`Document ${documentId} not found`)
          failedDocuments.push(documentId)
          continue
        }

        // Verify ownership
        const documentUserId =
          typeof document.user === "object" && document.user !== null ? document.user.id : document.user
        if (documentUserId !== userProfile.id) {
          console.error(`Document ${documentId} access denied`)
          failedDocuments.push(documentId)
          continue
        }

        // Build document content
        const documentContent = `Document Title: ${document.title || document.file_name || "Untitled"}
File Type: ${document.file_type || "Unknown"}
Subject Area: ${document.subject || "General"}
File Size: ${document.file_size ? `${Math.round(document.file_size / 1024)} KB` : "Unknown"}

This document contains educational material that needs to be analyzed and converted into effective exam questions.`

        console.log(`Generating exam questions for document: ${document.title || document.file_name}`)

        // Build detailed question type instructions
        const questionTypeInstructions = buildQuestionTypeInstructions(
          validatedData.questionTypes,
          typeDistribution
        )

        // Generate questions using OpenAI with EXPLICIT type enforcement
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini-2024-07-18",
          messages: [
            {
              role: "system",
              content: `You are an expert exam creator. You MUST generate questions in MULTIPLE FORMATS as specified.

⚠️ CRITICAL REQUIREMENT: Generate questions in THE EXACT TYPES AND QUANTITIES specified below. This is NOT optional.

REQUIRED QUESTION TYPE DISTRIBUTION:
${typeDistribution.map(dist => `✓ Generate EXACTLY ${dist.count} "${dist.type}" questions`).join('\n')}

TOTAL QUESTIONS REQUIRED: ${questionsPerDoc}

📋 QUESTION TYPE SPECIFICATIONS:

1️⃣ MULTIPLE-CHOICE FORMAT:
{
  "type": "multiple-choice",
  "question": "Your question here?",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": 2,  // Index of correct option (0-3)
  "explanation": "Why option C is correct..."
}

2️⃣ TRUE-FALSE FORMAT:
{
  "type": "true-false",
  "question": "Statement to evaluate?",
  "options": ["True", "False"],
  "correctAnswer": 0,  // 0 for False, 1 for True
  "explanation": "Why this is true/false..."
}

3️⃣ WRITTEN ANSWER FORMAT:
{
  "type": "written",
  "question": "Open-ended question?",
  "options": null,
  "correctAnswer": "A comprehensive sample answer that demonstrates the expected response...",
  "explanation": "Key points that should be covered..."
}

4️⃣ MULTIPLE-SELECT FORMAT:
{
  "type": "multiple-select",
  "question": "Select all that apply:",
  "options": ["Option A", "Option B", "Option C", "Option D", "Option E"],
  "correctAnswer": [0, 2, 4],  // Array of correct indices (must have 2+ answers)
  "explanation": "Why these options are correct..."
}

DIFFICULTY & MARKS:
- Easy (30%): 2-3 marks - Basic recall and comprehension
- Medium (50%): 4-5 marks - Application and analysis
- Hard (20%): 6-8 marks - Synthesis and evaluation

VALIDATION CHECKLIST:
✓ Did you generate the EXACT number of each question type?
✓ Are "type" values exactly: "multiple-choice", "true-false", "written", or "multiple-select"?
✓ Do multiple-choice have 4 options and correctAnswer as number?
✓ Do true-false have 2 options and correctAnswer as 0 or 1?
✓ Do written questions have options: null and correctAnswer as string?
✓ Do multiple-select have correctAnswer as array with 2+ numbers?`,
            },
            {
              role: "user",
              content: `📄 Document Information:
${documentContent}

🎯 YOUR TASK:
Generate EXACTLY ${questionsPerDoc} questions following this MANDATORY distribution:

${typeDistribution.map(dist => `▶ ${dist.count} ${dist.type.toUpperCase().replace('-', ' ')} question${dist.count > 1 ? 's' : ''}`).join('\n')}

Difficulty mix: ${validatedData.difficulties.join(", ")}

⚠️ IMPORTANT: 
- You MUST create the exact mix of question types specified above
- Do NOT generate only multiple-choice questions
- Each question type has a different format - follow it precisely
- Ensure variety in topics and cognitive levels

Start generating now, following the exact distribution!`,
            },
          ],
          response_format: zodResponseFormat(ExamResponseSchema, "exam"),
          temperature: 0.5,
          max_tokens: 5000,
        })

        const aiResponseContent = completion.choices[0]?.message.content

        if (!aiResponseContent) {
          console.error(`No AI response for document ${documentId}`)
          failedDocuments.push(documentId)
          continue
        }

        let aiResponse
        try {
          aiResponse = JSON.parse(aiResponseContent)
        } catch (parseError) {
          console.error(`Failed to parse AI response for document ${documentId}`)
          failedDocuments.push(documentId)
          continue
        }

        const parsed = ExamResponseSchema.safeParse(aiResponse)
        if (!parsed.success) {
          console.error(`Validation failed for document ${documentId}:`, parsed.error.issues)
          failedDocuments.push(documentId)
          continue
        }

        // DEBUG: Verify question type distribution
        const generatedTypes = parsed.data.questions.reduce((acc, q) => {
          acc[q.type] = (acc[q.type] || 0) + 1
          return acc
        }, {} as Record<string, number>)
        
        console.log(`📊 GENERATED TYPES for document ${documentId}:`, generatedTypes)
        console.log(`📋 EXPECTED TYPES:`, typeDistribution)
        
        // Warn if distribution doesn't match
        const mismatched = typeDistribution.some(dist => generatedTypes[dist.type] !== dist.count)
        if (mismatched) {
          console.warn(`⚠️ WARNING: AI did not follow type distribution for document ${documentId}`)
          console.warn(`Expected:`, typeDistribution)
          console.warn(`Got:`, generatedTypes)
        }

        // Add questions to collection
        allGeneratedQuestions.push(...parsed.data.questions)
        processedDocuments.push(documentId)

        console.log(
          `Successfully generated ${parsed.data.questions.length} questions for document ${documentId}`,
        )
      } catch (docError) {
        console.error(`Error processing document ${documentId}:`, docError)
        failedDocuments.push(documentId)
      }
    }

    console.timeEnd(`exam-generation-${requestId}`)

    // Check if we generated any questions
    if (allGeneratedQuestions.length === 0) {
      return NextResponse.json(
        {
          error: "Failed to generate exam questions from any documents",
          solution: "Please ensure your documents contain readable educational content",
          processedDocuments,
          failedDocuments,
        },
        { status: 400 },
      )
    }

    // Shuffle and limit questions to requested count
    const shuffledQuestions = allGeneratedQuestions
      .sort(() => Math.random() - 0.5)
      .slice(0, validatedData.questionCount)

    // Log final question type distribution
    const finalTypes = shuffledQuestions.reduce((acc, q) => {
      acc[q.type] = (acc[q.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    console.log('Final question type distribution:', finalTypes)

    // Calculate total marks
    const totalMarks = shuffledQuestions.reduce((sum: number, q) => sum + q.marks, 0)

    // Get document titles for metadata
    const documents = await payload.find({
      collection: "documents",
      where: {
        id: { in: processedDocuments.map((id) => Number(id)) },
      },
    })

    const documentTitles = documents.docs.map((doc) => doc.title || doc.file_name || "Untitled").join(", ")

    // Create the exam
    const exam = await payload.create({
      collection: "exams",
      data: {
        user: userProfile.id,
        title: `Exam from ${processedDocuments.length} document${processedDocuments.length > 1 ? "s" : ""}`,
        description: `Generated exam based on: ${documentTitles}`,
        subject: documents.docs[0]?.subject || "General",
        duration: Math.round(validatedData.duration / 60),
        total_marks: totalMarks,
        visibility: "private",
      },
    })

    // Create exam questions
    const createdQuestions = []
    for (const question of shuffledQuestions) {
      try {
        const examQuestion = await payload.create({
          collection: "exam_questions",
          data: {
            exam: exam.id,
            question: question.question,
            options: question.options || null,
            correct_answer: Array.isArray(question.correctAnswer)
              ? JSON.stringify(question.correctAnswer)
              : String(question.correctAnswer),
            marks: question.marks,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        })

        createdQuestions.push({
          ...question,
          id: String(examQuestion.id),
        })
      } catch (createError) {
        console.error(`Error creating exam question:`, createError)
      }
    }

    console.log(`Successfully created exam with ${createdQuestions.length} questions`)

    return NextResponse.json({
      success: true,
      exam: {
        id: exam.id,
        title: exam.title,
        description: exam.description,
        subject: exam.subject,
        duration: exam.duration * 60,
        totalMarks,
        questions: createdQuestions,
      },
      metadata: {
        totalGenerated: createdQuestions.length,
        processedDocuments: processedDocuments.length,
        failedDocuments: failedDocuments.length,
        documentIds: processedDocuments,
        documentTitles,
        questionTypeDistribution: finalTypes,
      },
      message: `Successfully generated ${createdQuestions.length} exam questions from ${processedDocuments.length} document(s)`,
    })
  } catch (error) {
    console.error("Exam generation error:", error)

    let status = 500
    let errorMessage = "Failed to generate exam"
    let solution = "Please try again later or contact support if the problem persists"
    let details = null

    if (error instanceof OpenAI.APIError) {
      status = error.status || 502
      errorMessage = "AI exam generation service is currently unavailable"
      solution = "Please try again in a few minutes. If the problem continues, check our status page."
      details = {
        code: error.code || "openai_api_error",
        message: error.message,
      }
    } else if (error instanceof Error) {
      details = {
        message: error.message,
      }
    }

    console.timeEnd(`exam-generation-${requestId}`)
    return NextResponse.json(
      {
        error: errorMessage,
        solution,
        ...(details && { details }),
      },
      { status },
    )
  }
}

// Helper function to calculate question type distribution
function calculateQuestionTypeDistribution(
  totalQuestions: number,
  selectedTypes: string[]
): Array<{ type: string; count: number }> {
  const typeCount = selectedTypes.length
  const baseCount = Math.floor(totalQuestions / typeCount)
  const remainder = totalQuestions % typeCount

  const distribution = selectedTypes.map((type, index) => ({
    type,
    count: baseCount + (index < remainder ? 1 : 0),
  }))

  return distribution
}

// Helper function to build detailed question type instructions
function buildQuestionTypeInstructions(
  questionTypes: string[],
  distribution: Array<{ type: string; count: number }>
): string {
  const instructions: string[] = []

  questionTypes.forEach((type) => {
    const dist = distribution.find(d => d.type === type)
    const count = dist?.count || 0

    switch (type) {
      case "multiple-choice":
        instructions.push(`
MULTIPLE CHOICE (${count} questions):
- Provide EXACTLY 4 options in the "options" array
- Set "correctAnswer" as a NUMBER (0-3) indicating the correct option index
- Example: {"type": "multiple-choice", "options": ["A", "B", "C", "D"], "correctAnswer": 2}`)
        break
      
      case "true-false":
        instructions.push(`
TRUE/FALSE (${count} questions):
- Provide EXACTLY 2 options: ["True", "False"]
- Set "correctAnswer" as 0 for False or 1 for True
- Example: {"type": "true-false", "options": ["True", "False"], "correctAnswer": 1}`)
        break
      
      case "written":
        instructions.push(`
WRITTEN ANSWER (${count} questions):
- Set "options" to null
- Set "correctAnswer" as a STRING containing a sample/model answer
- Example: {"type": "written", "options": null, "correctAnswer": "The sample correct answer here..."}`)
        break
      
      case "multiple-select":
        instructions.push(`
MULTIPLE SELECT (${count} questions):
- Provide 4-6 options in the "options" array
- Set "correctAnswer" as an ARRAY of correct indices
- At least 2 correct answers required
- Example: {"type": "multiple-select", "options": ["A", "B", "C", "D"], "correctAnswer": [0, 2]}`)
        break
    }
  })

  return instructions.join('\n\n')
}