"use client";

import Link from "next/link";
import Image from "next/image";
import {useEffect, useState} from "react";
import {useRouter} from "next/navigation";

import {
    deleteTurkeyPlateProgress,
    loadTurkeyPlateProgress,
    type TurkeyPlateProgress,
} from "@/lib/turkey-plate-progress";

import ResetGameDialog from "@/components/ResetGameDialog";
import LogoutButton from "@/components/LogoutButton";

import styles from "./StartScreen.module.css";

type StartScreenProps = {
    isAuthenticated: boolean;
    username: string | null;
};

export default function StartScreen({
                                        isAuthenticated,
                                        username,
                                    }: StartScreenProps) {
    const router = useRouter();

    const [savedProgress, setSavedProgress] =
        useState<TurkeyPlateProgress | null>(null);

    const [isProgressLoading, setIsProgressLoading] =
        useState(isAuthenticated);

    const [progressError, setProgressError] =
        useState<string | null>(null);

    const [isResetDialogOpen, setIsResetDialogOpen] =
        useState(false);

    useEffect(() => {
        if (!isAuthenticated) {
            return;
        }

        const loadProgress = async () => {
            try {
                const progress = await loadTurkeyPlateProgress();

                setSavedProgress(progress);
                setProgressError(null);
            } catch (error) {
                console.error("Progress yüklenemedi:", error);

                setProgressError(
                    "İlerleme bilgisi yüklenemedi."
                );
            } finally {
                setIsProgressLoading(false);
            }
        };

        void loadProgress();
    }, [isAuthenticated]);

    const hasActiveGame =
        savedProgress !== null &&
        (
            savedProgress.completedProvinces.length > 0 ||
            savedProgress.phase === "map"
        ) &&
        !savedProgress.isGameComplete;

    const completedCount =
        savedProgress?.completedProvinces.length ?? 0;

    const progressPercentage =
        (completedCount / 81) * 100;

    const handleRestart = async () => {
        try {
            setProgressError(null);

            await deleteTurkeyPlateProgress();

            setSavedProgress(null);
            setIsResetDialogOpen(false);

            router.push("/game");
        } catch (error) {
            console.error("Progress sıfırlanamadı:", error);

            setProgressError(
                "Oyun sıfırlanırken bir hata oluştu."
            );
        }
    };

    return (
        <main className={styles.page}>
            <section className={styles.card}>
                <div
                    className={styles.mapPreview}
                    aria-hidden="true"
                >
                    <Image
                        src="/turkey-map.svg"
                        alt=""
                        width={1007}
                        height={527}
                        priority
                    />
                </div>

                <h1 className={styles.title}>
                    Plaka Peşinde
                </h1>

                <p className={styles.description}>
                    Plakayı çöz, ilini bul, haritada işaretle.
                </p>

                {!isAuthenticated ? (
                        <div className={styles.actions}>
                            <Link
                                href="/login"
                                className={styles.primaryButton}
                            >
                                Giriş Yap
                            </Link>

                            <Link
                                href="/register"
                                className={styles.secondaryButton}
                            >
                                Kayıt Ol
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className={styles.userArea}>
                                <div className={styles.userIdentity}>
                                    <span className={styles.userAvatar} aria-hidden="true">
                                        {(username ?? "P").slice(0, 1).toUpperCase()}
                                    </span>

                                    <p className={styles.welcomeMessage}>
                                        <span>Oyuncu</span>
                                        <strong>Hoş geldin, {username ?? "gezgin"}</strong>
                                    </p>
                                </div>

                                <LogoutButton />
                            </div>

                            {isProgressLoading ? (
                                <div className={styles.loadingState} role="status">
                                    <span className={styles.loadingDot} aria-hidden="true" />
                                    İlerlemen hazırlanıyor...
                                </div>
                            ) : progressError ? (
                                <p className={styles.errorMessage} role="alert">
                                    {progressError}
                                </p>
                            ) : hasActiveGame ? (
                                <>
                                    <div className={styles.progressSection}>
                                        <div className={styles.progressInfo}>
                                            <span>İlerleme</span>

                                            <span>
                                                {completedCount} / 81
                                            </span>
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
                                            onClick={() =>
                                                setIsResetDialogOpen(true)
                                            }
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
                        </>
                )}
            </section>

            {isResetDialogOpen && (
                <ResetGameDialog
                    onCancel={() =>
                        setIsResetDialogOpen(false)
                    }
                    onConfirm={handleRestart}
                />
            )}
        </main>
    );
}
