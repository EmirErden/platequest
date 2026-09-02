"use client";

import {useState} from "react";

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

    function handleSubmit() {
        if (answer.toLocaleLowerCase("tr-TR") === provinceName.toLocaleLowerCase("tr-TR")) {
            setMessage("");
            setAnswer("");
            setHintCount(0);
            onCorrectNameAction();
            return;
        }

        setMessage("Bu değil, tekrar dene.");

        setTimeout(() => {
            setMessage("");
        }, 1400);
    }

    if (phase === "map") {
        if (phase === "map") {
            return (
                <section className="game-panel">
                    <div className="plate-badge">{formattedPlate}</div>

                    <h2>{provinceName}</h2>

                    <p className="panel-description">
                        {provinceName} ilini haritada bul.
                    </p>

                    <button
                        className="secondary-button"
                        type="button"
                        onClick={onMapHintAction}
                    >
                        İpucu
                    </button>

                    <div className="panel-feedback">
                        {mapHintLevel >= 2 && (
                            <p className="hint-text">
                                Komşu iller: {neighbors.join(", ")}
                            </p>
                        )}
                    </div>
                </section>
            );
        }
    }

    return (
        <section className="game-panel">
            <div className="plate-badge">{formattedPlate}</div>

            <h2>Bu plaka hangi ile ait?</h2>

            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    handleSubmit();
                }}
            >
                <input
                    className="answer-input"
                    type="text"
                    placeholder="İl adını yaz"
                    value={answer}
                    onChange={(event) => {
                        setAnswer(event.target.value);
                    }}
                />

                <div className="button-row">
                    <button
                        className="primary-button"
                        type="submit"
                    >
                        Cevapla
                    </button>

                    <button
                        className="secondary-button"
                        type="button"
                        onClick={() => {
                            setHintCount((current) =>
                                Math.min(current + 1, provinceName.length),
                            );
                        }}
                    >
                        İpucu
                    </button>
                </div>
            </form>

            <div className="panel-feedback">
                {message ? (
                    <p className="feedback-message">{message}</p>
                ) : hintCount > 0 ? (
                    <p className="hint-text">{hintText}</p>
                ) : null}
            </div>
        </section>
    );
}