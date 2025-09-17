import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      businessName: string
      businessType: string
      role: string
    }
  }

  interface User {
    id: string
    email: string
    name: string
    businessName: string
    businessType: string
    role: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    businessName: string
    businessType: string
    role: string
  }
}
