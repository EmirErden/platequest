"use client";

import { SubmitEvent, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import styles from "./page.module.css";

export default function RegisterPage() {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const isPasswordValid =
        password.length >= 8 &&
        /[A-Za-z]/.test(password) &&
        /\d/.test(password);

    const handleSubmit = async (
        event: SubmitEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        setError("");
        setSuccess("");
        setIsLoading(true);

        const supabase = createClient();

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`,
                data: {
                    username,
                },
            },
        });

        if (error) {
            setError(error.message);
            setIsLoading(false);
            return;
        }

        setSuccess("Kayıt başarılı. Email adresini doğrulamayı unutma.");
        setIsLoading(false);
    };

    return (
        <main className={styles.page}>
            <section className={styles.card}>
                <p className={styles.eyebrow}>Plaka Peşinde</p>
                <h1 className={styles.title}>Yeni bir rota aç</h1>
                <p className={styles.description}>
                    Hesabını oluştur, ilerlemeni güvenle kaydet.
                </p>

                <form className={styles.form} onSubmit={handleSubmit}>
                    <div className={styles.field}>
                        <label htmlFor="username">Kullanıcı adı</label>

                        <input
                            id="username"
                            type="text"
                            autoComplete="username"
                            value={username}
                            onChange={(event) => setUsername(event.target.value)}
                            required
                        />
                    </div>

                    <div className={styles.field}>
                        <label htmlFor="email">E-posta</label>

                        <input
                            id="email"
                            type="email"
                            autoComplete="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            required
                        />
                    </div>

                    <div className={styles.field}>
                        <label htmlFor="password">Şifre</label>

                        <input
                            id="password"
                            type="password"
                            autoComplete="new-password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            minLength={8}
                            aria-describedby="password-requirements"
                            required
                        />

                        <p
                            id="password-requirements"
                            className={`${styles.passwordHint} ${
                                password && !isPasswordValid
                                    ? styles.passwordHintInvalid
                                    : ""
                            }`}
                        >
                            En az 8 karakter, en az 1 harf ve 1 rakam içermeli.
                        </p>
                    </div>

                    {error && (
                        <p className={styles.errorMessage} role="alert">
                            {error}
                        </p>
                    )}

                    {success && (
                        <p className={styles.successMessage} role="status">
                            {success}
                        </p>
                    )}

                    <button
                        className={styles.submitButton}
                        type="submit"
                        disabled={isLoading || !isPasswordValid}
                    >
                        {isLoading ? "Kaydediliyor..." : "Kayıt Ol"}
                    </button>
                </form>

                <p className={styles.footerText}>
                    Zaten hesabın var mı?{" "}
                    <Link href="/login">Giriş yap</Link>
                </p>
            </section>
        </main>
    );
}
