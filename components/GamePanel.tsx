"use client";

import {useEffect, useRef, useState} from "react";
import styles from "./GamePanel.module.css";
import LicensePlate from "@/components/LicensePlate";

type GamePanelProps = {
    plate: number;
    phase: "name" | "map";
    provinceName: string;
    onCorrectNameAction: () => void;
    onMapHintAction: () => void;
    onNameHintAction: () => void;
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
                                      mapHintLevel,
                                      region,
                                      neighbors,
                                  }: GamePanelProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    const [answer, setAnswer] = useState("");
    const [message, setMessage] = useState("");
    const [hintCount, setHintCount] = useState(0);

    const formattedPlate = plate.toString().padStart(2, "0");

    const hintText = provinceName
        .split("")
        .map((letter, index) => {
            if (letter === " ") {
                return " ";
            }

            return index < hintCount ? letter : "_";
        })
        .join(" ");

    useEffect(() => {
        inputRef.current?.focus();
    }, [provinceName]);

    function handleSubmit() {
        if (
            answer.trim().toLocaleLowerCase("tr-TR") ===
            provinceName.toLocaleLowerCase("tr-TR")
        ) {
            setMessage("");
            setAnswer("");
            setHintCount(0);
            onCorrectNameAction();
            return;
        }

        setMessage("Hmm, tekrar dene!");

        setTimeout(() => {
            setMessage("");
        }, 2000);
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

            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    handleSubmit();
                }}
            >
                <div className={styles.inputWrapper}>
                    <input
                        ref={inputRef}
                        lang="tr"
                        className={`${styles.answerInput} ${
                            message ? styles.answerInputError : ""
                        }`}
                        type="text"
                        placeholder="İl Adını Yaz"
                        value={answer}
                        onChange={(event) => {
                            setAnswer(event.target.value);
                        }}
                    />

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

                    {hintCount < provinceName.length && (
                        <button
                            className={styles.secondaryButton}
                            type="button"
                            onClick={() => {
                                onNameHintAction();
                                setHintCount((current) =>
                                    Math.min(current + 1, provinceName.length)
                                );
                            }}
                        >
                            Bir harf aç
                        </button>
                    )}
                </div>
            </form>

            <div className={styles.panelFeedback}>
                {hintCount > 0 ? (
                    <p
                        lang="tr"
                        className={styles.hintText}
                    >
                        {hintText}
                    </p>
                ) : null}
            </div>
        </section>
    );
}
