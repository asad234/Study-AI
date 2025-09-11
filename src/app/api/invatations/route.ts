import { type NextRequest, NextResponse } from 'next/server'
import { invitationStore, type Invitation } from '@/lib/invitation-store'

interface InvitationRequest {
  email: string
  firstName: string
  lastName: string
  token: string
}

export async function POST(request: NextRequest) {
  try {
    const body: InvitationRequest = await request.json()

    // Validate required fields
    if (!body.email || !body.firstName || !body.token) {
      return NextResponse.json(
        { error: 'Missing required fields: email, firstName, token' },
        { status: 400 },
      )
    }

    // Create new invitation
    const newInvitation: Invitation = {
      id: Math.random().toString(36).substr(2, 9),
      email: body.email,
      firstName: body.firstName,
      lastName: body.lastName || '',
      status: 'pending',
      dateSent: new Date().toISOString(),
      token: body.token,
    }

    // Store invitation using shared store
    const savedInvitation = invitationStore.add(newInvitation)

    return NextResponse.json(savedInvitation, { status: 201 })
  } catch (error) {
    console.error('Error creating invitation:', error)
    return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const invitations = invitationStore.getAll()
    return NextResponse.json(invitations)
  } catch (error) {
    console.error('Error fetching invitations:', error)
    return NextResponse.json({ error: 'Failed to fetch invitations' }, { status: 500 })
  }
}
