// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Paths that anyone can hit without auth
const PUBLIC_PATHS = [
    '/auth/login',
    '/auth/reset-password'
]

// Files & Next.js internals to skip
const PUBLIC_FILE = /\.(.*)$/

function getRoleFromCookiesOrToken(req: NextRequest): string | undefined {
    const roleCookie = req.cookies.get('role')?.value
    return roleCookie;
}


export function middleware(req: NextRequest) {
    const { nextUrl, cookies } = req
    const { pathname } = nextUrl

    // 1. Allow public files & Next internals
    if (
        PUBLIC_FILE.test(pathname) ||
        pathname.startsWith('/_next/') ||
        pathname === '/favicon.ico'
    ) {
        return NextResponse.next()
    }

    // 2. Allow our public auth routes
    if (PUBLIC_PATHS.includes(pathname)) {
        return NextResponse.next()
    }

    // 3. For everything else, check for the token cookie
    const token = cookies.get('token')?.value
    if (!token) {
        // Not logged in → redirect to login
        const loginUrl = nextUrl.clone()
        loginUrl.pathname = '/auth/login'
        return NextResponse.redirect(loginUrl)
    } else if (pathname.startsWith('/user-management') || pathname.startsWith('/monitor')) {
        const role = getRoleFromCookiesOrToken(req)
        if (role !== 'Admin') {
            const url = nextUrl.clone()
            url.pathname = '/404'
            // Use rewrite to avoid a visible redirect/flash
            return NextResponse.rewrite(url)
        }
    }

    // 4. Token exists → allow
    return NextResponse.next()
}

export const config = {
    // Run this middleware on all paths EXCEPT /api, /_next, static files, etc.
    matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
}
