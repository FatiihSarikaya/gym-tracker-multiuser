import { withAuth } from 'next-auth/middleware'

export default withAuth(
  function middleware(req) {
    // Middleware mantığı burada yer alabilir
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Eğer auth sayfalarında isek token'a gerek yok
        if (req.nextUrl.pathname.startsWith('/auth/')) {
          return true
        }
        
        // Diğer tüm sayfalar için token gerekli
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (authentication routes)
     * - api/contact (public contact form)
     * - api/test-email (public email testing)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api/auth|api/contact|api/test-email|_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
