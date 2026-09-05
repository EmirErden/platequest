"use client";

import {useEffect, useState} from "react";
import GamePanel from "@/components/GamePanel";
import {provinces} from "@/data/provinces";
import TurkeyMap from "@/components/TurkeyMap";
import GameSidebar from "@/components/GameSidebar";
import confetti from "canvas-confetti";
import styles from "@/app/game/page.module.css";
import {initialProgress, resetProgress, updateProgress, useGameProgress} from "@/lib/game-progress";

export default function Home() {
    const progress = useGameProgress();
    const {currentIndex, phase, completedProvinces, isGameComplete} = progress ?? initialProgress();

    // Drawer States
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [hoveredProvince, setHoveredProvince] = useState<string | null>(null);

    // Map states
    const [wrongProvince, setWrongProvince] = useState<string | null>(null);
    const [mapHintLevel, setMapHintLevel] = useState(0);
    const [lastCompletedProvince, setLastCompletedProvince] = useState<string | null>(null);

    // Success Message and Toast states
    const [successMessage, setSuccessMessage] = useState("");
    const [isToastLeaving, setIsToastLeaving] = useState(false);

    const currentProvince = provinces[currentIndex];

    const highlightedProvinces = mapHintLevel >= 1
        ? provinces
            .filter((province) => province.region === currentProvince.region)
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
            origin: {x: 0, y: 0.65},
        });

        confetti({
            ...defaults,
            particleCount: 100,
            angle: 120,
            origin: {x: 1, y: 0.65},
        });
    }, [isGameComplete]);

    function handleCorrectName() {
        updateProgress(current => current.isGameComplete ? current : {...current, phase: "map"});
    }

    function handleProvinceClick(provinceName: string) {
        if (!progress || isGameComplete || phase !== "map" || completedProvinces.includes(provinceName)) {
            return;
        }

        if (provinceName !== currentProvince.name) {
            setWrongProvince(provinceName);

            setTimeout(() => {
                setWrongProvince(null);
            }, 500);

            return;
        }

        updateProgress(current => {
            if (current.isGameComplete || current.phase !== "map" ||
                provinces[current.currentIndex].name !== provinceName ||
                current.completedProvinces.includes(provinceName)) return current;
            const nextIndex = current.currentIndex + 1;
            return {
                ...current,
                completedProvinces: [...current.completedProvinces, provinceName],
                currentIndex: Math.min(nextIndex, provinces.length - 1),
                phase: "name",
                isGameComplete: nextIndex >= provinces.length,
            };
        });

        setLastCompletedProvince(provinceName);

        setSuccessMessage(`${currentProvince.name} tamamlandı!`);
        setIsToastLeaving(false);

        setTimeout(() => {
            setIsToastLeaving(true);

            setTimeout(() => {
                setSuccessMessage("");
                setIsToastLeaving(false);
            }, 300);
        }, 2000);

        setMapHintLevel(0);
    }

    function handleRestart() {
        resetProgress();
        setLastCompletedProvince(null);
        setHoveredProvince(null);
        setMapHintLevel(0);
        setWrongProvince(null);
        setSuccessMessage("");
        setIsToastLeaving(false);
    }

    if (!progress) return null;

    return (
        <main className={styles.gamePage}>
            {successMessage && (
                <div
                    className={`${styles.successToast} ${
                        isToastLeaving ? styles.successToastLeaving : ""
                    }`}
                >
                    <span className={styles.successToastIcon}>✓</span>
                    {successMessage}
                </div>
            )}

            <header className={styles.gameHeader}>
                <div>
                    <h1>Plaka Peşinde</h1>
                    <p>{"Türkiye'yi plaka plaka keşfet."}</p>
                </div>

                <div className={styles.headerActions}>
                    <div
                        className={styles.progress}
                        style={{"--progress": (completedProvinces.length / provinces.length) * 100} as React.CSSProperties}
                    >
                        {completedProvinces.length} / {provinces.length}
                    </div>

                    <button
                        className={styles.drawerOpenButton}
                        type="button"
                        onClick={() => setIsDrawerOpen(true)}
                    >
                        ☰
                    </button>
                </div>
            </header>

            <div className={`${styles.gameContent} ${phase === "name" ? styles.namePhase : ""}`}>
                <section className={styles.mapSection}>
                    <TurkeyMap
                        onProvinceClickAction={handleProvinceClick}
                        wrongProvince={wrongProvince}
                        highlightedProvinces={highlightedProvinces}
                        completedProvinces={completedProvinces}
                        lastCompletedProvince={lastCompletedProvince}
                        hoveredProvince={hoveredProvince}
                    />
                </section>

                <section className={styles.panelWrapper}>
                {isGameComplete ? (
                    <section className={styles.completionPanel}>
                        <div className={styles.completionIcon}>✓</div>

                        <h2>Türkiye tamamlandı!</h2>

                        <p className={styles.completionText}>
                            81 ilin plaka kodunu ve haritadaki yerini tamamladın.
                        </p>

                        <div className={styles.completionProgress}>
                            {provinces.length} / {provinces.length}
                        </div>

                        <button
                            className={styles.restartButton}
                            type="button"
                            onClick={handleRestart}
                        >
                            Baştan Başla
                        </button>
                    </section>
                ) : (
                    <GamePanel
                        plate={currentProvince.plate}
                        provinceName={currentProvince.name}
                        phase={phase}
                        onCorrectNameAction={handleCorrectName}
                        onMapHintAction={() => {
                            setMapHintLevel((current) =>
                                Math.min(current + 1, 2)
                            );
                        }}
                        mapHintLevel={mapHintLevel}
                        neighbors={currentProvince.neighbors}
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
