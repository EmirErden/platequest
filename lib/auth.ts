import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type CurrentUser = {
    id: string;
    email: string;
    username: string | null;
};

// Server Component'lerde oturumdaki kullanıcıyı okur. `cache` sayesinde aynı
// istek içinde (layout + page) Supabase'e tekrar gidilmez. `getClaims` JWT'yi
// projenin ES256 anahtarıyla yerelde doğrular; Auth sunucusuna istek atmaz.
// Oturum iptalinin anında fark edilmesi gereken yazma işlemlerinde (API
// route'ları) bunun yerine `auth.getUser()` kullanılıyor.
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getClaims();
    const claims = data?.claims;

    if (error || !claims?.sub) {
        return null;
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", claims.sub)
        .maybeSingle();

    const metadataUsername = claims.user_metadata?.username;

    return {
        id: claims.sub,
        email: claims.email ?? "",
        username:
            profile?.username ??
            (typeof metadataUsername === "string" ? metadataUsername : null),
    };
});

// Giriş zorunlu sayfalarda kullan: kullanıcı yoksa /login'e yönlendirir.
export async function requireUser(): Promise<CurrentUser> {
    const user = await getCurrentUser();

    if (!user) {
        redirect("/login");
    }

    return user;
}
