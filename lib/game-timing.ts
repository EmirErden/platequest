export const LETTER_HINT_PENALTY_MS = 5_000;
export const REGION_HINT_PENALTY_MS = 10_000;
export const NEIGHBOR_HINT_PENALTY_MS = 15_000;

export const MAX_LETTER_HINTS_USED = 1_000;
export const MAX_REGION_HINTS_USED = 81;
export const MAX_NEIGHBOR_HINTS_USED = 81;

export type HintUsage = {
    letterHintsUsed: number;
    regionHintsUsed: number;
    neighborHintsUsed: number;
};

export function calculatePenaltyTimeMs(hints: HintUsage): number {
    return (
        hints.letterHintsUsed * LETTER_HINT_PENALTY_MS +
        hints.regionHintsUsed * REGION_HINT_PENALTY_MS +
        hints.neighborHintsUsed * NEIGHBOR_HINT_PENALTY_MS
    );
}

export function isValidHintUsage(value: unknown): value is HintUsage {
    if (!value || typeof value !== "object") {
        return false;
    }

    const hints = value as Record<string, unknown>;

    return (
        isIntegerInRange(
            hints.letterHintsUsed,
            MAX_LETTER_HINTS_USED
        ) &&
        isIntegerInRange(
            hints.regionHintsUsed,
            MAX_REGION_HINTS_USED
        ) &&
        isIntegerInRange(
            hints.neighborHintsUsed,
            MAX_NEIGHBOR_HINTS_USED
        )
    );
}

export function formatDuration(durationMs: number): string {
    const totalSeconds = Math.max(
        0,
        Math.floor(durationMs / 1_000)
    );
    const seconds = totalSeconds % 60;
    const totalMinutes = Math.floor(totalSeconds / 60);
    const minutes = totalMinutes % 60;
    const hours = Math.floor(totalMinutes / 60);

    const minuteAndSecond = `${minutes
        .toString()
        .padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;

    return hours > 0
        ? `${hours.toString().padStart(2, "0")}:${minuteAndSecond}`
        : minuteAndSecond;
}

export function formatPenaltyFeedback(penaltyMs: number): string {
    return `+${penaltyMs / 1_000} sn`;
}

function isIntegerInRange(value: unknown, maximum: number): boolean {
    return (
        Number.isInteger(value) &&
        (value as number) >= 0 &&
        (value as number) <= maximum
    );
}
