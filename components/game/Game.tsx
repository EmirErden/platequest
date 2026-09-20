"use client";

import React, { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import Link from "next/link";

import GamePanel from "@/components/game/GamePanel";
import TurkeyMap from "@/components/game/map/TurkeyMap";
import GameSidebar from "@/components/game/GameSidebar";
import ProfileMenu from "@/components/profile/ProfileMenu";

import { provinces } from "@/data/provinces";

import {
    deleteTurkeyPlateProgress,
    initialTurkeyPlateProgress,
    loadTurkeyPlateProgress,
    saveTurkeyPlateProgress,
    type TurkeyPlateProgress,
    withGameSession,
} from "@/lib/turkey-plate-progress";
import {
    finishGameSession,
    startGameSession,
} from "@/lib/game-session-client";
import {
    calculatePenaltyTimeMs,
    formatDuration,
    formatPenaltyFeedback,
    LETTER_HINT_PENALTY_MS,
    NEIGHBOR_HINT_PENALTY_MS,
    REGION_HINT_PENALTY_MS,
} from "@/lib/game-timing";

import type { GameMode, GameResult } from "@/types/game";

import styles from "./Game.module.css";

type GameProps = {
    gameMode: GameMode;
};

type PenaltyFeedback = {
    id: number;
    penaltyMs: number;
};

async function loadOrStartGame(
    gameMode: GameMode
): Promise<TurkeyPlateProgress> {
    const savedProgress = await loadTurkeyPlateProgress(gameMode);

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

    await saveTurkeyPlateProgress(progressWithSession, gameMode);

    return progressWithSession;
}

function getCelebrationMessage(
    completedProvinces: string[],
    hintFreeStreak: number,
    provinceName: string
) {
    const completedCount = completedProvinces.length;

    const completedRegion = provinces.find(
        (province) => province.name === provinceName
    )?.region;

    if (completedCount === provinces.length) {
        return "✦ Türkiye turu tamamlandı!";
    }

    if (
        completedRegion &&
        provinces
            .filter((province) => province.region === completedRegion)
            .every((province) =>
                completedProvinces.includes(province.name)
            )
    ) {
        return `✦ ${completedRegion} turu tamamlandı!`;
    }

    if (hintFreeStreak === 10) {
        return "✦ Hafızadan haritaya: 10 il ipucusuz!";
    }

    if (hintFreeStreak === 5) {
        return "✦ Kusursuz beşli: 5 il ipucusuz!";
    }

    if (hintFreeStreak === 3) {
        return "✦ İz sürücü: 3 il ipucusuz!";
    }

    if (completedCount === 71) {
        return "✦ Son düzlük: Son 10 il kaldı!";
    }

    if (completedCount === 41) {
        return "✦ Yarı yol: Türkiye'nin yarısı tamam!";
    }

    if (completedCount === 10) {
        return "✦ Plaka avcısı: İlk 10 il tamam!";
    }

    if (completedCount === 3) {
        return "✦ Isınma turu tamamlandı!";
    }

    return null;
}

export default function Game({ gameMode }: GameProps) {
    const [progress, setProgress] =
        useState<TurkeyPlateProgress | null>(null);

    const [progressError, setProgressError] =
        useState<string | null>(null);
    const [gameResult, setGameResult] =
        useState<GameResult | null>(null);
    const [elapsedTimeMs, setElapsedTimeMs] = useState(0);
    const [penaltyFeedback, setPenaltyFeedback] =
        useState<PenaltyFeedback | null>(null);

    // Sidebar
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [hoveredProvince, setHoveredProvince] =
        useState<string | null>(null);

    // Map
    const [wrongProvince, setWrongProvince] =
        useState<string | null>(null);
    const [lastCompletedProvince, setLastCompletedProvince] =
        useState<string | null>(null);

    // Toast
    const [successMessage, setSuccessMessage] = useState("");
    const [isToastLeaving, setIsToastLeaving] = useState(false);
    const [shouldAnimateCompletion, setShouldAnimateCompletion] =
        useState(false);

    const progressRequestRef = useRef<{
        gameMode: GameMode;
        promise: Promise<TurkeyPlateProgress>;
    } | null>(null);
    const progressRef = useRef<TurkeyPlateProgress | null>(null);
    const progressSaveQueueRef = useRef<Promise<void>>(
        Promise.resolve()
    );
    const penaltyFeedbackQueueRef = useRef<number[]>([]);
    const isPenaltyFeedbackActiveRef = useRef(false);
    const penaltyFeedbackIdRef = useRef(0);
    const shouldCelebrateCompletionRef = useRef(false);

    useEffect(() => {
        let isCurrent = true;
        const existingRequest = progressRequestRef.current;
        const progressRequest =
            existingRequest?.gameMode === gameMode
                ? existingRequest.promise
                : loadOrStartGame(gameMode);

        progressRequestRef.current = {
            gameMode,
            promise: progressRequest,
        };

        void progressRequest
            .then((savedProgress) => {
                if (isCurrent) {
                    progressRef.current = savedProgress;
                    setProgress(savedProgress);

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
    }, [gameMode]);

    const currentProgress =
        progress ?? initialTurkeyPlateProgress(gameMode);

    const {
        currentIndex,
        phase,
        completedProvinces,
        isGameComplete,
        provinceOrder,
        mapHintLevel,
        nameHintCount,
        startedAt,
    } = currentProgress;

    const currentProvince = provinces[provinceOrder[currentIndex]];

    const highlightedProvinces =
        mapHintLevel >= 1
            ? provinces
                .filter(
                    (province) =>
                        province.region === currentProvince.region
                )
                .map((province) => province.name)
            : [];

    useEffect(() => {
        if (!startedAt) {
            return;
        }

        const startedAtMs = Date.parse(startedAt);
        const updateElapsedTime = () => {
            setElapsedTimeMs(
                gameResult?.playTimeMs ??
                Math.max(0, Date.now() - startedAtMs)
            );
        };
        const initialUpdate = window.setTimeout(updateElapsedTime, 0);

        if (gameResult || isGameComplete) {
            return () => window.clearTimeout(initialUpdate);
        }

        const interval = window.setInterval(updateElapsedTime, 1_000);

        return () => {
            window.clearTimeout(initialUpdate);
            window.clearInterval(interval);
        };
    }, [gameResult, isGameComplete, startedAt]);

    useEffect(() => {
        if (
            !isGameComplete ||
            !shouldCelebrateCompletionRef.current
        ) {
            return;
        }

        shouldCelebrateCompletionRef.current = false;

        const defaults = {
            spread: 70,
            ticks: 200,
            gravity: 1,
            decay: 0.95,
            startVelocity: 40,
            disableForReducedMotion: true,
        };

        confetti({
            ...defaults,
            particleCount: 100,
            angle: 60,
            origin: { x: 0, y: 0.65 },
        });

        confetti({
            ...defaults,
            particleCount: 100,
            angle: 120,
            origin: { x: 1, y: 0.65 },
        });
    }, [isGameComplete]);

    function handleCorrectName() {
        const activeProgress = progressRef.current;

        if (!activeProgress || activeProgress.isGameComplete) {
            return;
        }

        setCurrentProgress({
            ...activeProgress,
            phase: "map",
        });
    }

    function handleNameHint(nextHintCount: number) {
        const activeProgress = progressRef.current;

        if (
            !activeProgress ||
            activeProgress.isGameComplete ||
            nextHintCount <= activeProgress.nameHintCount
        ) {
            return;
        }

        const updatedProgress: TurkeyPlateProgress = {
            ...activeProgress,
            usedHintForCurrentProvince: true,
            nameHintCount: nextHintCount,
            letterHintsUsed:
                activeProgress.letterHintsUsed +
                (nextHintCount - activeProgress.nameHintCount),
        };

        setCurrentProgress(updatedProgress);
        enqueuePenaltyFeedback(
            (nextHintCount - activeProgress.nameHintCount) *
            LETTER_HINT_PENALTY_MS
        );
        persistProgress(updatedProgress);
    }

    function handleMapHint() {
        const activeProgress = progressRef.current;

        if (
            !activeProgress ||
            activeProgress.isGameComplete ||
            activeProgress.mapHintLevel >= 2
        ) {
            return;
        }

        const nextMapHintLevel = activeProgress.mapHintLevel + 1;
        const updatedProgress: TurkeyPlateProgress = {
            ...activeProgress,
            usedHintForCurrentProvince: true,
            mapHintLevel: nextMapHintLevel,
            regionHintsUsed:
                activeProgress.regionHintsUsed +
                (nextMapHintLevel === 1 ? 1 : 0),
            neighborHintsUsed:
                activeProgress.neighborHintsUsed +
                (nextMapHintLevel === 2 ? 1 : 0),
        };

        setCurrentProgress(updatedProgress);
        enqueuePenaltyFeedback(
            nextMapHintLevel === 1
                ? REGION_HINT_PENALTY_MS
                : NEIGHBOR_HINT_PENALTY_MS
        );
        persistProgress(updatedProgress);
    }

    async function handleProvinceClick(
        provinceName: string
    ) {
        if (
            !progressRef.current ||
            progressRef.current.isGameComplete ||
            progressRef.current.completedProvinces.includes(provinceName)
        ) {
            return;
        }

        const activeProgress = progressRef.current;

        if (provinceName !== currentProvince.name) {
            setWrongProvince(provinceName);

            setTimeout(() => {
                setWrongProvince(null);
            }, 500);

            return;
        }

        const nextIndex = activeProgress.currentIndex + 1;

        const updatedCompletedProvinces = [
            ...activeProgress.completedProvinces,
            provinceName,
        ];

        const nextStreak =
            activeProgress.usedHintForCurrentProvince
                ? 0
                : activeProgress.hintFreeStreak + 1;

        const updatedProgress: TurkeyPlateProgress = {
            ...activeProgress,

            currentIndex: Math.min(
                nextIndex,
                provinces.length - 1
            ),

            phase: "name",

            completedProvinces:
            updatedCompletedProvinces,

            isGameComplete:
                nextIndex >= provinces.length,

            hintFreeStreak: nextStreak,

            usedHintForCurrentProvince: false,
            nameHintCount: 0,
            mapHintLevel: 0,
        };

        // Önce UI'ı anında güncelle
        if (updatedProgress.isGameComplete) {
            shouldCelebrateCompletionRef.current = true;
            setShouldAnimateCompletion(true);
        }

        setCurrentProgress(updatedProgress);

        // Sadece il tamamen tamamlandığında DB'ye yaz
        try {
            await queueProgressSave(updatedProgress);

            if (
                updatedProgress.isGameComplete &&
                updatedProgress.sessionId
            ) {
                const result = await finishGameSession(
                    gameMode,
                    updatedProgress.sessionId,
                    updatedProgress
                );

                setGameResult(result);
            }
        } catch (error) {
            console.error("Oyun ilerlemesi/sonucu kaydedilemedi:", error);

            setProgressError(
                "İlerleme veya oyun sonucu kaydedilemedi. İnternet bağlantını kontrol et."
            );
        }

        setLastCompletedProvince(provinceName);

        setSuccessMessage(
            getCelebrationMessage(
                updatedProgress.completedProvinces,
                updatedProgress.hintFreeStreak,
                currentProvince.name
            ) ?? `${currentProvince.name} tamamlandı!`
        );

        setIsToastLeaving(false);

        setTimeout(() => {
            setIsToastLeaving(true);

            setTimeout(() => {
                setSuccessMessage("");
                setIsToastLeaving(false);
            }, 300);
        }, 4000);

    }

    async function handleRestart() {
        try {
            setProgressError(null);

            await progressSaveQueueRef.current.catch(() => undefined);
            await deleteTurkeyPlateProgress(gameMode);

            const initialProgress = initialTurkeyPlateProgress(gameMode);
            setCurrentProgress(initialProgress);
            setGameResult(null);

            const session = await startGameSession(gameMode, true);
            const restartedProgress = withGameSession(
                initialProgress,
                session
            );

            setCurrentProgress(restartedProgress);
            await queueProgressSave(restartedProgress);

            setLastCompletedProvince(null);
            setHoveredProvince(null);
            setWrongProvince(null);
            setSuccessMessage("");
            setIsToastLeaving(false);
            setShouldAnimateCompletion(false);
            penaltyFeedbackQueueRef.current = [];
            isPenaltyFeedbackActiveRef.current = false;
            setPenaltyFeedback(null);
        } catch (error) {
            console.error("Progress sıfırlanamadı:", error);

            setProgressError(
                "Oyun sıfırlanırken bir hata oluştu."
            );
        }
    }

    function setCurrentProgress(nextProgress: TurkeyPlateProgress) {
        progressRef.current = nextProgress;
        setProgress(nextProgress);
    }

    function queueProgressSave(
        nextProgress: TurkeyPlateProgress
    ): Promise<void> {
        const saveRequest = progressSaveQueueRef.current
            .catch(() => undefined)
            .then(() => saveTurkeyPlateProgress(nextProgress, gameMode));

        progressSaveQueueRef.current = saveRequest.catch(() => undefined);

        return saveRequest;
    }

    function persistProgress(nextProgress: TurkeyPlateProgress) {
        void queueProgressSave(nextProgress).catch((error) => {
            console.error("İpucu ilerlemesi kaydedilemedi:", error);
            setProgressError(
                "İpucu kaydedilemedi. İnternet bağlantını kontrol et."
            );
        });
    }

    function enqueuePenaltyFeedback(penaltyMs: number) {
        if (isPenaltyFeedbackActiveRef.current) {
            penaltyFeedbackQueueRef.current.push(penaltyMs);
            return;
        }

        showPenaltyFeedback(penaltyMs);
    }

    function showPenaltyFeedback(penaltyMs: number) {
        isPenaltyFeedbackActiveRef.current = true;
        penaltyFeedbackIdRef.current += 1;
        setPenaltyFeedback({
            id: penaltyFeedbackIdRef.current,
            penaltyMs,
        });
    }

    function handlePenaltyFeedbackEnd() {
        const nextPenalty = penaltyFeedbackQueueRef.current.shift();

        if (nextPenalty !== undefined) {
            showPenaltyFeedback(nextPenalty);
            return;
        }

        isPenaltyFeedbackActiveRef.current = false;
        setPenaltyFeedback(null);
    }

    if (progressError && !progress) {
        return (
            <main className={styles.gamePage}>
                <div className={styles.loadingPanel} role="alert">
                    <span className={styles.loadingPanelTitle}>
                        Oyun yüklenemedi
                    </span>
                    {progressError}
                </div>
            </main>
        );
    }

    if (!progress) {
        return (
            <main className={styles.gamePage}>
                <div className={styles.loadingPanel} role="status">
                    <span className={styles.loadingIndicator} aria-hidden="true" />
                    Oyun yükleniyor...
                </div>
            </main>
        );
    }

    const accumulatedPenaltyMs = calculatePenaltyTimeMs(progress);
    const displayedTimeMs = gameResult?.finalTimeMs ??
        elapsedTimeMs + accumulatedPenaltyMs;

    return (
        <main className={styles.gamePage}>
            {progressError && (
                <div className={styles.errorMessage}>
                    {progressError}
                </div>
            )}

            {successMessage && (
                <div
                    className={`${styles.successToast} ${
                        isToastLeaving
                            ? styles.successToastLeaving
                            : ""
                    }`}
                >
                    <span className={styles.successToastIcon}>
                        ✓
                    </span>

                    {successMessage}
                </div>
            )}

            <header className={styles.gameHeader}>
                <div>
                    <h1>Plaka Peşinde</h1>

                    <p>
                        Türkiye&apos;yi plaka plaka keşfet.
                    </p>
                </div>

                <div className={styles.headerActions}>
                    {startedAt && !isGameComplete && (
                        <div className={styles.timerArea}>
                            <div
                                className={styles.timer}
                                aria-label={`Ceza dahil süre ${formatDuration(displayedTimeMs)}`}
                            >
                                <span>Süre</span>
                                <strong>{formatDuration(displayedTimeMs)}</strong>
                            </div>

                            {penaltyFeedback && (
                                <span
                                    key={penaltyFeedback.id}
                                    className={styles.penaltyFeedback}
                                    role="status"
                                    onAnimationEnd={handlePenaltyFeedbackEnd}
                                >
                                    {formatPenaltyFeedback(
                                        penaltyFeedback.penaltyMs
                                    )}
                                </span>
                            )}
                        </div>
                    )}

                    <div
                        className={styles.progress}
                        style={
                            {
                                "--progress":
                                    (completedProvinces.length /
                                        provinces.length) *
                                    100,
                            } as React.CSSProperties
                        }
                    >
                        {completedProvinces.length} /{" "}
                        {provinces.length}
                    </div>

                    <ProfileMenu />

                    <button
                        className={styles.drawerOpenButton}
                        type="button"
                        onClick={() => setIsDrawerOpen(true)}
                    >
                        ☰
                    </button>
                </div>
            </header>

            <div
                className={`${styles.gameContent} ${
                    phase === "name"
                        ? styles.namePhase
                        : ""
                } ${
                    isGameComplete
                        ? styles.completionMode
                        : ""
                }`}
            >
                <section className={styles.mapSection}>
                        <TurkeyMap
                        onProvinceClickAction={
                            handleProvinceClick
                        }
                        wrongProvince={wrongProvince}
                        highlightedProvinces={
                            highlightedProvinces
                        }
                        completedProvinces={
                            completedProvinces
                        }
                        lastCompletedProvince={
                            lastCompletedProvince
                        }
                            hoveredProvince={
                                hoveredProvince
                            }
                            shouldAnimateCompletion={
                                shouldAnimateCompletion
                            }
                            onCompletionAnimationEndAction={() =>
                                setShouldAnimateCompletion(false)
                            }
                        />
                </section>

                <section className={styles.panelWrapper}>
                    {isGameComplete ? (
                        <section
                            className={styles.completionPanel}
                        >
                            <p
                                className={
                                    styles.completionEyebrow
                                }
                            >
                                Tur tamamlandı
                            </p>

                            <div
                                className={styles.completionIcon}
                            >
                                ✓
                            </div>

                            <h2>Türkiye tamamlandı!</h2>

                            <p
                                className={
                                    styles.completionText
                                }
                            >
                                81 ilin plaka kodunu ve
                                haritadaki yerini tamamladın.
                            </p>

                            <div
                                className={
                                    styles.completionProgress
                                }
                            >
                                <strong>
                                    {provinces.length} /{" "}
                                    {provinces.length}
                                </strong>
                                <span>il keşfedildi</span>
                            </div>

                            <div
                                className={
                                    styles.finalTimeCard
                                }
                                aria-live="polite"
                            >
                                <span>Final süre</span>
                                <strong>
                                    {gameResult
                                        ? formatDuration(
                                              gameResult.finalTimeMs
                                          )
                                        : "Hesaplanıyor…"}
                                </strong>
                            </div>

                            {gameResult ? (
                                <dl
                                    className={
                                        styles.resultTimes
                                    }
                                >
                                    <div>
                                        <dt>Oyun süresi</dt>
                                        <dd>{formatDuration(gameResult.playTimeMs)}</dd>
                                    </div>

                                    {gameResult.penaltyTimeMs > 0 && (
                                        <div>
                                            <dt>İpucu cezası</dt>
                                            <dd>
                                                +{formatDuration(gameResult.penaltyTimeMs)}
                                            </dd>
                                        </div>
                                    )}
                                </dl>
                            ) : (
                                <p
                                    className={
                                        styles.resultPending
                                    }
                                >
                                    Resmî sonucun hazırlanıyor.
                                </p>
                            )}

                            <div
                                className={
                                    styles.completionActions
                                }
                            >
                                <button
                                    className={
                                        styles.restartButton
                                    }
                                    type="button"
                                    onClick={handleRestart}
                                >
                                    Yeni Oyun Başlat
                                </button>

                                <Link
                                    className={styles.homeButton}
                                    href="/"
                                >
                                    Ana Sayfaya Dön
                                </Link>
                            </div>
                        </section>
                    ) : (
                        <GamePanel
                            plate={currentProvince.plate}
                            provinceName={
                                currentProvince.name
                            }
                            phase={phase}
                            onCorrectNameAction={
                                handleCorrectName
                            }
                            onMapHintAction={handleMapHint}
                            onNameHintAction={handleNameHint}
                            nameHintCount={nameHintCount}
                            mapHintLevel={mapHintLevel}
                            region={currentProvince.region}
                            neighbors={
                                currentProvince.neighbors
                            }
                        />
                    )}
                </section>
            </div>

            <GameSidebar
                completedProvinces={completedProvinces}
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                onReset={handleRestart}
                onProvinceHover={setHoveredProvince}
            />
        </main>
    );
}
