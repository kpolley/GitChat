export { auth as middleware } from './auth'

export const config = {
  matcher: ['/((?!api|share|_next/static|_next/image|favicon.ico).*)']
}
