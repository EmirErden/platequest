"use client";

import React, { useEffect, useState } from "react";
import confetti from "canvas-confetti";

import GamePanel from "@/components/GamePanel";
import TurkeyMap from "@/components/TurkeyMap";
import GameSidebar from "@/components/GameSidebar";
import ProfileMenu from "@/components/ProfileMenu";

import { provinces } from "@/data/provinces";

import {
    deleteTurkeyPlateProgress,
    initialTurkeyPlateProgress,
    loadTurkeyPlateProgress,
    saveTurkeyPlateProgress,
    type TurkeyPlateProgress,
} from "@/lib/turkey-plate-progress";

import styles from "./page.module.css";

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

export default function GamePage() {
    const [progress, setProgress] =
        useState<TurkeyPlateProgress | null>(null);

    const [progressError, setProgressError] =
        useState<string | null>(null);

    // Sidebar
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [hoveredProvince, setHoveredProvince] =
        useState<string | null>(null);

    // Map
    const [wrongProvince, setWrongProvince] =
        useState<string | null>(null);
    const [mapHintLevel, setMapHintLevel] = useState(0);
    const [lastCompletedProvince, setLastCompletedProvince] =
        useState<string | null>(null);

    // Toast
    const [successMessage, setSuccessMessage] = useState("");
    const [isToastLeaving, setIsToastLeaving] = useState(false);

    useEffect(() => {
        const loadProgress = async () => {
            try {
                setProgressError(null);

                const savedProgress =
                    await loadTurkeyPlateProgress();

                setProgress(savedProgress);
            } catch (error) {
                console.error("Progress yüklenemedi:", error);

                setProgressError(
                    "Oyun ilerlemesi yüklenemedi."
                );
            }
        };

        void loadProgress();
    }, []);

    const currentProgress =
        progress ?? initialTurkeyPlateProgress();

    const {
        currentIndex,
        phase,
        completedProvinces,
        isGameComplete,
    } = currentProgress;

    const currentProvince = provinces[currentIndex];

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
        if (!isGameComplete) {
            return;
        }

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
        if (!progress || progress.isGameComplete) {
            return;
        }

        setProgress({
            ...progress,
            phase: "map",
        });
    }

    function markHintUsed() {
        if (
            !progress ||
            progress.usedHintForCurrentProvince
        ) {
            return;
        }

        setProgress({
            ...progress,
            usedHintForCurrentProvince: true,
        });
    }

    async function handleProvinceClick(
        provinceName: string
    ) {
        if (
            !progress ||
            isGameComplete ||
            phase !== "map" ||
            completedProvinces.includes(provinceName)
        ) {
            return;
        }

        if (provinceName !== currentProvince.name) {
            setWrongProvince(provinceName);

            setTimeout(() => {
                setWrongProvince(null);
            }, 500);

            return;
        }

        const nextIndex = progress.currentIndex + 1;

        const updatedCompletedProvinces = [
            ...progress.completedProvinces,
            provinceName,
        ];

        const nextStreak =
            progress.usedHintForCurrentProvince
                ? 0
                : progress.hintFreeStreak + 1;

        const updatedProgress: TurkeyPlateProgress = {
            ...progress,

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
        };

        // Önce UI'ı anında güncelle
        setProgress(updatedProgress);

        // Sadece il tamamen tamamlandığında DB'ye yaz
        try {
            await saveTurkeyPlateProgress(updatedProgress);
        } catch (error) {
            console.error("Progress kaydedilemedi:", error);

            setProgressError(
                "İlerleme kaydedilemedi. İnternet bağlantını kontrol et."
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

        setMapHintLevel(0);
    }

    async function handleRestart() {
        try {
            setProgressError(null);

            await deleteTurkeyPlateProgress();

            setProgress(initialTurkeyPlateProgress());

            setLastCompletedProvince(null);
            setHoveredProvince(null);
            setMapHintLevel(0);
            setWrongProvince(null);
            setSuccessMessage("");
            setIsToastLeaving(false);
        } catch (error) {
            console.error("Progress sıfırlanamadı:", error);

            setProgressError(
                "Oyun sıfırlanırken bir hata oluştu."
            );
        }
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
                    />
                </section>

                <section className={styles.panelWrapper}>
                    {isGameComplete ? (
                        <section
                            className={styles.completionPanel}
                        >
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
                                {provinces.length} /{" "}
                                {provinces.length}
                            </div>

                            <button
                                className={
                                    styles.restartButton
                                }
                                type="button"
                                onClick={handleRestart}
                            >
                                Baştan Başla
                            </button>
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
                            onMapHintAction={() => {
                                markHintUsed();

                                setMapHintLevel(
                                    (current) =>
                                        Math.min(
                                            current + 1,
                                            2
                                        )
                                );
                            }}
                            onNameHintAction={markHintUsed}
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
