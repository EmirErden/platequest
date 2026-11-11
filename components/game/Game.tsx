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

import type { GameMode } from "@/types/game";

import styles from "./Game.module.css";

// TurkeyMap'teki yanlış il sallanma animasyonunun süresi.
const WRONG_PROVINCE_FLASH_MS = 500;

type GameProps = {
    gameMode: GameMode;
    username: string | null;
};

export default function Game({ gameMode, username }: GameProps) {
    const {
        progress,
        progressError,
        gameResult,
        dispatchAction,
        restartGame,
    } = useGameProgress(gameMode);

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

    // Oyun kuralları lib/game-actions.ts'te (applyGameAction); burada sadece
    // eylemin sonucuna göre arayüz tepkileri (ceza animasyonu, toast vb.) var.

    function handleCorrectName() {
        dispatchAction({ type: "correct_name" });
    }

    function handleNameHint() {
        const result = dispatchAction({ type: "letter_hint" });

        if (result?.ok) {
            enqueuePenaltyFeedback(LETTER_HINT_PENALTY_MS);
        }
    }

    function handleMapHint() {
        const result = dispatchAction({ type: "map_hint" });

        if (result?.ok) {
            enqueuePenaltyFeedback(
                result.progress.mapHintLevel === 1
                    ? REGION_HINT_PENALTY_MS
                    : NEIGHBOR_HINT_PENALTY_MS
            );
        }
    }

    function handleProvinceClick(provinceName: string) {
        const result = dispatchAction({ type: "answer", provinceName });

        if (!result) {
            return;
        }

        if (!result.ok) {
            // Tamamlanmış ile ya da bitmiş oyunda tıklama sessizce yok sayılır.
            if (result.reason === "wrong_province") {
                setWrongProvince(provinceName);
            }

            return;
        }

        const updatedProgress = result.progress;

        setLastCompletedProvince(provinceName);
        showToast(
            getCelebrationMessage(
                updatedProgress.completedProvinces,
                updatedProgress.hintFreeStreak,
                provinceName
            ) ?? `${provinceName} tamamlandı!`
        );

        if (updatedProgress.isGameComplete) {
            setShouldAnimateCompletion(true);
            fireCompletionConfetti();
        }
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
