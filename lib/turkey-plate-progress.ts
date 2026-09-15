"use client";

import { provinces } from "@/data/provinces";
import { createClient } from "@/lib/supabase/client";

export type TurkeyPlateProgress = {
    version: 1;
    currentIndex: number;
    phase: "name" | "map";
    completedProvinces: string[];
    isGameComplete: boolean;
    hintFreeStreak: number;
    usedHintForCurrentProvince: boolean;
};

export function initialTurkeyPlateProgress(): TurkeyPlateProgress {
    return {
        version: 1,
        currentIndex: 0,
        phase: "name",
        completedProvinces: [],
        isGameComplete: false,
        hintFreeStreak: 0,
        usedHintForCurrentProvince: false,
    };
}

export function parseTurkeyPlateProgress(
    value: unknown
): TurkeyPlateProgress {
    if (!value || typeof value !== "object") {
        return initialTurkeyPlateProgress();
    }

    const progress = value as Record<string, unknown>;

    if (
        (progress.version !== undefined && progress.version !== 1) ||
        !Number.isInteger(progress.currentIndex) ||
        (progress.currentIndex as number) < 0 ||
        (progress.currentIndex as number) >= provinces.length ||
        typeof progress.isGameComplete !== "boolean" ||
        !Array.isArray(progress.completedProvinces) ||
        (
            progress.phase !== undefined &&
            progress.phase !== "name" &&
            progress.phase !== "map"
        )
    ) {
        return initialTurkeyPlateProgress();
    }

    const currentIndex = progress.currentIndex as number;
    const isGameComplete = progress.isGameComplete as boolean;
    const completedProvinces = progress.completedProvinces as unknown[];

    const completedCount = isGameComplete
        ? provinces.length
        : currentIndex;

    const hasInvalidCompletedProvinces =
        completedProvinces.length !== completedCount ||
        completedProvinces.some(
            (name, index) => name !== provinces[index]?.name
        );

    if (
        hasInvalidCompletedProvinces ||
        (isGameComplete && currentIndex !== provinces.length - 1)
    ) {
        return initialTurkeyPlateProgress();
    }

    return {
        version: 1,
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
    };
}

export async function loadTurkeyPlateProgress(): Promise<TurkeyPlateProgress> {
    const supabase = createClient();

    const { data, error } = await supabase
        .from("user_game_progress")
        .select("state")
        .eq("game_mode", "turkey_plate")
        .maybeSingle();

    if (error) {
        throw error;
    }

    if (!data) {
        return initialTurkeyPlateProgress();
    }

    return parseTurkeyPlateProgress(data.state);
}

export async function saveTurkeyPlateProgress(
    progress: TurkeyPlateProgress
): Promise<void> {
    const supabase = createClient();

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
        throw userError;
    }

    if (!user) {
        throw new Error("User is not authenticated.");
    }

    const { error } = await supabase
        .from("user_game_progress")
        .upsert(
            {
                user_id: user.id,
                game_mode: "turkey_plate",
                state: progress,
                status: progress.isGameComplete
                    ? "completed"
                    : "in_progress",
                updated_at: new Date().toISOString(),
            },
            {
                onConflict: "user_id,game_mode",
            }
        );

    if (error) {
        throw error;
    }
}

export async function deleteTurkeyPlateProgress(): Promise<void> {
    const supabase = createClient();

    const { error } = await supabase
        .from("user_game_progress")
        .delete()
        .eq("game_mode", "turkey_plate");

    if (error) {
        throw error;
    }
}