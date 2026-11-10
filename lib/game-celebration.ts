import { provinces } from "@/data/provinces";

// İl tamamlandığında gösterilecek özel kutlama mesajı; özel bir durum yoksa null.
export function getCelebrationMessage(
    completedProvinces: string[],
    hintFreeStreak: number,
    provinceName: string
): string | null {
    const completedCount = completedProvinces.length;

    const completedRegion = provinces.find(
        (province) => province.name === provinceName
    )?.region;

    if (completedCount === provinces.length) {
        return "✦ Türkiye turu tamamlandı!";
    }

    if (
        completedRegion &&
        provinces
            .filter((province) => province.region === completedRegion)
            .every((province) =>
                completedProvinces.includes(province.name)
            )
    ) {
        return `✦ ${completedRegion} turu tamamlandı!`;
    }

    if (hintFreeStreak === 10) {
        return "✦ Hafızadan haritaya: 10 il ipucusuz!";
    }

    if (hintFreeStreak === 5) {
        return "✦ Kusursuz beşli: 5 il ipucusuz!";
    }

    if (hintFreeStreak === 3) {
        return "✦ İz sürücü: 3 il ipucusuz!";
    }

    if (completedCount === 71) {
        return "✦ Son düzlük: Son 10 il kaldı!";
    }

    if (completedCount === 41) {
        return "✦ Yarı yol: Türkiye'nin yarısı tamam!";
    }

    if (completedCount === 10) {
        return "✦ Plaka avcısı: İlk 10 il tamam!";
    }

    if (completedCount === 3) {
        return "✦ Isınma turu tamamlandı!";
    }

    return null;
}
