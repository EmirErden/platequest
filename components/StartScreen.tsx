"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import ResetGameDialog from "@/components/ResetGameDialog";

import styles from "./StartScreen.module.css";

type SavedProgress = {
    currentIndex: number;
    completedProvinces: string[];
    isGameComplete: boolean;
};

export default function StartScreen() {
    const router = useRouter();

    const [savedProgress, setSavedProgress] = useState<SavedProgress | null>(null);
    const [hasLoaded, setHasLoaded] = useState(false);
    const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem("platequest-progress");

        if (saved) {
            setSavedProgress(JSON.parse(saved));
        }

        setHasLoaded(true);
    }, []);

    if (!hasLoaded) {
        return null;
    }

    const hasActiveGame =
        savedProgress !== null &&
        savedProgress.completedProvinces.length > 0 &&
        !savedProgress.isGameComplete;

    const completedCount = savedProgress?.completedProvinces.length ?? 0;
    const progressPercentage = (completedCount / 81) * 100;

    const handleRestart = () => {
        localStorage.removeItem("platequest-progress");
        setIsResetDialogOpen(false);
        router.push("/game");
    };

    return (
        <main className={styles.page}>
            <section className={styles.card}>
                <div className={styles.plateBadge}>TR • 81</div>

                <h1 className={styles.title}>PlateQuest</h1>

                <p className={styles.description}>
                    Türkiye'nin 81 ilini plakalarından bul.
                    Kaç tanesini tamamlayabileceksin?
                </p>

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
                        <Link
                            href="/game"
                            className={styles.primaryButton}
                        >
                            Yeni Oyuna Başla
                        </Link>
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