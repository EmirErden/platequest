"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import {resetProgress, useGameProgress} from "@/lib/game-progress";
import { useRouter } from "next/navigation";

import ResetGameDialog from "@/components/ResetGameDialog";
import LicensePlate from "@/components/LicensePlate";

import styles from "./StartScreen.module.css";

export default function StartScreen() {
    const router = useRouter();

    const savedProgress = useGameProgress();
    const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

    if (!savedProgress) {
        return null;
    }

    const hasActiveGame =
        (savedProgress.completedProvinces.length > 0 || savedProgress.phase === "map") &&
        !savedProgress.isGameComplete;

    const completedCount = savedProgress?.completedProvinces.length ?? 0;
    const progressPercentage = (completedCount / 81) * 100;

    const handleRestart = () => {
        resetProgress();
        setIsResetDialogOpen(false);
        router.push("/game");
    };

    return (
        <main className={styles.page}>
            <section className={styles.card}>
                <div className={styles.mapPreview} aria-hidden="true">
                    <Image src="/turkey-map.svg" alt="" width={1007} height={527} priority />
                </div>

                <h1 className={styles.title}>Plaka Peşinde</h1>

                <p className={styles.description}>
                    Plakayı çöz, ilini bul, haritada işaretle.
                </p>

                <LicensePlate value="34" className={styles.examplePlate} />

                {hasActiveGame ? (
                    <>
                        <div className={styles.progressSection}>
                            <div className={styles.progressInfo}>
                                <span>İlerleme</span>
                                <span>{completedCount} / 81</span>
                            </div>

                            <div className={styles.progressTrack}>
                                <div
                                    className={styles.progressBar}
                                    style={{
                                        width: `${progressPercentage}%`,
                                    }}
                                />
                            </div>
                        </div>

                        <div className={styles.actions}>
                            <Link
                                href="/game"
                                className={styles.primaryButton}
                            >
                                Devam Et
                            </Link>

                            <button
                                type="button"
                                className={styles.restartButton}
                                onClick={() => setIsResetDialogOpen(true)}
                            >
                                Baştan Başla
                            </button>
                        </div>
                    </>
                ) : (
                    <div className={styles.actions}>
                        <button
                            type="button"
                            onClick={handleRestart}
                            className={styles.primaryButton}
                        >
                            Yeni Oyuna Başla
                        </button>
                    </div>
                )}
            </section>

            {isResetDialogOpen && (
                <ResetGameDialog
                    onCancel={() => setIsResetDialogOpen(false)}
                    onConfirm={handleRestart}
                />
            )}
        </main>
    );
}
