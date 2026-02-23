import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all routes except static assets:
     * - _next/static, _next/image
     * - favicon.ico, logo.png
     * - Image/font/video files
     */
    '/((?!_next/static|_next/image|favicon\\.ico|logo\\.png|gallery/.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp4|woff|woff2|ttf)$).*)',
  ],
}
