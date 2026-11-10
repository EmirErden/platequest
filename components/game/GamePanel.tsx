"use client";

import {useEffect, useRef, useState} from "react";
import styles from "./GamePanel.module.css";
import LicensePlate from "@/components/game/LicensePlate";

type GamePanelProps = {
    plate: number;
    phase: "name" | "map";
    provinceName: string;
    onCorrectNameAction: () => void;
    onMapHintAction: () => void;
    onNameHintAction: (nextHintCount: number) => void;
    nameHintCount: number;
    mapHintLevel: number;
    region: string;
    neighbors: string[];
};

export default function GamePanel({
                                      plate,
                                      phase,
                                      provinceName,
                                      onCorrectNameAction,
                                      onMapHintAction,
                                      onNameHintAction,
                                      nameHintCount,
                                      mapHintLevel,
                                      region,
                                      neighbors,
                                  }: GamePanelProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    const [answer, setAnswer] = useState("");
    const [message, setMessage] = useState("");

    const formattedPlate = plate.toString().padStart(2, "0");
    const provinceCharacters = Array.from(provinceName);
    const hintPrefix = provinceCharacters
        .slice(0, nameHintCount)
        .join("");

    useEffect(() => {
        inputRef.current?.focus();
    }, [provinceName]);

    function handleSubmit() {
        const completedAnswer =
            hintPrefix + answer.slice(hintPrefix.length);

        if (
            completedAnswer.trim().toLocaleLowerCase("tr-TR") ===
            provinceName.toLocaleLowerCase("tr-TR")
        ) {
            setMessage("");
            setAnswer("");
            onCorrectNameAction();
            return;
        }

        setMessage("Hmm, tekrar dene!");

        setTimeout(() => {
            setMessage("");
        }, 2000);
    }

    function revealNextHint() {
        const nextHintCount = Math.min(
            nameHintCount + 1,
            provinceCharacters.length
        );
        const nextHintPrefix = provinceCharacters
            .slice(0, nextHintCount)
            .join("");
        onNameHintAction(nextHintCount);
        setAnswer((currentAnswer) => {
            const suffixCharacters = Array.from(
                currentAnswer.slice(hintPrefix.length)
            );

            return nextHintPrefix + suffixCharacters.slice(1).join("");
        });
    }

    if (phase === "map") {
        return (
            <section
                key={`${provinceName}-${phase}`}
                className={`${styles.gamePanel} ${styles.gamePanelEnter}`}
            >
                <div className={styles.stepper} aria-label="Oyunun ikinci aşaması">
                    <span className={styles.completedStep}>1. İl adını bul</span>
                    <span className={styles.activeStep}>2. Haritada göster</span>
                </div>

                <LicensePlate value={formattedPlate} className={styles.plateBadge} />

                <h2>{provinceName}</h2>

                <p className={styles.panelDescription}>
                    {provinceName} ilini haritada bul.
                </p>

                {mapHintLevel < 2 && (
                    <button
                        className={styles.secondaryButton}
                        type="button"
                        onClick={onMapHintAction}
                    >
                        {mapHintLevel === 0 ? "Bölgeyi göster" : "Komşuları göster"}
                    </button>
                )}

                <div className={styles.panelFeedback}>
                    {mapHintLevel >= 1 && (
                        <p className={styles.hintText}>Bölge: {region}</p>
                    )}
                    {mapHintLevel >= 2 && (
                        <p className={styles.hintText}>
                            Komşu iller: {neighbors.join(", ")}
                        </p>
                    )}
                </div>
            </section>
        );
    }

    return (
        <section
            key={`${provinceName}-${phase}`}
            className={`${styles.gamePanel} ${styles.gamePanelEnter}`}
        >
            <div className={styles.stepper} aria-label="Oyunun birinci aşaması">
                <span className={styles.activeStep}>1. İl adını bul</span>
                <span>2. Haritada göster</span>
            </div>

            <LicensePlate value={formattedPlate} className={styles.plateBadge} />

            <h2>Bu plaka hangi ile ait?</h2>

            <p className={styles.panelDescription}>
                İl adını yaz veya haritadaki yerini seç.
            </p>

            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    handleSubmit();
                }}
            >
                <div className={styles.inputWrapper}>
                    <div
                        className={`${styles.answerField} ${hintPrefix ? styles.answerFieldWithHint : ""} ${message ? styles.answerInputError : ""}`}
                    >
                        {hintPrefix && (
                            <span
                                lang="tr"
                                aria-hidden="true"
                                className={styles.hintPrefix}
                            >
                                {hintPrefix}
                            </span>
                        )}
                        <input
                            ref={inputRef}
                            lang="tr"
                            className={styles.answerInput}
                            type="text"
                            placeholder={hintPrefix ? "" : "İl Adını Yaz"}
                            value={answer.slice(hintPrefix.length)}
                            onChange={(event) =>
                                setAnswer(hintPrefix + event.target.value)
                            }
                        />
                    </div>

                    <span className={styles.errorMessage}>
                        {message}
                    </span>
                </div>

                <div className={styles.buttonRow}>
                    <button
                        className={styles.primaryButton}
                        type="submit"
                    >
                        Cevapla
                    </button>

                    {nameHintCount < provinceCharacters.length && (
                        <button
                            className={styles.secondaryButton}
                            type="button"
                            onClick={revealNextHint}
                        >
                            Bir harf aç
                        </button>
                    )}
                </div>
            </form>
        </section>
    );
}
