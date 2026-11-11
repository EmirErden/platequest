// Oyun durumunun tipi, başlangıç durumu ve DB'den gelen JSON'un doğrulanması.
// Saf modül: hem tarayıcı (iyimser güncelleme) hem sunucu (API route'ları)
// kullanıyor; buraya Supabase istemcisi ya da "use client" ekleme.
import { provinces } from "@/data/provinces";
import type { GameMode, GameSessionInfo } from "@/types/game";

export type TurkeyPlateProgress = {
    version: 2;

    currentIndex: number;
    phase: "name" | "map";

    completedProvinces: string[];
    isGameComplete: boolean;

    hintFreeStreak: number;
    usedHintForCurrentProvince: boolean;

    provinceOrder: number[];

    sessionId: string | null;
    startedAt: string | null;

    letterHintsUsed: number;
    regionHintsUsed: number;
    neighborHintsUsed: number;

    nameHintCount: number;
    mapHintLevel: number;
};

export function initialTurkeyPlateProgress(gameMode: GameMode): TurkeyPlateProgress {
    return {
        version: 2,
        currentIndex: 0,
        phase: "name",
        completedProvinces: [],
        isGameComplete: false,
        hintFreeStreak: 0,
        usedHintForCurrentProvince: false,
        provinceOrder: createProvinceOrder(gameMode),
        sessionId: null,
        startedAt: null,
        letterHintsUsed: 0,
        regionHintsUsed: 0,
        neighborHintsUsed: 0,
        nameHintCount: 0,
        mapHintLevel: 0,
    };
}

export function withGameSession(
    progress: TurkeyPlateProgress,
    session: GameSessionInfo
): TurkeyPlateProgress {
    return {
        ...progress,
        sessionId: session.sessionId,
        startedAt: session.startedAt,
    };
}

export function parseTurkeyPlateProgress(
    value: unknown,
    gameMode: GameMode
): TurkeyPlateProgress {
    if (!value || typeof value !== "object") {
        return initialTurkeyPlateProgress(gameMode);
    }

    const progress = value as Record<string, unknown>;

    if (
        (
            progress.version !== undefined &&
            progress.version !== 1 &&
            progress.version !== 2
        ) ||
        !Number.isInteger(progress.currentIndex) ||
        (progress.currentIndex as number) < 0 ||
        (progress.currentIndex as number) >= provinces.length ||
        typeof progress.isGameComplete !== "boolean" ||
        !Array.isArray(progress.completedProvinces) ||
        !Array.isArray(progress.provinceOrder) ||
        (
            progress.phase !== undefined &&
            progress.phase !== "name" &&
            progress.phase !== "map"
        )
    ) {
        return initialTurkeyPlateProgress(gameMode);
    }

    const currentIndex = progress.currentIndex as number;
    const isGameComplete = progress.isGameComplete as boolean;
    const completedProvinces = progress.completedProvinces as unknown[];
    const provinceOrder = progress.provinceOrder as unknown[];

    const completedCount = isGameComplete
        ? provinces.length
        : currentIndex;

    const hasInvalidCompletedProvinces =
        completedProvinces.length !== completedCount ||
        completedProvinces.some(
            (name, index) =>
                name !== provinces[provinceOrder[index] as number]?.name
        );

    if (
        hasInvalidCompletedProvinces ||
        (isGameComplete && currentIndex !== provinces.length - 1)
    ) {
        return initialTurkeyPlateProgress(gameMode);
    }

    const hasInvalidProvinceOrder =
        provinceOrder.length !== provinces.length ||
        provinceOrder.some(
            (value) =>
                !Number.isInteger(value) ||
                (value as number) < 0 ||
                (value as number) >= provinces.length
        ) ||
        new Set(provinceOrder).size !== provinces.length;


    if (hasInvalidProvinceOrder) {
        return initialTurkeyPlateProgress(gameMode);
    }

    const hasInvalidOrderedProvinceOrder =
        gameMode === "ordered-plate" &&
        provinceOrder.some(
            (provinceIndex, index) => provinceIndex !== index
        );

    if (hasInvalidOrderedProvinceOrder) {
        return initialTurkeyPlateProgress(gameMode);
    }

    const session = parseSession(progress);
    const currentProvince = provinces[provinceOrder[currentIndex] as number];
    const isVersionTwo = progress.version === 2;

    return {
        version: 2,
        currentIndex,
        phase:
            progress.phase === "map"
                ? "map"
                : "name",
        completedProvinces: completedProvinces as string[],
        isGameComplete,
        hintFreeStreak:
            Number.isInteger(progress.hintFreeStreak) &&
            (progress.hintFreeStreak as number) >= 0
                ? (progress.hintFreeStreak as number)
                : 0,
        usedHintForCurrentProvince:
            progress.usedHintForCurrentProvince === true,
        provinceOrder: provinceOrder as number[],
        sessionId: session?.sessionId ?? null,
        startedAt: session?.startedAt ?? null,
        letterHintsUsed: isVersionTwo
            ? readNonNegativeInteger(progress.letterHintsUsed)
            : 0,
        regionHintsUsed: isVersionTwo
            ? readNonNegativeInteger(progress.regionHintsUsed)
            : 0,
        neighborHintsUsed: isVersionTwo
            ? readNonNegativeInteger(progress.neighborHintsUsed)
            : 0,
        nameHintCount:
            !isGameComplete &&
            isVersionTwo &&
            isIntegerInRange(
                progress.nameHintCount,
                Array.from(currentProvince.name).length
            )
                ? (progress.nameHintCount as number)
                : 0,
        mapHintLevel:
            !isGameComplete &&
            isVersionTwo &&
            isIntegerInRange(progress.mapHintLevel, 2)
                ? (progress.mapHintLevel as number)
                : 0,
    };
}

function createProvinceOrder(gameMode: GameMode): number[] {
    const order = provinces.map((_, index) => index);

    if (gameMode === "ordered-plate") {
        return order;
    }

    for (let i = order.length - 1; i > 0; i--) {
        const randomIndex = Math.floor(Math.random() * (i + 1));

        [order[i], order[randomIndex]] = [
            order[randomIndex],
            order[i],
        ];
    }

    return order;
}

function parseSession(
    progress: Record<string, unknown>
): GameSessionInfo | null {
    if (
        typeof progress.sessionId !== "string" ||
        typeof progress.startedAt !== "string" ||
        !Number.isFinite(Date.parse(progress.startedAt))
    ) {
        return null;
    }

    return {
        sessionId: progress.sessionId,
        startedAt: progress.startedAt,
    };
}

function readNonNegativeInteger(value: unknown): number {
    return Number.isInteger(value) && (value as number) >= 0
        ? (value as number)
        : 0;
}

function isIntegerInRange(value: unknown, maximum: number): boolean {
    return (
        Number.isInteger(value) &&
        (value as number) >= 0 &&
        (value as number) <= maximum
    );
}
