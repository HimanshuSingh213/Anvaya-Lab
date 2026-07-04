import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
    const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
        secureCookie: process.env.NODE_ENV === "production"
    });
    const { pathname } = request.nextUrl;

    const isAuthPage = pathname.startsWith("/sign-in")
        || pathname.startsWith("/sign-up")
        || pathname.startsWith("/verify");

    const hasError = request.nextUrl.searchParams.has("error");

    if (token && isAuthPage && !hasError) {
        return NextResponse.redirect(new URL("/my-workspace", request.url));
    }

    const isProtectedPage = pathname.startsWith("/my-workspace") || pathname.startsWith("/settings");

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
        "/my-workspace/:path*",
        "/settings/:path*",
    ]
};
