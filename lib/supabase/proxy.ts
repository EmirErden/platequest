import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "@/types/database";

export async function updateSession(request: NextRequest) {
    let response = NextResponse.next({
        request,
    });

    const supabase = createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },

                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => {
                        request.cookies.set(name, value);
                    });

                    response = NextResponse.next({
                        request,
                    });

                    cookiesToSet.forEach(({ name, value, options }) => {
                        response.cookies.set(name, value, options);
                    });
                },
            },
        }
    );

    const { data } = await supabase.auth.getClaims();
    const isAuthenticated = Boolean(data?.claims?.sub);
    const { pathname } = request.nextUrl;

    // Girişli kullanıcı giriş/kayıt sayfasında olmamalı.
    if (isAuthenticated && AUTH_PAGES.includes(pathname)) {
        return redirectWithCookies(request, response, "/");
    }

    // Optimistik kontrol: girişsiz kullanıcıyı sayfa render edilmeden
    // /login'e gönder. Asıl kontrol sayfalardaki requireUser() (lib/auth.ts).
    if (!isAuthenticated && isProtectedPage(pathname)) {
        return redirectWithCookies(request, response, "/login");
    }

    return response;
}

const AUTH_PAGES = ["/login", "/register"];

// app/(protected) altındaki sayfalar. API route'ları burada değil: onlar
// yönlendirme yerine 401 döndürüyor.
const PROTECTED_PAGE_PREFIXES = ["/game", "/profile"];

function isProtectedPage(pathname: string) {
    return PROTECTED_PAGE_PREFIXES.some(
        (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    );
}

// getClaims oturumu yenilediyse yeni cookie'ler response'ta; yönlendirmede
// kaybolmasınlar diye kopyalanıyor.
function redirectWithCookies(
    request: NextRequest,
    response: NextResponse,
    path: string
) {
    const redirectResponse = NextResponse.redirect(new URL(path, request.url));

    response.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie);
    });

    return redirectResponse;
}
