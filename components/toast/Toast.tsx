"use client";

import { useEffect } from "react";
import styles from "./Toast.module.css";

type ToastVariant = "error" | "warning";

type ToastProps = {
    message: string;
    variant?: ToastVariant;
    onDismissAction: () => void;
};

export default function Toast({
    message,
    variant = "error",
    onDismissAction,
}: ToastProps) {
    useEffect(() => {
        if (!message) {
            return;
        }

        const timeout = window.setTimeout(onDismissAction, 4000);

        return () => window.clearTimeout(timeout);
    }, [message, onDismissAction]);

    if (!message) {
        return null;
    }

    return (
        <div className={`${styles.toast} ${styles[variant]}`} role="alert">
            <span>{message}</span>
            <button
                type="button"
                className={styles.closeButton}
                onClick={onDismissAction}
                aria-label="Bildirimi kapat"
            >
                ×
            </button>
        </div>
    );
}
