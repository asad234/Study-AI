import type { DefaultSession } from 'next-auth'

// Extending the User type
declare module 'next-auth' {
  interface User {
    id: string
    email: string
    name?: string | null
    roles?: string[]
    token?: string
    isNewUser?: boolean
  }

  interface Session extends DefaultSession {
    user: {
      id: string
      email: string
      name?: string | null
      roles?: string[]
      accessToken?: string
      isNewUser?: boolean
    } & DefaultSession['user']
  }
}

// Extending the JWT type
declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    email?: string
    name?: string
    roles?: string[]
    accessToken?: string
    isNewUser?: boolean
  }
}
