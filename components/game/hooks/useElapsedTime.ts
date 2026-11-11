"use client";

import { useEffect, useState } from "react";

// Oyun başlangıcından beri geçen süre (cezasız), saniyede bir güncellenir.
// Sayaç sadece oyun sürerken gösteriliyor; oyun bitince (`isStopped`) güncelleme
// durur. Bitiş ekranındaki resmî süre sunucudan gelen `GameResult`'tan okunur.
export function useElapsedTime(
    startedAt: string | null,
    isStopped: boolean
): number {
    const [elapsedTimeMs, setElapsedTimeMs] = useState(0);

    useEffect(() => {
        if (!startedAt || isStopped) {
            return;
        }

        // Saymak yerine her seferinde "şu an - başlangıç" hesaplanır: sayfa
        // yenilense de, arka plandaki sekmede interval gecikse de süre doğru kalır.
        const startedAtMs = Date.parse(startedAt);
        const updateElapsedTime = () => {
            setElapsedTimeMs(Math.max(0, Date.now() - startedAtMs));
        };

        // İlk değer 1 sn beklemeden gösterilsin; effect gövdesinde senkron
        // setState olmasın diye bir sonraki tick'e bırakılıyor.
        const initialUpdate = window.setTimeout(updateElapsedTime, 0);
        const interval = window.setInterval(updateElapsedTime, 1_000);

        return () => {
            window.clearTimeout(initialUpdate);
            window.clearInterval(interval);
        };
    }, [isStopped, startedAt]);

    return elapsedTimeMs;
}
