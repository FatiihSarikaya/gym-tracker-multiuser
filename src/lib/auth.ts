import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import dbConnect from '@/lib/db'
import User from '@/models/User'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log('Missing credentials')
          return null
        }

        try {
          console.log('Attempting to connect to database...')
          await dbConnect()
          console.log('Database connected successfully')
          
          console.log('Looking for user with email:', credentials.email)
          const user = await User.findOne({ email: credentials.email })
          console.log('User found:', user ? 'Yes' : 'No')
          
          if (!user || !user.isActive) {
            console.log('User not found or inactive')
            return null
          }

          console.log('Comparing passwords...')
          const isPasswordValid = await bcrypt.compare(credentials.password, user.password)
          console.log('Password valid:', isPasswordValid)
          
          if (!isPasswordValid) {
            console.log('Invalid password')
            return null
          }

          const userReturn = {
            id: user.id.toString(),
            email: user.email,
            name: user.name,
            businessName: user.businessName,
            businessType: user.businessType,
            role: user.role
          }
          console.log('Returning user:', userReturn)
          
          return userReturn
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.businessName = user.businessName
        token.businessType = user.businessType
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.businessName = token.businessName as string
        session.user.businessType = token.businessType as string
        session.user.role = token.role as string
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/signin'
  },
  secret: process.env.NEXTAUTH_SECRET,
}
