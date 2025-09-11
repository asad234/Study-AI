// Shared invitation store - in a real app, this would be a database
export interface Invitation {
  id: string
  email: string
  firstName: string
  lastName: string
  status: 'pending' | 'accepted' | 'declined' | 'expired'
  dateSent: string
  token: string
}

// In-memory store (replace with database in production)
const invitations: Invitation[] = []

export const invitationStore = {
  // Get all invitations
  getAll(): Invitation[] {
    return [...invitations]
  },

  // Add a new invitation
  add(invitation: Invitation): Invitation {
    invitations.push(invitation)
    return invitation
  },

  // Find invitation by token
  findByToken(token: string): Invitation | undefined {
    return invitations.find((inv) => inv.token === token)
  },

  // Update invitation status
  updateStatus(token: string, status: Invitation['status']): Invitation | null {
    const invitation = invitations.find((inv) => inv.token === token)
    if (invitation) {
      invitation.status = status
      return invitation
    }
    return null
  },

  // Get invitation by ID
  findById(id: string): Invitation | undefined {
    return invitations.find((inv) => inv.id === id)
  },
}
