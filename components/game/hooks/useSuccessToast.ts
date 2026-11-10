"use client";

import { useEffect, useState } from "react";

const TOAST_VISIBLE_MS = 4_000;
// Game.module.css'teki toastOut animasyonunun süresiyle aynı olmalı.
const TOAST_EXIT_MS = 300;

// İl tamamlanınca üstte çıkan başarı mesajı. Yeni mesaj gelince önceki
// mesajın zamanlayıcıları iptal edilir; böylece eski zamanlayıcı yeni mesajı
// erken kapatmaz. Bileşen kaldırılınca da zamanlayıcılar temizlenir.
export function useSuccessToast() {
    // Her gösterimde yeni nesne: aynı metin tekrar gelse de effect yeniden çalışır.
    const [toast, setToast] = useState<{ message: string } | null>(null);
    const [isToastLeaving, setIsToastLeaving] = useState(false);

    useEffect(() => {
        if (!toast) {
            return;
        }

        const leaveTimer = window.setTimeout(() => {
            setIsToastLeaving(true);
        }, TOAST_VISIBLE_MS);

        const removeTimer = window.setTimeout(() => {
            setToast(null);
            setIsToastLeaving(false);
        }, TOAST_VISIBLE_MS + TOAST_EXIT_MS);

        return () => {
            window.clearTimeout(leaveTimer);
            window.clearTimeout(removeTimer);
        };
    }, [toast]);

    function showToast(message: string) {
        setToast({ message });
        setIsToastLeaving(false);
    }

    function hideToast() {
        setToast(null);
        setIsToastLeaving(false);
    }

    return {
        toastMessage: toast?.message ?? "",
        isToastLeaving,
        showToast,
        hideToast,
    };
}
