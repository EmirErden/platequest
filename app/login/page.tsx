"use client";

import { SubmitEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Toast from "@/components/toast/Toast";
import { createClient } from "@/lib/supabase/client";
import styles from "./page.module.css";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const router = useRouter();

    const handleSubmit = async (
        event: SubmitEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        setError("");
        setIsLoading(true);

        const supabase = createClient();

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
            setIsLoading(false);
            return;
        }

        router.push("/");
        router.refresh();
    };

    return (
        <main className={styles.page}>
            <Toast message={error} onDismissAction={() => setError("")} />
            <section className={styles.card}>
                <p className={styles.eyebrow}>Plaka Peşinde</p>
                <h1 className={styles.title}>Tekrar Hoş Geldin</h1>
                <p className={styles.description}>
                    Kaldığın yerden Türkiye&apos;yi keşfetmeye devam et.
                </p>

                <form className={styles.form} onSubmit={handleSubmit}>
                    <div className={styles.field}>
                        <label htmlFor="email">E-posta</label>

                        <input
                            id="email"
                            type="email"
                            autoComplete="email"
                            value={email}
                            onChange={(event) => {
                                setEmail(event.target.value);
                                setError("");
                            }}
                            required
                        />
                    </div>

                    <div className={styles.field}>
                        <label htmlFor="password">Şifre</label>

                        <input
                            id="password"
                            type="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(event) => {
                                setPassword(event.target.value);
                                setError("");
                            }}
                            required
                        />
                    </div>

                    <div className={styles.forgotPassword}>
                        <Link href="/forgot-password">
                            Şifremi unuttum
                        </Link>
                    </div>

                    <button
                        className={styles.submitButton}
                        type="submit"
                        disabled={isLoading}
                    >
                        {isLoading ? "Giriş yapılıyor..." : "Giriş Yap"}
                    </button>
                </form>

                <p className={styles.footerText}>
                    Henüz hesabın yok mu?{" "}
                    <Link href="/register">Kayıt ol</Link>
                </p>
            </section>
        </main>
    );
}
