"use client";

import { SubmitEvent, useState } from "react";
import Link from "next/link";
import Toast from "@/components/toast/Toast";
import { createClient } from "@/lib/supabase/client";
import styles from "./page.module.css";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();

        setError(null);
        setIsLoading(true);

        const supabase = createClient();

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
        });

        setIsLoading(false);

        if (error) {
            setError("Sıfırlama bağlantısı gönderilirken bir hata oluştu.");
            return;
        }

        setSuccess(true);
    };

    return (
        <main className={styles.page}>
            <Toast message={error ?? ""} onDismissAction={() => setError(null)} />
            <section className={styles.card}>
                <p className={styles.eyebrow}>Plaka Peşinde</p>

                <h1 className={styles.title}>Şifreni Sıfırla</h1>

                <p className={styles.description}>
                    Hesabına bağlı e-posta adresini gir. Sana şifreni
                    sıfırlayabileceğin bir bağlantı gönderelim.
                </p>

                {success ? (
                    <div className={styles.success}>
                        <h2>E-postanı kontrol et</h2>

                        <p>
                            Eğer bu e-posta adresine bağlı bir hesap varsa,
                            şifre sıfırlama bağlantısını gönderdik.
                        </p>

                        <Link href="/login">
                            Giriş ekranına dön
                        </Link>
                    </div>
                ) : (
                    <>
                        <form onSubmit={handleSubmit} className={styles.form}>
                            <div className={styles.field}>
                                <label htmlFor="email">E-posta</label>
                                <input
                                    id="email"
                                    type="email"
                                    autoComplete="email"
                                    value={email}
                                    onChange={(event) => {
                                        setEmail(event.target.value);
                                        setError(null);
                                    }}
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                className={styles.submitButton}
                                disabled={isLoading}
                            >
                                {isLoading
                                    ? "Gönderiliyor..."
                                    : "Sıfırlama Bağlantısı Gönder"}
                            </button>
                        </form>

                        <p className={styles.footerText}>
                            Şifreni hatırladın mı?{" "}
                            <Link href="/login">Giriş yap</Link>
                        </p>
                    </>
                )}
            </section>
        </main>
    );
}
