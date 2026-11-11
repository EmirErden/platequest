"use client";

import React, { useEffect, useState } from "react";

import CompletionPanel from "@/components/game/CompletionPanel";
import GamePanel from "@/components/game/GamePanel";
import GameSidebar from "@/components/game/GameSidebar";
import TurkeyMap from "@/components/game/map/TurkeyMap";
import { fireCompletionConfetti } from "@/components/game/completion-confetti";
import { useElapsedTime } from "@/components/game/hooks/useElapsedTime";
import { useGameProgress } from "@/components/game/hooks/useGameProgress";
import { usePenaltyFeedback } from "@/components/game/hooks/usePenaltyFeedback";
import { useSuccessToast } from "@/components/game/hooks/useSuccessToast";
import ProfileMenu from "@/components/profile/ProfileMenu";

import { provinces } from "@/data/provinces";

import { getCelebrationMessage } from "@/lib/game-celebration";
import {
    calculatePenaltyTimeMs,
    formatDuration,
    formatPenaltyFeedback,
    LETTER_HINT_PENALTY_MS,
    NEIGHBOR_HINT_PENALTY_MS,
    REGION_HINT_PENALTY_MS,
} from "@/lib/game-timing";
import type { TurkeyPlateProgress } from "@/lib/turkey-plate-progress";

import type { GameMode } from "@/types/game";

import styles from "./Game.module.css";

// TurkeyMap'teki yanlış il sallanma animasyonunun süresi.
const WRONG_PROVINCE_FLASH_MS = 500;

type GameProps = {
    gameMode: GameMode;
    userId: string;
    username: string | null;
};

export default function Game({ gameMode, userId, username }: GameProps) {
    const {
        progress,
        progressError,
        gameResult,
        getLatestProgress,
        updateProgress,
        persistHintProgress,
        persistCompletedProvince,
        restartGame,
    } = useGameProgress(gameMode, userId);

    const {
        penaltyFeedback,
        enqueuePenaltyFeedback,
        handlePenaltyFeedbackEnd,
        resetPenaltyFeedback,
    } = usePenaltyFeedback();

    const {
        toastMessage,
        isToastLeaving,
        showToast,
        hideToast,
    } = useSuccessToast();

    // Sidebar
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [hoveredProvince, setHoveredProvince] =
        useState<string | null>(null);

    // Map
    const [wrongProvince, setWrongProvince] =
        useState<string | null>(null);
    const [lastCompletedProvince, setLastCompletedProvince] =
        useState<string | null>(null);
    const [shouldAnimateCompletion, setShouldAnimateCompletion] =
        useState(false);

    const isGameComplete = progress?.isGameComplete ?? false;
    const elapsedTimeMs = useElapsedTime(
        progress?.startedAt ?? null,
        isGameComplete
    );

    useEffect(() => {
        if (!wrongProvince) {
            return;
        }

        const timeout = window.setTimeout(() => {
            setWrongProvince(null);
        }, WRONG_PROVINCE_FLASH_MS);

        return () => window.clearTimeout(timeout);
    }, [wrongProvince]);

    function handleCorrectName() {
        const activeProgress = getLatestProgress();

        if (!activeProgress || activeProgress.isGameComplete) {
            return;
        }

        updateProgress({
            ...activeProgress,
            phase: "map",
        });
    }

    function handleNameHint(nextHintCount: number) {
        const activeProgress = getLatestProgress();

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

        updateProgress(updatedProgress);
        enqueuePenaltyFeedback(
            (nextHintCount - activeProgress.nameHintCount) *
            LETTER_HINT_PENALTY_MS
        );
        persistHintProgress(updatedProgress);
    }

    function handleMapHint() {
        const activeProgress = getLatestProgress();

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

        updateProgress(updatedProgress);
        enqueuePenaltyFeedback(
            nextMapHintLevel === 1
                ? REGION_HINT_PENALTY_MS
                : NEIGHBOR_HINT_PENALTY_MS
        );
        persistHintProgress(updatedProgress);
    }

    function handleProvinceClick(provinceName: string) {
        const activeProgress = getLatestProgress();

        if (
            !activeProgress ||
            activeProgress.isGameComplete ||
            activeProgress.completedProvinces.includes(provinceName)
        ) {
            return;
        }

        // Beklenen il render'daki değerden değil en güncel state'ten
        // hesaplanıyor: ekran yenilenmeden gelen ikinci tıklama eski ile
        // karşılaştırılmasın.
        const expectedProvince =
            provinces[activeProgress.provinceOrder[activeProgress.currentIndex]];

        if (provinceName !== expectedProvince.name) {
            setWrongProvince(provinceName);
            return;
        }

        const nextIndex = activeProgress.currentIndex + 1;

        const updatedProgress: TurkeyPlateProgress = {
            ...activeProgress,
            currentIndex: Math.min(nextIndex, provinces.length - 1),
            phase: "name",
            completedProvinces: [
                ...activeProgress.completedProvinces,
                provinceName,
            ],
            isGameComplete: nextIndex >= provinces.length,
            hintFreeStreak: activeProgress.usedHintForCurrentProvince
                ? 0
                : activeProgress.hintFreeStreak + 1,
            usedHintForCurrentProvince: false,
            nameHintCount: 0,
            mapHintLevel: 0,
        };

        // Arayüz hemen güncellenir; kayıt arka planda sıraya girer.
        updateProgress(updatedProgress);
        setLastCompletedProvince(provinceName);
        showToast(
            getCelebrationMessage(
                updatedProgress.completedProvinces,
                updatedProgress.hintFreeStreak,
                expectedProvince.name
            ) ?? `${expectedProvince.name} tamamlandı!`
        );

        if (updatedProgress.isGameComplete) {
            setShouldAnimateCompletion(true);
            fireCompletionConfetti();
        }

        void persistCompletedProvince(updatedProgress);
    }

    async function handleRestart() {
        const isRestarted = await restartGame();

        if (!isRestarted) {
            return;
        }

        setLastCompletedProvince(null);
        setHoveredProvince(null);
        setWrongProvince(null);
        setShouldAnimateCompletion(false);
        hideToast();
        resetPenaltyFeedback();
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

    const {
        currentIndex,
        phase,
        completedProvinces,
        provinceOrder,
        mapHintLevel,
        nameHintCount,
        startedAt,
    } = progress;

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

    // Üstteki sayaç sadece oyun sürerken görünür (bitince CompletionPanel
    // sunucunun resmî süresini gösterir); cezalar anında eklenir.
    const displayedTimeMs =
        elapsedTimeMs + calculatePenaltyTimeMs(progress);

    return (
        <main className={styles.gamePage}>
            {progressError && (
                <div className={styles.errorMessage}>
                    {progressError}
                </div>
            )}

            {toastMessage && (
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

                    {toastMessage}
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

                    <ProfileMenu username={username} />

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
                        onProvinceClickAction={handleProvinceClick}
                        wrongProvince={wrongProvince}
                        highlightedProvinces={highlightedProvinces}
                        completedProvinces={completedProvinces}
                        lastCompletedProvince={lastCompletedProvince}
                        hoveredProvince={hoveredProvince}
                        shouldAnimateCompletion={shouldAnimateCompletion}
                        onCompletionAnimationEndAction={() =>
                            setShouldAnimateCompletion(false)
                        }
                    />
                </section>

                <section className={styles.panelWrapper}>
                    {isGameComplete ? (
                        <CompletionPanel
                            provinceCount={provinces.length}
                            gameResult={gameResult}
                            onRestartAction={handleRestart}
                        />
                    ) : (
                        <GamePanel
                            plate={currentProvince.plate}
                            provinceName={currentProvince.name}
                            phase={phase}
                            onCorrectNameAction={handleCorrectName}
                            onMapHintAction={handleMapHint}
                            onNameHintAction={handleNameHint}
                            nameHintCount={nameHintCount}
                            mapHintLevel={mapHintLevel}
                            region={currentProvince.region}
                            neighbors={currentProvince.neighbors}
                        />
                    )}
                </section>
            </div>

            <GameSidebar
                completedProvinces={completedProvinces}
                isOpen={isDrawerOpen}
                onCloseAction={() => setIsDrawerOpen(false)}
                onResetAction={handleRestart}
                onProvinceHoverAction={setHoveredProvince}
            />
        </main>
    );
}
