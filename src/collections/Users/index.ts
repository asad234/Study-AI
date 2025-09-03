import type { CollectionConfig } from 'payload'
import { authenticated } from '../../access/authenticated'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    // Configure to allow both OAuth and credentials
    //disableLocalStrategy: false, // Keep local strategy enabled
    maxLoginAttempts: 5,
    lockTime: 600 * 1000, // 10 minutes
    // Add this to handle OAuth users without passwords
    verify: false, // Disable email verification for now
  },
  access: {
    admin: () => true,
    create: () => true,
    delete: () => true,
    read: () => true,
    update: () => true,
  },
  admin: {
    defaultColumns: ['name', 'email', 'roles', 'authType', 'onboardingCompleted'],
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'roles',
      type: 'select',
      hasMany: false,
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Client', value: 'client' },
      ],
      defaultValue: 'client',
      required: true,
    },
    {
      name: 'authType',
      type: 'select',
      options: [
        { label: 'Email/Password', value: 'credentials' },
        { label: 'Google OAuth', value: 'google' },
        { label: 'LinkedIn OAuth', value: 'linkedin' },
        { label: 'GitHub OAuth', value: 'github' },
      ],
      defaultValue: 'credentials',
      required: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'hasPassword',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        hidden: true, // Hide from admin UI
      },
    },
    {
      name: 'onboardingCompleted',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Whether the user has completed the onboarding process',
      },
    },
  ],
  timestamps: true,
  hooks: {
    beforeValidate: [
      ({ data, operation }) => {
        // Ensure data exists before proceeding
        if (!data) {
          return data
        }

        // For OAuth users, mark as not having password
        if (data.authType && data.authType !== 'credentials') {
          data.hasPassword = false
        } else {
          // For credentials users, mark as having password
          data.hasPassword = true
        }

        // Ensure authType is set - only set if it's not already defined
        if (!data.authType) {
          data.authType = 'credentials'
        }

        return data
      },
    ],
    beforeChange: [
      ({ data, operation, req }) => {
        // For OAuth users creating accounts
        if (operation === 'create' && data?.authType !== 'credentials') {
          // Just mark that they don't have a user-set password
          data.hasPassword = false
          // The password should already be provided by the signIn callback
          // No need to generate it here since it's handled in authOptions
        }
        return data
      },
    ],
    afterChange: [
      async ({ doc, req, operation }) => {
        if (operation === 'create') {
          const { name, email, id } = doc

          if (!name || typeof name !== 'string') {
            console.error('❌ User name is missing or invalid:', { name, email, id })
            return
          }

          if (!email || typeof email !== 'string') {
            console.error('❌ User email is missing or invalid:', { name, email, id })
            return
          }

          const nameParts = name.split(' ')
          const firstName = nameParts[0] || ''
          const lastName = nameParts.slice(1).join(' ') || ''

          console.log(
            '🔄 User created hook triggered for:',
            email,
            '- Creating personal information...',
          )

          setTimeout(async () => {
            try {
              await req.payload.create({
                collection: 'personal-information',
                data: {
                  user: id,
                  firstName,
                  lastName,
                  recoveryEmail: email,
                },
              })
              console.log('✅ Personal information created for user:', id)
            } catch (error) {
              console.error('❌ Deferred creation of Personal Information failed:', error)
            }
          }, 0)
        }
      },
    ],
  },
}
