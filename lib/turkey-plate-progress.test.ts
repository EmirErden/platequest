import { describe, expect, it } from "vitest";

import { provinces } from "@/data/provinces";
import {
    initialTurkeyPlateProgress,
    parseTurkeyPlateProgress,
    type TurkeyPlateProgress,
    withGameSession,
} from "@/lib/turkey-plate-progress";
import type { GameMode } from "@/types/game";

const SESSION = {
    sessionId: "6f1c2a8e-3b4d-4c5e-9f60-7a8b9c0d1e2f",
    startedAt: "2026-11-11T10:00:00.000Z",
};

// `completedCount` il bitirilmiş, tutarlı bir ilerleme.
function progressAfter(
    completedCount: number,
    gameMode: GameMode = "ordered-plate"
): TurkeyPlateProgress {
    const initial = withGameSession(
        initialTurkeyPlateProgress(gameMode),
        SESSION
    );
    const isGameComplete = completedCount === provinces.length;

    return {
        ...initial,
        currentIndex: isGameComplete
            ? provinces.length - 1
            : completedCount,
        isGameComplete,
        completedProvinces: initial.provinceOrder
            .slice(0, completedCount)
            .map((index) => provinces[index].name),
    };
}

// DB'ye yazılıp okunmuş gibi: JSON'a çevir ve geri al.
function roundTrip(value: unknown): unknown {
    return JSON.parse(JSON.stringify(value));
}

function expectReset(result: TurkeyPlateProgress) {
    expect(result.currentIndex).toBe(0);
    expect(result.completedProvinces).toEqual([]);
    expect(result.sessionId).toBeNull();
}

describe("initialTurkeyPlateProgress", () => {
    it("sıralı modda 0..80 sırası", () => {
        expect(initialTurkeyPlateProgress("ordered-plate").provinceOrder).toEqual(
            provinces.map((_, index) => index)
        );
    });

    it("rastgele modda 81 ilin her biri tam bir kez", () => {
        const order = initialTurkeyPlateProgress("random-plate").provinceOrder;

        expect([...order].sort((a, b) => a - b)).toEqual(
            provinces.map((_, index) => index)
        );
    });
});

describe("parseTurkeyPlateProgress", () => {
    it.each([null, undefined, "x", 42, []])(
        "nesne olmayanı başlangıç durumuna çevirir: %s",
        (value) => {
            expect(parseTurkeyPlateProgress(value, "ordered-plate")).toEqual(
                initialTurkeyPlateProgress("ordered-plate")
            );
        }
    );

    it("geçerli ilerlemeyi olduğu gibi korur", () => {
        const progress = {
            ...progressAfter(12),
            phase: "map" as const,
            hintFreeStreak: 4,
            letterHintsUsed: 7,
            regionHintsUsed: 2,
            neighborHintsUsed: 1,
            nameHintCount: 2,
            mapHintLevel: 1,
        };

        expect(
            parseTurkeyPlateProgress(roundTrip(progress), "ordered-plate")
        ).toEqual(progress);
    });

    it("rastgele modda karışık sırayı korur", () => {
        const progress = progressAfter(30, "random-plate");

        expect(
            parseTurkeyPlateProgress(roundTrip(progress), "random-plate")
        ).toEqual(progress);
    });

    it("bitmiş oyunu korur, ipucu seviyelerini sıfırlar", () => {
        const progress = {
            ...progressAfter(provinces.length),
            nameHintCount: 3,
            mapHintLevel: 2,
        };
        const result = parseTurkeyPlateProgress(
            roundTrip(progress),
            "ordered-plate"
        );

        expect(result.isGameComplete).toBe(true);
        expect(result.completedProvinces).toHaveLength(provinces.length);
        expect(result.nameHintCount).toBe(0);
        expect(result.mapHintLevel).toBe(0);
    });

    describe("tutarsız durumda sıfırlar", () => {
        it("tamamlanan iller sırayla uyuşmuyor", () => {
            const progress = progressAfter(5);
            progress.completedProvinces[2] = "Ankara Değil";

            expectReset(
                parseTurkeyPlateProgress(roundTrip(progress), "ordered-plate")
            );
        });

        it("tamamlanan il sayısı indeksle uyuşmuyor", () => {
            const progress = { ...progressAfter(5), currentIndex: 6 };

            expectReset(
                parseTurkeyPlateProgress(roundTrip(progress), "ordered-plate")
            );
        });

        it("sıralı modda karışık sıra", () => {
            const progress = progressAfter(0, "random-plate");

            expectReset(
                parseTurkeyPlateProgress(roundTrip(progress), "ordered-plate")
            );
        });

        it("sırada tekrar eden il", () => {
            const progress = progressAfter(0);
            progress.provinceOrder[1] = 0;

            expectReset(
                parseTurkeyPlateProgress(roundTrip(progress), "ordered-plate")
            );
        });

        it("bitmiş oyunda indeks son ilde değil", () => {
            const progress = {
                ...progressAfter(provinces.length),
                currentIndex: 79,
            };

            expectReset(
                parseTurkeyPlateProgress(roundTrip(progress), "ordered-plate")
            );
        });

        it.each([
            ["bilinmeyen sürüm", { version: 3 }],
            ["geçersiz aşama", { phase: "quiz" }],
            ["aralık dışı indeks", { currentIndex: provinces.length }],
        ])("%s", (_, override) => {
            const progress = { ...progressAfter(0), ...override };

            expectReset(
                parseTurkeyPlateProgress(roundTrip(progress), "ordered-plate")
            );
        });
    });

    describe("tek alanı düzeltir, ilerlemeyi korur", () => {
        it("sürüm 1: ipucu sayaçları sıfırlanır", () => {
            const progress = {
                ...progressAfter(8),
                version: 1,
                letterHintsUsed: 4,
                nameHintCount: 1,
            };
            const result = parseTurkeyPlateProgress(
                roundTrip(progress),
                "ordered-plate"
            );

            expect(result.version).toBe(2);
            expect(result.currentIndex).toBe(8);
            expect(result.letterHintsUsed).toBe(0);
            expect(result.nameHintCount).toBe(0);
        });

        it("il adından uzun harf ipucu sayısı sıfırlanır", () => {
            const nameLength = Array.from(provinces[0].name).length;
            const result = parseTurkeyPlateProgress(
                roundTrip({ ...progressAfter(0), nameHintCount: nameLength + 1 }),
                "ordered-plate"
            );

            expect(result.nameHintCount).toBe(0);
        });

        it("aralık dışı harita ipucu seviyesi sıfırlanır", () => {
            const result = parseTurkeyPlateProgress(
                roundTrip({ ...progressAfter(0), mapHintLevel: 3 }),
                "ordered-plate"
            );

            expect(result.mapHintLevel).toBe(0);
        });

        it("negatif ipucu sayacı sıfırlanır", () => {
            const result = parseTurkeyPlateProgress(
                roundTrip({ ...progressAfter(3), regionHintsUsed: -2 }),
                "ordered-plate"
            );

            expect(result.regionHintsUsed).toBe(0);
            expect(result.currentIndex).toBe(3);
        });

        it("geçersiz başlangıç zamanında session düşer", () => {
            const result = parseTurkeyPlateProgress(
                roundTrip({ ...progressAfter(3), startedAt: "dün" }),
                "ordered-plate"
            );

            expect(result.sessionId).toBeNull();
            expect(result.startedAt).toBeNull();
            expect(result.currentIndex).toBe(3);
        });
    });
});
