"use client";

import { useEffect, useRef, useState } from "react";

import {
    finishGameSession,
    startGameSession,
} from "@/lib/game-session-client";
import {
    deleteTurkeyPlateProgress,
    initialTurkeyPlateProgress,
    loadTurkeyPlateProgress,
    saveTurkeyPlateProgress,
    type TurkeyPlateProgress,
    withGameSession,
} from "@/lib/turkey-plate-progress";
import type { GameMode, GameResult } from "@/types/game";

async function loadOrStartGame(
    gameMode: GameMode,
    userId: string
): Promise<TurkeyPlateProgress> {
    const savedProgress = await loadTurkeyPlateProgress(gameMode, userId);

    if (
        savedProgress.isGameComplete ||
        (savedProgress.sessionId && savedProgress.startedAt)
    ) {
        return savedProgress;
    }

    const session = await startGameSession(gameMode);
    const progressWithSession = withGameSession(
        savedProgress,
        session
    );

    await saveTurkeyPlateProgress(progressWithSession, gameMode, userId);

    return progressWithSession;
}

// Oyun ilerlemesinin yüklenmesi, sıralı kaydedilmesi, session'ın başlatılıp
// bitirilmesi ve sıfırlama. Arayüz durumu (toast, animasyon) Game'de kalıyor.
export function useGameProgress(gameMode: GameMode, userId: string) {
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
    // Handler'lar en güncel state'i buradan okur: render'daki `progress`,
    // yeniden render olmadan gelen ardışık olaylarda eski kalabilir.
    const progressRef = useRef<TurkeyPlateProgress | null>(null);
    const progressSaveQueueRef = useRef<Promise<void>>(
        Promise.resolve()
    );

    useEffect(() => {
        let isCurrent = true;
        const existingRequest = progressRequestRef.current;
        const progressRequest =
            existingRequest?.gameMode === gameMode
                ? existingRequest.promise
                : loadOrStartGame(gameMode, userId);

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
                    void finishGameSession(
                        gameMode,
                        savedProgress.sessionId,
                        savedProgress
                    )
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

                console.error("Progress yüklenemedi:", error);

                setProgressError(
                    "Oyun ilerlemesi yüklenemedi."
                );
            });

        return () => {
            isCurrent = false;
        };
    }, [gameMode, userId]);

    function getLatestProgress() {
        return progressRef.current;
    }

    function updateProgress(nextProgress: TurkeyPlateProgress) {
        progressRef.current = nextProgress;
        setProgress(nextProgress);
    }

    // Kayıtlar sırayla gider; önceki kayıt hata verse bile sıradaki çalışır.
    function queueProgressSave(
        nextProgress: TurkeyPlateProgress
    ): Promise<void> {
        const saveRequest = progressSaveQueueRef.current
            .catch(() => undefined)
            .then(() =>
                saveTurkeyPlateProgress(nextProgress, gameMode, userId)
            );

        progressSaveQueueRef.current = saveRequest.catch(() => undefined);

        return saveRequest;
    }

    // İpucu kullanımı: arka planda kaydet, hata olursa göster.
    function persistHintProgress(nextProgress: TurkeyPlateProgress) {
        void queueProgressSave(nextProgress).catch((error) => {
            console.error("İpucu ilerlemesi kaydedilemedi:", error);
            setProgressError(
                "İpucu kaydedilemedi. İnternet bağlantını kontrol et."
            );
        });
    }

    // İl tamamlandı: kaydet; oyun bittiyse resmî sonucu sunucudan al.
    async function persistCompletedProvince(
        nextProgress: TurkeyPlateProgress
    ) {
        try {
            await queueProgressSave(nextProgress);

            if (nextProgress.isGameComplete && nextProgress.sessionId) {
                const result = await finishGameSession(
                    gameMode,
                    nextProgress.sessionId,
                    nextProgress
                );

                setGameResult(result);
            }
        } catch (error) {
            console.error("Oyun ilerlemesi/sonucu kaydedilemedi:", error);

            setProgressError(
                "İlerleme veya oyun sonucu kaydedilemedi. İnternet bağlantını kontrol et."
            );
        }
    }

    // Başarılıysa true döner; Game arayüz durumunu ancak o zaman sıfırlar.
    async function restartGame(): Promise<boolean> {
        try {
            setProgressError(null);

            await progressSaveQueueRef.current.catch(() => undefined);
            await deleteTurkeyPlateProgress(gameMode);

            const initialProgress = initialTurkeyPlateProgress(gameMode);
            updateProgress(initialProgress);
            setGameResult(null);

            const session = await startGameSession(gameMode, true);
            const restartedProgress = withGameSession(
                initialProgress,
                session
            );

            updateProgress(restartedProgress);
            await queueProgressSave(restartedProgress);

            return true;
        } catch (error) {
            console.error("Progress sıfırlanamadı:", error);

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
        getLatestProgress,
        updateProgress,
        persistHintProgress,
        persistCompletedProvince,
        restartGame,
    };
}
