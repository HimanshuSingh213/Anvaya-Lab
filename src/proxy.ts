import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const { pathname } = request.nextUrl;

    const isAuthPage = pathname.startsWith("/sign-in")
        || pathname.startsWith("/sign-up")
        || pathname.startsWith("/verify");

    if (token && isAuthPage) {
        return NextResponse.redirect(new URL("/workspace", request.url));
    }

    const isProtectedPage = pathname.startsWith("/workspace") || pathname.startsWith("/settings");

    if (!token && isProtectedPage) {
        return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/sign-in",
        "/sign-up",
        "/verify",
        "/workspace/:path*",
        "/settings/:path*",
    ]
};
