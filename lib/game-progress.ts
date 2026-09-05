"use client";

import {useSyncExternalStore} from "react";
import {provinces} from "@/data/provinces";

export type GameProgress = {
    version: 1;
    currentIndex: number;
    phase: "name" | "map";
    completedProvinces: string[];
    isGameComplete: boolean;
    hintFreeStreak: number;
    usedHintForCurrentProvince: boolean;
};

const storageKey = "platequest-progress";
const listeners = new Set<() => void>();
let snapshot: GameProgress | undefined;

export function initialProgress(): GameProgress {
    return {version: 1, currentIndex: 0, phase: "name", completedProvinces: [], isGameComplete: false, hintFreeStreak: 0, usedHintForCurrentProvince: false};
}

export function parseProgress(raw: string | null): GameProgress {
    try {
        if (!raw) return initialProgress();
        const value = JSON.parse(raw);
        if (!value || typeof value !== "object" ||
            (value.version !== undefined && value.version !== 1) ||
            !Number.isInteger(value.currentIndex) || value.currentIndex < 0 ||
            value.currentIndex >= provinces.length ||
            typeof value.isGameComplete !== "boolean" ||
            !Array.isArray(value.completedProvinces) ||
            (value.phase !== undefined && value.phase !== "name" && value.phase !== "map")) {
            return initialProgress();
        }
        // This game completes provinces in plate order. Reject inconsistent saves.
        const count = value.isGameComplete ? provinces.length : value.currentIndex;
        if (value.completedProvinces.length !== count ||
            value.completedProvinces.some((name: unknown, index: number) => name !== provinces[index]?.name) ||
            (value.isGameComplete && value.currentIndex !== provinces.length - 1)) {
            return initialProgress();
        }
        return {
            version: 1,
            currentIndex: value.currentIndex,
            phase: value.phase ?? "name",
            completedProvinces: value.completedProvinces,
            isGameComplete: value.isGameComplete,
            hintFreeStreak: Number.isInteger(value.hintFreeStreak) && value.hintFreeStreak >= 0 ? value.hintFreeStreak : 0,
            usedHintForCurrentProvince: value.usedHintForCurrentProvince === true,
        };
    } catch {
        return initialProgress();
    }
}

function readProgress(): GameProgress {
    try {
        return parseProgress(window.localStorage.getItem(storageKey));
    } catch {
        return initialProgress();
    }
}

function getSnapshot() {
    snapshot ??= readProgress();
    return snapshot;
}

function getServerSnapshot() {
    return null;
}

function subscribe(listener: () => void) {
    listeners.add(listener);
    function onStorage(event: StorageEvent) {
        if (event.key !== storageKey && event.key !== null) return;
        snapshot = readProgress();
        listeners.forEach(notify => notify());
    }
    window.addEventListener("storage", onStorage);
    return () => {
        listeners.delete(listener);
        window.removeEventListener("storage", onStorage);
    };
}

export function updateProgress(update: (current: GameProgress) => GameProgress) {
    snapshot = update(getSnapshot());
    try {
        window.localStorage.setItem(storageKey, JSON.stringify(snapshot));
    } catch {
        // Keep playing with the in-memory snapshot if browser storage is unavailable.
    }
    listeners.forEach(notify => notify());
    return snapshot;
}

export function resetProgress() {
    updateProgress(initialProgress);
}

export function useGameProgress() {
    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
