"use client";

import {useEffect, useRef, useState} from "react";
import styles from "./GamePanel.module.css";

type GamePanelProps = {
    plate: number;
    phase: "name" | "map";
    provinceName: string;
    onCorrectNameAction: () => void;
    onMapHintAction: () => void;
    mapHintLevel: number;
    neighbors: string[];
};

export default function GamePanel({
                                      plate,
                                      phase,
                                      provinceName,
                                      onCorrectNameAction,
                                      onMapHintAction,
                                      mapHintLevel,
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
            answer.toLocaleLowerCase("tr-TR") ===
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
                <div className={styles.plateBadge}>
                    {formattedPlate}
                </div>

                <h2>{provinceName}</h2>

                <p className={styles.panelDescription}>
                    {provinceName} ilini haritada bul.
                </p>

                <button
                    className={styles.secondaryButton}
                    type="button"
                    onClick={onMapHintAction}
                >
                    İpucu
                </button>

                <div className={styles.panelFeedback}>
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
            <div className={styles.plateBadge}>
                {formattedPlate}
            </div>

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

                    <button
                        className={styles.secondaryButton}
                        type="button"
                        onClick={() => {
                            setHintCount((current) =>
                                Math.min(
                                    current + 1,
                                    provinceName.length,
                                )
                            );
                        }}
                    >
                        İpucu
                    </button>
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