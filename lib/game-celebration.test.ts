import { describe, expect, it } from "vitest";

import { provinces } from "@/data/provinces";
import { getCelebrationMessage } from "@/lib/game-celebration";

const names = provinces.map((province) => province.name);

// Hiçbir bölgeyi tamamlamayan, verilen sayıda il: her bölgeden en fazla
// (bölgedeki il sayısı - 1) il alınır.
function provincesWithoutFullRegion(count: number): string[] {
    const takenPerRegion = new Map<string, number>();
    const regionSizes = new Map<string, number>();

    for (const province of provinces) {
        regionSizes.set(
            province.region,
            (regionSizes.get(province.region) ?? 0) + 1
        );
    }

    const result: string[] = [];

    for (const province of provinces) {
        const taken = takenPerRegion.get(province.region) ?? 0;

        if (
            result.length < count &&
            taken < (regionSizes.get(province.region) ?? 0) - 1
        ) {
            result.push(province.name);
            takenPerRegion.set(province.region, taken + 1);
        }
    }

    if (result.length !== count) {
        throw new Error(`Bölge tamamlamadan ${count} il seçilemedi.`);
    }

    return result;
}

describe("getCelebrationMessage", () => {
    it("81 il bitince Türkiye turu mesajı", () => {
        expect(getCelebrationMessage(names, 0, names[80])).toBe(
            "✦ Türkiye turu tamamlandı!"
        );
    });

    it("bir bölgenin son ili tamamlanınca bölge mesajı", () => {
        const region = provinces[0].region;
        const regionNames = provinces
            .filter((province) => province.region === region)
            .map((province) => province.name);
        const lastName = regionNames[regionNames.length - 1];

        expect(getCelebrationMessage(regionNames, 0, lastName)).toBe(
            `✦ ${region} turu tamamlandı!`
        );
    });

    it("bölge mesajı ipucusuz seri mesajından önce gelir", () => {
        const region = provinces[0].region;
        const regionNames = provinces
            .filter((province) => province.region === region)
            .map((province) => province.name);

        expect(
            getCelebrationMessage(
                regionNames,
                5,
                regionNames[regionNames.length - 1]
            )
        ).toBe(`✦ ${region} turu tamamlandı!`);
    });

    it.each([
        [3, "✦ İz sürücü: 3 il ipucusuz!"],
        [5, "✦ Kusursuz beşli: 5 il ipucusuz!"],
        [10, "✦ Hafızadan haritaya: 10 il ipucusuz!"],
    ])("%i ipucusuz seri mesajı", (streak, expected) => {
        const completed = provincesWithoutFullRegion(streak);

        expect(
            getCelebrationMessage(
                completed,
                streak,
                completed[completed.length - 1]
            )
        ).toBe(expected);
    });

    it.each([
        [3, "✦ Isınma turu tamamlandı!"],
        [10, "✦ Plaka avcısı: İlk 10 il tamam!"],
        [41, "✦ Yarı yol: Türkiye'nin yarısı tamam!"],
        [71, "✦ Son düzlük: Son 10 il kaldı!"],
    ])("%i il kilometre taşı mesajı", (count, expected) => {
        const completed = provincesWithoutFullRegion(count);

        expect(
            getCelebrationMessage(
                completed,
                0,
                completed[completed.length - 1]
            )
        ).toBe(expected);
    });

    it("özel bir durum yoksa null", () => {
        const completed = provincesWithoutFullRegion(4);

        expect(
            getCelebrationMessage(
                completed,
                1,
                completed[completed.length - 1]
            )
        ).toBeNull();
    });
});
