"use client";

import { useEffect, useRef, useState } from "react";

import {
    applyGameAction,
    type GameAction,
    type GameActionResult,
} from "@/lib/game-actions";
import {
    finishGameSession,
    sendGameAction,
    startGameSession,
} from "@/lib/game-session-client";
import type { TurkeyPlateProgress } from "@/lib/game-state";
import type { GameMode, GameResult } from "@/types/game";

// Oyun durumunun tarayıcıdaki yönetimi. Doğruluğun kaynağı sunucu
// (/api/game/action); burada aynı kurallar (applyGameAction) iyimser olarak
// uygulanır ki ekran istek dönmesini beklemesin. Sunucu bir eylemi reddederse
// onun döndürdüğü duruma geri dönülür. Arayüz durumu (toast, animasyon) Game'de.
export function useGameProgress(gameMode: GameMode) {
    const [progress, setProgress] =
        useState<TurkeyPlateProgress | null>(null);
    const [progressError, setProgressError] =
        useState<string | null>(null);
    const [gameResult, setGameResult] =
        useState<GameResult | null>(null);

    // React Strict Mode effect'i iki kez çalıştırır; aynı yükleme isteği
    // paylaşılsın diye promise burada tutuluyor.
    const progressRequestRef = useRef<{
        gameMode: GameMode;
        promise: Promise<TurkeyPlateProgress>;
    } | null>(null);
    // Handler'lar en güncel durumu buradan okur: render'daki `progress`,
    // yeniden render olmadan gelen ardışık olaylarda eski kalabilir.
    const progressRef = useRef<TurkeyPlateProgress | null>(null);
    // Sunucuya giden eylemler sırayla gider; biri bitmeden diğeri başlamaz.
    const syncQueueRef = useRef<Promise<void>>(Promise.resolve());
    // Sunucuyla eşitleme ya da yeniden başlatma olunca artar; kuyrukta bekleyen
    // ve artık geçersiz duruma göre üretilmiş eylemler gönderilmeden atlanır.
    const syncGenerationRef = useRef(0);

    useEffect(() => {
        let isCurrent = true;
        const existingRequest = progressRequestRef.current;
        const progressRequest =
            existingRequest?.gameMode === gameMode
                ? existingRequest.promise
                : startGameSession(gameMode);

        progressRequestRef.current = {
            gameMode,
            promise: progressRequest,
        };

        void progressRequest
            .then((savedProgress) => {
                if (!isCurrent) {
                    return;
                }

                progressRef.current = savedProgress;
                setProgress(savedProgress);

                // Bitmiş oyun yeniden açıldı: /finish idempotent, mevcut
                // sonucu döndürür.
                if (
                    savedProgress.isGameComplete &&
                    savedProgress.sessionId
                ) {
                    void finishGameSession(gameMode, savedProgress.sessionId)
                        .then((result) => {
                            if (isCurrent) {
                                setGameResult(result);
                            }
                        })
                        .catch((error) => {
                            if (isCurrent) {
                                console.error(
                                    "Oyun sonucu yüklenemedi:",
                                    error
                                );
                                setProgressError(
                                    "Oyun sonucu yüklenemedi. Sayfayı yenileyerek tekrar deneyebilirsin."
                                );
                            }
                        });
                }
            })
            .catch((error) => {
                if (!isCurrent) {
                    return;
                }

                console.error("Oyun yüklenemedi:", error);

                setProgressError(
                    "Oyun ilerlemesi yüklenemedi."
                );
            });

        return () => {
            isCurrent = false;
        };
    }, [gameMode]);

    function updateProgress(nextProgress: TurkeyPlateProgress) {
        progressRef.current = nextProgress;
        setProgress(nextProgress);
    }

    function enqueueSync(task: () => Promise<void>): Promise<void> {
        const run = syncQueueRef.current.then(task);

        syncQueueRef.current = run.catch(() => undefined);

        return run;
    }

    // Sunucu reddetti: onun bildiği duruma dön, kuyruktaki eski eylemleri at.
    function resyncWithServer(
        serverProgress: TurkeyPlateProgress,
        message: string
    ) {
        syncGenerationRef.current += 1;
        updateProgress(serverProgress);
        setProgressError(
            `${message} Oyun sunucudaki kayda göre güncellendi.`
        );
    }

    // Eylemi uygular. Kural ihlali varsa (yanlış il, ipucu kalmadı vb.) hiçbir
    // şey değişmez ve sonuç `ok: false` döner; Game buna göre tepki verir.
    // Oyun henüz yüklenmediyse null döner.
    function dispatchAction(action: GameAction): GameActionResult | null {
        const currentProgress = progressRef.current;
        const sessionId = currentProgress?.sessionId;

        if (!currentProgress || !sessionId) {
            return null;
        }

        const result = applyGameAction(currentProgress, action);

        if (!result.ok) {
            return result;
        }

        updateProgress(result.progress);

        const generation = syncGenerationRef.current;
        const isFinishingMove = result.progress.isGameComplete;

        void enqueueSync(async () => {
            if (generation !== syncGenerationRef.current) {
                return;
            }

            const response = await sendGameAction(gameMode, sessionId, action);

            if (!response.accepted) {
                resyncWithServer(response.progress, response.error);
                return;
            }

            // Son il sunucuda da kabul edildi → resmî sonucu iste.
            if (isFinishingMove) {
                setGameResult(await finishGameSession(gameMode, sessionId));
            }
        }).catch((error) => {
            console.error("Oyun ilerlemesi/sonucu kaydedilemedi:", error);

            setProgressError(
                isFinishingMove
                    ? "Oyun sonucu kaydedilemedi. Sayfayı yenileyerek tekrar deneyebilirsin."
                    : "İlerleme kaydedilemedi. İnternet bağlantını kontrol et."
            );
        });

        return result;
    }

    // Başarılıysa true döner; Game arayüz durumunu ancak o zaman sıfırlar.
    async function restartGame(): Promise<boolean> {
        // Kuyrukta bekleyen eylemler eski oyuna ait; gönderilmesinler.
        syncGenerationRef.current += 1;

        try {
            await syncQueueRef.current;

            const restartedProgress = await startGameSession(gameMode, true);

            syncGenerationRef.current += 1;
            updateProgress(restartedProgress);
            setGameResult(null);
            setProgressError(null);

            return true;
        } catch (error) {
            console.error("Oyun sıfırlanamadı:", error);

            setProgressError(
                "Oyun sıfırlanırken bir hata oluştu."
            );

            return false;
        }
    }

    return {
        progress,
        progressError,
        gameResult,
        dispatchAction,
        restartGame,
    };
}
