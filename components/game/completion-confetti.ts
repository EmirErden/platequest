import confetti from "canvas-confetti";

// Oyun bitişinde iki yandan konfeti. Azaltılmış hareket tercihinde çalışmaz.
export function fireCompletionConfetti() {
    const defaults = {
        spread: 70,
        ticks: 200,
        gravity: 1,
        decay: 0.95,
        startVelocity: 40,
        disableForReducedMotion: true,
    };

    confetti({
        ...defaults,
        particleCount: 100,
        angle: 60,
        origin: { x: 0, y: 0.65 },
    });

    confetti({
        ...defaults,
        particleCount: 100,
        angle: 120,
        origin: { x: 1, y: 0.65 },
    });
}
