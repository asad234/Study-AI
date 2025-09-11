export function generateToken(): string {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15) +
    Date.now().toString(36)
  )
}

export function generateMagicLink(token: string): string {
  //  use your production domain for invitations
  const baseUrl = 'https://verocv.se'

  // Redirect to landing page with invitation token
  return `${baseUrl}/?invitation=${token}`
}
