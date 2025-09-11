import { type NextRequest, NextResponse } from 'next/server'
import { invitationStore } from '@/lib/invitation-store'

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    // Find the invitation by token
    const invitation = invitationStore.findByToken(token)

    if (!invitation) {
      return NextResponse.json({ error: 'Invalid or expired invitation token' }, { status: 404 })
    }

    // Check if already accepted
    if (invitation.status === 'accepted') {
      return NextResponse.json(
        { message: 'Invitation already accepted', invitation },
        { status: 200 },
      )
    }

    // Check if expired (24 hours)
    const invitationDate = new Date(invitation.dateSent)
    const now = new Date()
    const hoursDiff = (now.getTime() - invitationDate.getTime()) / (1000 * 60 * 60)

    if (hoursDiff > 24) {
      const updatedInvitation = invitationStore.updateStatus(token, 'expired')
      return NextResponse.json({ error: 'Invitation has expired' }, { status: 410 })
    }

    // Accept the invitation
    const updatedInvitation = invitationStore.updateStatus(token, 'accepted')

    if (!updatedInvitation) {
      return NextResponse.json({ error: 'Failed to update invitation' }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Invitation accepted successfully',
      invitation: updatedInvitation,
    })
  } catch (error) {
    console.error('Error accepting invitation:', error)
    return NextResponse.json({ error: 'Failed to accept invitation' }, { status: 500 })
  }
}
