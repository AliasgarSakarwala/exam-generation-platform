import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

async function proxyHandler(
    req: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    const parsedParams = await params;
    const path = parsedParams.path.join('/')
    const targetUrl = path === 'api' ? `${process.env.NEXT_PUBLIC_LARAVEL_API_URL}/api` : `${process.env.NEXT_PUBLIC_LARAVEL_API_URL}/api/${path}`
    const isAuthLogin = path === 'auth/login'
    const isAuthRegister = path === 'auth/register'
    const isAuthLogout = path === 'auth/logout'
    const isDeleteAccount = req.method === 'DELETE' && /^user\/\d+$/.test(path);
    const selfDelete = req.nextUrl.searchParams.get('selfDelete') === 'true';
    const hasBody = !['GET', 'HEAD', 'DELETE', 'OPTIONS'].includes(req.method) && !isAuthLogout;

    // Build headers, forwarding existing token if present
    const token = req.cookies.get('token')?.value
    let jsonBody: any;
    if (hasBody) {
        jsonBody = await req.json();
    }

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }

    // Proxy the request body/query
    const url = new URL(targetUrl + req.nextUrl.search)
    console.log(`My Target URL: ${url.toString()}`);
    const resFromLaravel = await fetch(url.toString(), {
        method: req.method,
        headers,
        ...(hasBody
            ? { body: JSON.stringify(jsonBody), duplex: 'half' }
            : {}),
    })
    const textBody = await resFromLaravel.text()

    // Handle login/register: set HttpOnly cookie
    if (isAuthLogin || isAuthRegister) {
        console.log(`My Res From Laravel: ${resFromLaravel.status}`);
        if (!resFromLaravel.ok) {
            return NextResponse.json(JSON.parse(textBody), { status: resFromLaravel.status })
        }
        const { token: newToken, user } = JSON.parse(textBody)
        const res = NextResponse.json({ user }, { status: resFromLaravel.status })
        if (isAuthLogin) {
            res.cookies.set({
                name: 'token',
                value: newToken,
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
                maxAge: 60 * 60 * 24 * 7,
            })
            res.cookies.set({
                name: 'role',
                value: user.role,
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
                maxAge: 60 * 60 * 24 * 7,
            })
        } else {
            if (isAuthRegister) {
                if (user.status === "Verified") {
                    res.cookies.set({
                        name: 'token',
                        value: newToken,
                        httpOnly: true,
                        secure: process.env.NODE_ENV === 'production',
                        sameSite: 'lax',
                        path: '/',
                        maxAge: 60 * 60 * 24 * 7,
                    })
                    res.cookies.set({
                        name: 'role',
                        value: user.role,
                        httpOnly: true,
                        secure: process.env.NODE_ENV === 'production',
                        sameSite: 'lax',
                        path: '/',
                        maxAge: 60 * 60 * 24 * 7,
                    })
                }
            }
        }
        return res
    }

    // Handle logout: clear cookie
    if (isAuthLogout) {
        const res = new NextResponse(textBody, { status: resFromLaravel.status })
        console.log("PARAMS in isDeleteAccount: ", parsedParams);
        res.cookies.delete({ name: 'token', path: '/' })
        res.cookies.delete({ name: 'role', path: '/' })
        return res;
    }

    // Handle delete account: clear cookie if self delete
    if (isDeleteAccount) {
        const res = new NextResponse(textBody, { status: resFromLaravel.status })
        console.log("PARAMS in isDeleteAccount: ", parsedParams);
        if (selfDelete) {
            res.cookies.delete({ name: 'token', path: '/' })
            res.cookies.delete({ name: 'role', path: '/' })
        }
        return res;
    }

    // Generic proxy for everything else
    const proxied = new NextResponse(textBody, { status: resFromLaravel.status })
    const contentType = resFromLaravel.headers.get('content-type')
    if (contentType) proxied.headers.set('content-type', contentType)
    return proxied
}

// Now re-export for each HTTP verb you need:
export const GET = proxyHandler
export const POST = proxyHandler
export const PUT = proxyHandler
export const PATCH = proxyHandler
export const DELETE = proxyHandler
export const OPTIONS = proxyHandler

export const config = {
    matcher: ['/api/proxy/:path*'],
}
