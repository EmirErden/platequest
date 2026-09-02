"use client";

import {useState} from "react";
import GamePanel from "@/components/GamePanel";
import {provinces} from "@/data/provinces";
import TurkeyMap from "@/components/TurkeyMap";

type GamePhase = "name" | "map";

export default function Home() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [phase, setPhase] = useState<GamePhase>("name");
    const [mapMessage, setMapMessage] = useState("");
    const [wrongProvince, setWrongProvince] = useState<string | null>(null);
    const [mapHintLevel, setMapHintLevel] = useState(0);
    const [completedProvinces, setCompletedProvinces] = useState<string[]>([]);

    const currentProvince = provinces[currentIndex];

    const highlightedProvinces = mapHintLevel >= 1
        ? provinces
            .filter((province) => province.region === currentProvince.region)
            .map((province) => province.name)
        : [];

    function handleCorrectName() {
        setPhase("map");
        setMapMessage("");
    }

    function handleProvinceClick(provinceName: string) {
        if (phase !== "map") {
            return;
        }

        if (provinceName !== currentProvince.name) {
            setMapMessage("Bu değil, tekrar dene.");
            setWrongProvince(provinceName);

            setTimeout(() => {
                setWrongProvince(null);
            }, 500);

            return;
        }

        setMapMessage("");

        setCompletedProvinces((current) => [
            ...current,
            currentProvince.name,
        ]);

        const nextIndex = currentIndex + 1;

        if (nextIndex >= provinces.length) {
            return;
        }

        setCurrentIndex(nextIndex);
        setPhase("name");
        setMapHintLevel(0);
    }

    return (
        <main className="game-page">
            <header className="game-header">
                <div>
                    <h1>PlateQuest</h1>
                    <p>Türkiye'yi plaka plaka keşfet.</p>
                </div>

                <div className="progress">
                    {completedProvinces.length} / {provinces.length}
                </div>
            </header>

            <section className="map-section">
                <TurkeyMap
                    onProvinceClickAction={handleProvinceClick}
                    wrongProvince={wrongProvince}
                    highlightedProvinces={highlightedProvinces}
                    completedProvinces={completedProvinces}
                />
            </section>

            <section className="panel-wrapper">
                {mapMessage && <p className="map-message">{mapMessage}</p>}

                <GamePanel
                    plate={currentProvince.plate}
                    provinceName={currentProvince.name}
                    phase={phase}
                    onCorrectNameAction={handleCorrectName}
                    onMapHintAction={() => {
                        setMapHintLevel((current) => Math.min(current + 1, 2));
                    }}
                    mapHintLevel={mapHintLevel}
                    neighbors={currentProvince.neighbors}
                />
            </section>
        </main>
    );
}