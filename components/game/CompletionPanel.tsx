import Link from "next/link";

import { formatDuration } from "@/lib/game-timing";
import type { GameResult } from "@/types/game";

import styles from "./CompletionPanel.module.css";

type CompletionPanelProps = {
    provinceCount: number;
    // Sunucudan resmî sonuç gelene kadar null ("Hesaplanıyor…").
    gameResult: GameResult | null;
    onRestartAction: () => void;
};

export default function CompletionPanel({
    provinceCount,
    gameResult,
    onRestartAction,
}: CompletionPanelProps) {
    return (
        <section className={styles.completionPanel}>
            <p className={styles.completionEyebrow}>
                Tur tamamlandı
            </p>

            <div className={styles.completionIcon}>
                ✓
            </div>

            <h2>Türkiye tamamlandı!</h2>

            <p className={styles.completionText}>
                81 ilin plaka kodunu ve
                haritadaki yerini tamamladın.
            </p>

            <div className={styles.completionProgress}>
                <strong>
                    {provinceCount} / {provinceCount}
                </strong>
                <span>il keşfedildi</span>
            </div>

            <div
                className={styles.finalTimeCard}
                aria-live="polite"
            >
                <span>Final süre</span>
                <strong>
                    {gameResult
                        ? formatDuration(gameResult.finalTimeMs)
                        : "Hesaplanıyor…"}
                </strong>
            </div>

            {gameResult ? (
                <dl className={styles.resultTimes}>
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
                <p className={styles.resultPending}>
                    Resmî sonucun hazırlanıyor.
                </p>
            )}

            <div className={styles.completionActions}>
                <button
                    className={styles.restartButton}
                    type="button"
                    onClick={onRestartAction}
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
    );
}
