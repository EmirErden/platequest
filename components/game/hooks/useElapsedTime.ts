"use client";

import { useEffect, useState } from "react";

// Oyun başlangıcından beri geçen süre (cezasız). Oyun bittiyse saniyelik
// güncelleme durur; sunucunun resmî süresi (`fixedTimeMs`) geldiyse o gösterilir.
export function useElapsedTime(
    startedAt: string | null,
    isStopped: boolean,
    fixedTimeMs: number | null
): number {
    const [elapsedTimeMs, setElapsedTimeMs] = useState(0);

    useEffect(() => {
        if (!startedAt) {
            return;
        }

        const startedAtMs = Date.parse(startedAt);
        const updateElapsedTime = () => {
            setElapsedTimeMs(
                fixedTimeMs ?? Math.max(0, Date.now() - startedAtMs)
            );
        };
        // İlk güncelleme effect gövdesinde senkron setState olmasın diye
        // bir sonraki tick'e bırakılıyor.
        const initialUpdate = window.setTimeout(updateElapsedTime, 0);

        if (isStopped || fixedTimeMs !== null) {
            return () => window.clearTimeout(initialUpdate);
        }

        const interval = window.setInterval(updateElapsedTime, 1_000);

        return () => {
            window.clearTimeout(initialUpdate);
            window.clearInterval(interval);
        };
    }, [fixedTimeMs, isStopped, startedAt]);

    return elapsedTimeMs;
}
