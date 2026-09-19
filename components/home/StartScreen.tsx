"use client";

import Link from "next/link";
import Image from "next/image";

import ProfileMenu from "@/components/profile/ProfileMenu";

import styles from "./StartScreen.module.css";
import {useState} from "react";

type StartScreenProps = {
    isAuthenticated: boolean;
    username: string | null;
};

export default function StartScreen({
                                        isAuthenticated,
                                        username,
                                    }: StartScreenProps) {

    const [isGameModeSelectionOpen, setIsGameModeSelectionOpen] =
        useState(false);

    return (
        <main className={styles.page}>
            {isAuthenticated && (
                <div className={styles.profileMenuArea}>
                    <ProfileMenu username={username}/>
                </div>
            )}

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

                <h1 className={styles.title}>Plaka Peşinde</h1>

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
                        {!isGameModeSelectionOpen ? (
                            <>
                                <div className={styles.userArea}>
                                    <div className={styles.userIdentity}>
                                        <span
                                            className={styles.userAvatar}
                                            aria-hidden="true"
                                        >
                                            {(username ?? "P")
                                                .slice(0, 1)
                                                .toUpperCase()}
                                        </span>

                                        <p className={styles.welcomeMessage}>
                                            <span>Oyuncu</span>
                                            <strong>
                                                Hoş geldin, {username ?? "gezgin"}
                                            </strong>
                                        </p>
                                    </div>
                                </div>

                                <div className={styles.actions}>
                                    <button
                                        type="button"
                                        className={styles.primaryButton}
                                        onClick={() =>
                                            setIsGameModeSelectionOpen(true)
                                        }
                                    >
                                        Oyun Modunu Seç
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className={styles.gameModeSelection}>
                                <div className={styles.gameModeHeader}>
                                    <button
                                        type="button"
                                        className={styles.backButton}
                                        onClick={() =>
                                            setIsGameModeSelectionOpen(false)
                                        }
                                        aria-label="Ana ekrana dön"
                                    >
                                        ←
                                    </button>

                                    <div>
                                        <h2 className={styles.gameModeTitle}>
                                            Oyun Modu
                                        </h2>

                                        <p className={styles.gameModeDescription}>
                                            Nasıl oynamak istersin?
                                        </p>
                                    </div>
                                </div>

                                <div className={styles.gameModes}>
                                    <Link
                                        href="/game/ordered-plate"
                                        className={styles.gameModeCard}
                                    >
                                        <span
                                            className={`${styles.gameModeIcon} ${styles.orderedGameModeIcon}`}
                                            aria-hidden="true"
                                        />

                                        <span className={styles.gameModeContent}>
                                            <span className={styles.gameModeMeta}>Sıralı</span>
                                            <strong>Sıralı Tur</strong>
                                            <span>
                                                Plakalar numara sırasıyla gelir.
                                            </span>
                                        </span>

                                        <span className={styles.gameModeArrow} aria-hidden="true">→</span>
                                    </Link>

                                    <Link
                                        href="/game/random-plate"
                                        className={styles.gameModeCard}
                                    >
                                        <span className={styles.gameModeIcon} aria-hidden="true">
                                            ?
                                        </span>

                                        <span className={styles.gameModeContent}>
                                            <span className={styles.gameModeMeta}>Karışık</span>
                                            <strong>Karışık Tur</strong>
                                            <span>
                                                Her soruda rastgele bir plaka gelir.
                                            </span>
                                        </span>

                                        <span className={styles.gameModeArrow} aria-hidden="true">→</span>
                                    </Link>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </section>
        </main>
    );
}
