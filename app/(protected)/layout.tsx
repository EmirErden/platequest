import React from "react";

import { requireUser } from "@/lib/auth";

// Ek güvence: asıl kontrol her sayfada `requireUser()` ile yapılıyor (Next,
// layout'ların sayfa geçişlerinde yeniden çalışmadığı için yalnızca layout'a
// güvenmemeyi öneriyor). `getCurrentUser` cache'li olduğundan ek maliyeti yok.
export default async function ProtectedLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    await requireUser();

    return children;
}
