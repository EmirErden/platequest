"use client";

import { useRef, useState } from "react";

export type PenaltyFeedback = {
    id: number;
    penaltyMs: number;
};

// Süre sayacının yanında çıkan "+5 sn" animasyonları. Üst üste ipucu
// alınırsa animasyonlar sıraya girer; her biri bitince sıradaki gösterilir.
export function usePenaltyFeedback() {
    const [penaltyFeedback, setPenaltyFeedback] =
        useState<PenaltyFeedback | null>(null);

    const queueRef = useRef<number[]>([]);
    const isActiveRef = useRef(false);
    const idRef = useRef(0);

    function showPenaltyFeedback(penaltyMs: number) {
        isActiveRef.current = true;
        idRef.current += 1;
        setPenaltyFeedback({
            id: idRef.current,
            penaltyMs,
        });
    }

    function enqueuePenaltyFeedback(penaltyMs: number) {
        if (isActiveRef.current) {
            queueRef.current.push(penaltyMs);
            return;
        }

        showPenaltyFeedback(penaltyMs);
    }

    // Animasyonun onAnimationEnd'ine bağlanır.
    function handlePenaltyFeedbackEnd() {
        const nextPenalty = queueRef.current.shift();

        if (nextPenalty !== undefined) {
            showPenaltyFeedback(nextPenalty);
            return;
        }

        isActiveRef.current = false;
        setPenaltyFeedback(null);
    }

    function resetPenaltyFeedback() {
        queueRef.current = [];
        isActiveRef.current = false;
        setPenaltyFeedback(null);
    }

    return {
        penaltyFeedback,
        enqueuePenaltyFeedback,
        handlePenaltyFeedbackEnd,
        resetPenaltyFeedback,
    };
}
