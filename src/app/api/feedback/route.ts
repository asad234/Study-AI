/**import { type NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { helpfulness, improvement } = body

    // Validate required field
    if (!helpfulness) {
      return NextResponse.json({ error: "Helpfulness is required" }, { status: 400 })
    }

    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY environment variable is not set")
      return NextResponse.json({ error: "Email service not configured" }, { status: 500 })
    }

    // Generate a unique feedback ID
    const feedbackId = `FEEDBACK-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)
      .toUpperCase()}`

    // Map helpfulness to color + emoji for nicer emails
    const getHelpfulnessInfo = (value: string) => {
      switch (value) {
        case "Very helpful":
          return { color: "#10b981", emoji: "🌟" }
        case "Helpful":
          return { color: "#3b82f6", emoji: "👍" }
        case "Neutral":
          return { color: "#f59e0b", emoji: "😐" }
        case "Not helpful":
          return { color: "#ef4444", emoji: "😞" }
        default:
          return { color: "#6b7280", emoji: "❓" }
      }
    }

    const info = getHelpfulnessInfo(helpfulness)

    // Send email with Resend
    const { data, error } = await resend.emails.send({
      from: "Feedback System <noreply@verocv.se>",
      to: ["info@verocv.se"],
      subject: `${info.emoji} Student Feedback: ${helpfulness} [${feedbackId}]`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: ${info.color}; border-bottom: 2px solid ${info.color}; padding-bottom: 10px;">
            ${info.emoji} New Student Feedback
          </h2>

          <div style="margin: 20px 0;">
            <h3 style="color: #333; margin-bottom: 10px;">📊 Helpfulness</h3>
            <div style="background-color: #f8fafc; border-left: 4px solid ${info.color}; padding: 15px;">
              <strong style="color: ${info.color};">${helpfulness}</strong>
            </div>
          </div>

          ${
            improvement
              ? `
          <div style="margin: 20px 0;">
            <h3 style="color: #333; margin-bottom: 10px;">💡 Suggested Improvement</h3>
            <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 15px;">
              ${improvement.replace(/\n/g, "<br>")}
            </div>
          </div>
          `
              : ""
          }

          <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 13px;">
            <p>This feedback was submitted from your Study AI dashboard.</p>
            <p><strong>Feedback ID:</strong> ${feedbackId}</p>
            <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
          </div>
        </div>
      `,
    })

    if (error) {
      console.error("Resend error:", error)
      return NextResponse.json(
        {
          error: "Failed to send feedback",
          details:
            process.env.NODE_ENV === "development" ? error.message : "Email service error",
        },
        { status: 500 },
      )
    }

    console.log("Feedback sent successfully:", data)
    return NextResponse.json(
      {
        message: "Feedback submitted successfully",
        feedbackId,
        id: data?.id,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : "Unknown error"
            : "Server error",
      },
      { status: 500 },
    )
  }
}
**/