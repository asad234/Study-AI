// app/api/submit-feature-request/route.ts
import { NextRequest, NextResponse } from 'next/server'

interface FormData {
  featureName: string
  featureDescription: string
  experienceRating?: string
  contactInfo?: string
}

export async function POST(req: NextRequest) {
  try {
    const body: FormData = await req.json()

    const { featureName, featureDescription, experienceRating, contactInfo } = body

    if (!featureName || !featureDescription) {
      return NextResponse.json(
        { message: 'Feature name and description are required' },
        { status: 400 },
      )
    }

    const CLICKUP_API_TOKEN = process.env.CLICKUP_API_TOKEN
    const CLICKUP_LIST_ID = process.env.CLICKUP_LIST_ID

    if (!CLICKUP_API_TOKEN || !CLICKUP_LIST_ID) {
      return NextResponse.json(
        { message: 'Server configuration error: Missing ClickUp API credentials.' },
        { status: 500 },
      )
    }

    const taskData = {
      name: featureName,
      description: [
        `Feature Description: ${featureDescription}`,
        `Experience Rating: ${experienceRating || 'Not provided'}`,
        `Contact Info: ${contactInfo || 'Not provided'}`,
        `Submitted: ${new Date().toISOString()}`,
      ].join('\n'),
      priority: 3, // Normal
      tags: ['feature-request', 'user-submission'],
      // Optional: remove "status" unless your ClickUp config explicitly requires it
    }

    const response = await fetch(`https://api.clickup.com/api/v2/list/${CLICKUP_LIST_ID}/task`, {
      method: 'POST',
      headers: {
        Authorization: CLICKUP_API_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(taskData),
    })

    const responseText = await response.text()

    if (!response.ok) {
      return NextResponse.json(
        {
          message: 'Failed to create task in ClickUp',
          error: responseText,
        },
        { status: response.status },
      )
    }

    const result = JSON.parse(responseText)

    return NextResponse.json({
      message: 'Feature request submitted successfully',
      taskId: result.id,
    })
  } catch (error) {
    console.error('Error in API handler:', error)
    return NextResponse.json(
      {
        message: 'Internal Server Error',
        error:
          process.env.NODE_ENV === 'development' ? (error as Error).message : 'An error occurred.',
      },
      { status: 500 },
    )
  }
}
