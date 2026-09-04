"use client";

import {useEffect, useState} from "react";
import GamePanel from "@/components/GamePanel";
import {provinces} from "@/data/provinces";
import TurkeyMap from "@/components/TurkeyMap";
import GameSidebar from "@/components/GameSidebar";
import confetti from "canvas-confetti";
import styles from "@/app/page.module.css";

type GamePhase = "name" | "map";

export default function Home() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [phase, setPhase] = useState<GamePhase>("name");

    // Drawer States
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [hoveredProvince, setHoveredProvince] = useState<string | null>(null);

    // Map states
    const [wrongProvince, setWrongProvince] = useState<string | null>(null);
    const [mapHintLevel, setMapHintLevel] = useState(0);
    const [completedProvinces, setCompletedProvinces] = useState<string[]>([]);
    const [lastCompletedProvince, setLastCompletedProvince] = useState<string | null>(null);

    // Success Message and Toast states
    const [successMessage, setSuccessMessage] = useState("");
    const [isToastLeaving, setIsToastLeaving] = useState(false);

    // Game completion states
    const [isGameComplete, setIsGameComplete] = useState(false);

    const [hasLoadedProgress, setHasLoadedProgress] = useState(false);

    const currentProvince = provinces[currentIndex];

    const highlightedProvinces = mapHintLevel >= 1
        ? provinces
            .filter((province) => province.region === currentProvince.region)
            .map((province) => province.name)
        : [];

    useEffect(() => {
        const loadProgress = () => {
            const savedProgress = localStorage.getItem("platequest-progress");

            if (savedProgress) {
                const parsedProgress = JSON.parse(savedProgress);

                setCurrentIndex(parsedProgress.currentIndex);
                setCompletedProvinces(parsedProgress.completedProvinces);
                setIsGameComplete(parsedProgress.isGameComplete);
            }

            setHasLoadedProgress(true);
        };

        const timeoutId = setTimeout(loadProgress, 0);

        return () => {
            clearTimeout(timeoutId);
        };
    }, []);

    useEffect(() => {
        if (!hasLoadedProgress) {
            return;
        }

        const progress = {
            currentIndex,
            completedProvinces,
            isGameComplete,
        };

        localStorage.setItem(
            "platequest-progress",
            JSON.stringify(progress),
        );
    }, [currentIndex, completedProvinces, isGameComplete, hasLoadedProgress]);

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
        setPhase("map");
    }

    function handleProvinceClick(provinceName: string) {
        if (phase !== "map") {
            return;
        }

        if (provinceName !== currentProvince.name) {
            setWrongProvince(provinceName);

            setTimeout(() => {
                setWrongProvince(null);
            }, 500);

            return;
        }

        setCompletedProvinces((current) => [
            ...current,
            currentProvince.name,
        ]);

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

        const nextIndex = currentIndex + 1;

        if (nextIndex >= provinces.length) {
            setIsGameComplete(true);
            return;
        }

        setCurrentIndex(nextIndex);
        setPhase("name");
        setMapHintLevel(0);
    }

    function handleRestart() {
        localStorage.removeItem("platequest-progress");

        setCurrentIndex(0);
        setPhase("name");
        setCompletedProvinces([]);
        setMapHintLevel(0);
        setWrongProvince(null);
        setSuccessMessage("");
        setIsToastLeaving(false);
        setIsGameComplete(false);
    }

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
                    <div className={styles.progress}>
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