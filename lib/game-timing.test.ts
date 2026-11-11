import { describe, expect, it } from "vitest";

import {
    calculatePenaltyTimeMs,
    formatDuration,
    formatPenaltyFeedback,
    isValidHintUsage,
    MAX_LETTER_HINTS_USED,
    MAX_NEIGHBOR_HINTS_USED,
    MAX_REGION_HINTS_USED,
} from "@/lib/game-timing";

describe("calculatePenaltyTimeMs", () => {
    it("ipucu yoksa ceza sıfır", () => {
        expect(
            calculatePenaltyTimeMs({
                letterHintsUsed: 0,
                regionHintsUsed: 0,
                neighborHintsUsed: 0,
            })
        ).toBe(0);
    });

    it("harf 5 sn, bölge 10 sn, komşu 15 sn ekler", () => {
        expect(
            calculatePenaltyTimeMs({
                letterHintsUsed: 3,
                regionHintsUsed: 2,
                neighborHintsUsed: 1,
            })
        ).toBe(3 * 5_000 + 2 * 10_000 + 1 * 15_000);
    });
});

describe("isValidHintUsage", () => {
    const valid = {
        letterHintsUsed: 0,
        regionHintsUsed: 0,
        neighborHintsUsed: 0,
    };

    it("sıfırları kabul eder", () => {
        expect(isValidHintUsage(valid)).toBe(true);
    });

    it("üst sınırların kendisini kabul eder", () => {
        expect(
            isValidHintUsage({
                letterHintsUsed: MAX_LETTER_HINTS_USED,
                regionHintsUsed: MAX_REGION_HINTS_USED,
                neighborHintsUsed: MAX_NEIGHBOR_HINTS_USED,
            })
        ).toBe(true);
    });

    it.each([
        ["üst sınırın üstü", { ...valid, regionHintsUsed: MAX_REGION_HINTS_USED + 1 }],
        ["negatif", { ...valid, letterHintsUsed: -1 }],
        ["ondalıklı", { ...valid, neighborHintsUsed: 1.5 }],
        ["string sayı", { ...valid, letterHintsUsed: "1" }],
        ["eksik alan", { letterHintsUsed: 0, regionHintsUsed: 0 }],
    ])("reddeder: %s", (_, value) => {
        expect(isValidHintUsage(value)).toBe(false);
    });

    it.each([null, undefined, "x", 42])("nesne olmayanı reddeder: %s", (value) => {
        expect(isValidHintUsage(value)).toBe(false);
    });
});

describe("formatDuration", () => {
    it.each([
        [0, "00:00"],
        [999, "00:00"],
        [59_999, "00:59"],
        [61_000, "01:01"],
        [3_599_000, "59:59"],
        [3_600_000, "01:00:00"],
        [3_661_000, "01:01:01"],
    ])("%i ms → %s", (durationMs, expected) => {
        expect(formatDuration(durationMs)).toBe(expected);
    });

    it("negatif süreyi 00:00 gösterir", () => {
        expect(formatDuration(-5_000)).toBe("00:00");
    });
});

describe("formatPenaltyFeedback", () => {
    it("milisaniyeyi saniye olarak yazar", () => {
        expect(formatPenaltyFeedback(5_000)).toBe("+5 sn");
        expect(formatPenaltyFeedback(15_000)).toBe("+15 sn");
    });
});
