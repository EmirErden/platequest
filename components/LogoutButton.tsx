"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "./LogoutButton.module.css";

export default function LogoutButton() {
    const router = useRouter();
    const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);

    const handleLogout = async () => {
        const supabase = createClient();

        await supabase.auth.signOut();

        router.push("/");
        router.refresh();
    };

    return (
        <>
            <button
                type="button"
                className={styles.button}
                onClick={() => setIsConfirmationOpen(true)}
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
                                onClick={() => setIsConfirmationOpen(false)}
                            >
                                Vazgeç
                            </button>

                            <button
                                type="button"
                                className={styles.confirmButton}
                                onClick={handleLogout}
                            >
                                Çıkış Yap
                            </button>
                        </div>
                    </section>
                </div>
            )}
        </>
    );
}
