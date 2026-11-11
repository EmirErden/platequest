import { describe, expect, it } from "vitest";

import { provinces } from "@/data/provinces";
import {
    applyGameAction,
    getCurrentProvince,
    isGameAction,
    type GameAction,
    type GameActionResult,
} from "@/lib/game-actions";
import {
    initialTurkeyPlateProgress,
    type TurkeyPlateProgress,
} from "@/lib/game-state";

function start(): TurkeyPlateProgress {
    return initialTurkeyPlateProgress("ordered-plate");
}

// Testlerde "kabul edilmeli" beklentisini kısaltır.
function accepted(result: GameActionResult): TurkeyPlateProgress {
    if (!result.ok) {
        throw new Error(`Eylem reddedildi: ${result.reason}`);
    }

    return result.progress;
}

function apply(
    progress: TurkeyPlateProgress,
    ...actions: GameAction[]
): TurkeyPlateProgress {
    return actions.reduce(
        (current, action) => accepted(applyGameAction(current, action)),
        progress
    );
}

function answerCurrent(progress: TurkeyPlateProgress): GameAction {
    return { type: "answer", provinceName: getCurrentProvince(progress).name };
}

function playAll(progress: TurkeyPlateProgress): TurkeyPlateProgress {
    let current = progress;

    for (let i = 0; i < provinces.length; i++) {
        current = apply(current, answerCurrent(current));
    }

    return current;
}

describe("correct_name", () => {
    it("isim aşamasından harita aşamasına geçer", () => {
        expect(apply(start(), { type: "correct_name" }).phase).toBe("map");
    });

    it("harita aşamasında reddedilir", () => {
        const onMap = apply(start(), { type: "correct_name" });

        expect(applyGameAction(onMap, { type: "correct_name" })).toEqual({
            ok: false,
            reason: "wrong_phase",
        });
    });
});

describe("letter_hint", () => {
    it("bir harf açar, sayacı ve ceza sayacını artırır", () => {
        const result = apply(start(), { type: "letter_hint" });

        expect(result.nameHintCount).toBe(1);
        expect(result.letterHintsUsed).toBe(1);
        expect(result.usedHintForCurrentProvince).toBe(true);
    });

    it("il adının harf sayısından fazla açılamaz", () => {
        const nameLength = Array.from(getCurrentProvince(start()).name).length;
        const allLetters = apply(
            start(),
            ...Array.from({ length: nameLength }, () => ({
                type: "letter_hint" as const,
            }))
        );

        expect(allLetters.letterHintsUsed).toBe(nameLength);
        expect(applyGameAction(allLetters, { type: "letter_hint" })).toEqual({
            ok: false,
            reason: "no_more_hints",
        });
    });

    it("harita aşamasında reddedilir", () => {
        const onMap = apply(start(), { type: "correct_name" });

        expect(applyGameAction(onMap, { type: "letter_hint" })).toEqual({
            ok: false,
            reason: "wrong_phase",
        });
    });
});

describe("map_hint", () => {
    it("önce bölge, sonra komşu ipucu sayılır", () => {
        const onMap = apply(start(), { type: "correct_name" });
        const region = apply(onMap, { type: "map_hint" });
        const neighbors = apply(region, { type: "map_hint" });

        expect(region.mapHintLevel).toBe(1);
        expect(region.regionHintsUsed).toBe(1);
        expect(region.neighborHintsUsed).toBe(0);

        expect(neighbors.mapHintLevel).toBe(2);
        expect(neighbors.regionHintsUsed).toBe(1);
        expect(neighbors.neighborHintsUsed).toBe(1);
    });

    it("ikiden fazla seviye yok", () => {
        const maxed = apply(
            start(),
            { type: "correct_name" },
            { type: "map_hint" },
            { type: "map_hint" }
        );

        expect(applyGameAction(maxed, { type: "map_hint" })).toEqual({
            ok: false,
            reason: "no_more_hints",
        });
    });

    it("isim aşamasında reddedilir", () => {
        expect(applyGameAction(start(), { type: "map_hint" })).toEqual({
            ok: false,
            reason: "wrong_phase",
        });
    });
});

describe("answer", () => {
    it("doğru il sıradakine geçer ve ipucu durumunu sıfırlar", () => {
        const withHints = apply(
            start(),
            { type: "letter_hint" },
            { type: "correct_name" },
            { type: "map_hint" }
        );
        const firstName = getCurrentProvince(withHints).name;
        const result = apply(withHints, answerCurrent(withHints));

        expect(result.currentIndex).toBe(1);
        expect(result.completedProvinces).toEqual([firstName]);
        expect(result.phase).toBe("name");
        expect(result.nameHintCount).toBe(0);
        expect(result.mapHintLevel).toBe(0);
        expect(result.usedHintForCurrentProvince).toBe(false);
        // Toplam ipucu sayaçları ilden ile taşınır.
        expect(result.letterHintsUsed).toBe(1);
        expect(result.regionHintsUsed).toBe(1);
    });

    it("isim aşamasında haritadan doğrudan doğru il de kabul edilir", () => {
        expect(apply(start(), answerCurrent(start())).currentIndex).toBe(1);
    });

    it("yanlış il reddedilir, durum değişmez", () => {
        const progress = start();

        expect(
            applyGameAction(progress, {
                type: "answer",
                provinceName: provinces[5].name,
            })
        ).toEqual({ ok: false, reason: "wrong_province" });
    });

    it("tamamlanmış il tekrar tıklanırsa reddedilir", () => {
        const first = getCurrentProvince(start()).name;
        const afterFirst = apply(start(), answerCurrent(start()));

        expect(
            applyGameAction(afterFirst, { type: "answer", provinceName: first })
        ).toEqual({ ok: false, reason: "already_completed" });
    });

    it("ipucusuz seri artar, ipucu kullanılınca sıfırlanır", () => {
        const twoClean = apply(
            start(),
            answerCurrent(start()),
        );
        const afterTwo = apply(twoClean, answerCurrent(twoClean));

        expect(afterTwo.hintFreeStreak).toBe(2);

        const hinted = apply(afterTwo, { type: "letter_hint" });
        const afterHinted = apply(hinted, answerCurrent(hinted));

        expect(afterHinted.hintFreeStreak).toBe(0);
    });

    it("81. il oyunu bitirir; indeks son ilde kalır", () => {
        const finished = playAll(start());

        expect(finished.isGameComplete).toBe(true);
        expect(finished.currentIndex).toBe(provinces.length - 1);
        expect(finished.completedProvinces).toHaveLength(provinces.length);
    });

    it("rastgele sırada da sıradaki il beklenir", () => {
        const random = initialTurkeyPlateProgress("random-plate");
        const expected = provinces[random.provinceOrder[0]].name;

        expect(getCurrentProvince(random).name).toBe(expected);
        expect(apply(random, answerCurrent(random)).completedProvinces).toEqual([
            expected,
        ]);
    });
});

describe("bitmiş oyun", () => {
    it.each<GameAction>([
        { type: "correct_name" },
        { type: "letter_hint" },
        { type: "map_hint" },
        { type: "answer", provinceName: provinces[0].name },
    ])("$type reddedilir", (action) => {
        expect(applyGameAction(playAll(start()), action)).toEqual({
            ok: false,
            reason: "game_complete",
        });
    });
});

it("girdi durumunu değiştirmez (saf fonksiyon)", () => {
    const progress = start();
    const snapshot = structuredClone(progress);

    applyGameAction(progress, answerCurrent(progress));
    applyGameAction(progress, { type: "letter_hint" });

    expect(progress).toEqual(snapshot);
});

describe("isGameAction", () => {
    it.each([
        { type: "correct_name" },
        { type: "letter_hint" },
        { type: "map_hint" },
        { type: "answer", provinceName: "Ankara" },
    ])("geçerli: $type", (value) => {
        expect(isGameAction(value)).toBe(true);
    });

    it.each([
        ["null", null],
        ["dizi", []],
        ["bilinmeyen tip", { type: "skip" }],
        ["fazladan alan", { type: "letter_hint", count: 5 }],
        ["il adı yok", { type: "answer" }],
        ["boş il adı", { type: "answer", provinceName: "" }],
        ["sayı il adı", { type: "answer", provinceName: 6 }],
        ["çok uzun il adı", { type: "answer", provinceName: "a".repeat(65) }],
    ])("geçersiz: %s", (_, value) => {
        expect(isGameAction(value)).toBe(false);
    });
});
