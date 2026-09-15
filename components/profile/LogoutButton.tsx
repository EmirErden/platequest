"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "./LogoutButton.module.css";

type LogoutButtonProps = {
    className?: string;
};

export default function LogoutButton({
    className,
}: LogoutButtonProps) {
    const router = useRouter();
    const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!error) {
            return;
        }

        const timeout = window.setTimeout(() => setError(""), 5000);

        return () => window.clearTimeout(timeout);
    }, [error]);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        setError("");

        const supabase = createClient();

        const { error: signOutError } = await supabase.auth.signOut();

        setIsLoggingOut(false);

        if (signOutError) {
            setIsConfirmationOpen(false);
            setError("Çıkış yapılamadı. Tekrar deneyin.");
            return;
        }

        router.push("/");
        router.refresh();
    };

    return (
        <>
            {error && (
                <p className={styles.errorNotification} role="alert">
                    {error}
                </p>
            )}

            <button
                type="button"
                className={className ?? styles.button}
                onClick={() => {
                    setError("");
                    setIsConfirmationOpen(true);
                }}
            >
                Çıkış Yap
            </button>

            {isConfirmationOpen && (
                <div className={styles.dialogOverlay}>
                    <section
                        className={styles.dialog}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="logout-dialog-title"
                    >
                        <div className={styles.dialogIcon}>?</div>

                        <h2 id="logout-dialog-title">Çıkış yapmak istiyor musun?</h2>

                        <p>
                            Oyunun kayıtlı ilerlemesi hesabında kalacak.
                        </p>

                        <div className={styles.dialogActions}>
                            <button
                                type="button"
                                className={styles.cancelButton}
                                disabled={isLoggingOut}
                                onClick={() => setIsConfirmationOpen(false)}
                            >
                                Vazgeç
                            </button>

                            <button
                                type="button"
                                className={styles.confirmButton}
                                disabled={isLoggingOut}
                                onClick={handleLogout}
                            >
                                {isLoggingOut ? "Çıkış yapılıyor..." : "Çıkış Yap"}
                            </button>
                        </div>
                    </section>
                </div>
            )}
        </>
    );
}
