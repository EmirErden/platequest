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
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [touchedFields, setTouchedFields] = useState({
        username: false,
        email: false,
        password: false,
    });

    const isPasswordValid =
        password.length >= 8 &&
        /[A-Za-z]/.test(password) &&
        /\d/.test(password);

    const isUsernameValid = username.trim().length > 0;
    const isEmailValid = email.trim().length > 0;
    const isFormValid =
        isUsernameValid && isEmailValid && isPasswordValid;

    const showUsernameError =
        (hasSubmitted || touchedFields.username) &&
        !isUsernameValid;
    const showEmailError =
        (hasSubmitted || touchedFields.email) &&
        !isEmailValid;
    const showPasswordError =
        (hasSubmitted || touchedFields.password) &&
        !isPasswordValid;
    const hasPasswordRequirementsError =
        password.length > 0 && !isPasswordValid;

    const markFieldAsTouched = (
        field: keyof typeof touchedFields
    ) => {
        setTouchedFields((current) => ({
            ...current,
            [field]: true,
        }));
    };

    const handleSubmit = async (
        event: SubmitEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        setError("");
        setSuccess("");

        setHasSubmitted(true);

        if (!isFormValid) {
            return;
        }

        setIsLoading(true);

        const supabase = createClient();

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`,
                data: {
                    username: username.trim(),
                },
            },
        });

        if (error) {
            setError(
                error.message === "Database error saving new user"
                    ? "Bu kullanıcı adı zaten kullanılıyor. Lütfen başka bir kullanıcı adı seç."
                    : error.message
            );
            setIsLoading(false);
            return;
        }

        if (data.user?.identities?.length === 0) {
            setError(
                "Bu e-posta ile zaten bir hesap var. Giriş yapmayı deneyebilirsin."
            );
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
                <h1 className={styles.title}>Hesabını oluştur</h1>
                <p className={styles.description}>
                    Hesabını oluştur, ilerlemeni güvenle kaydet.
                </p>

                <form
                    className={styles.form}
                    noValidate
                    onSubmit={handleSubmit}
                >
                    <div className={styles.field}>
                        <label htmlFor="username">Kullanıcı adı</label>

                        <input
                            id="username"
                            type="text"
                            autoComplete="username"
                            value={username}
                            onChange={(event) => setUsername(event.target.value)}
                            onBlur={() => markFieldAsTouched("username")}
                            aria-invalid={showUsernameError}
                            className={
                                showUsernameError
                                    ? styles.inputInvalid
                                    : ""
                            }
                            required
                        />

                        {showUsernameError && (
                            <p className={styles.requiredMessage}>
                                Kullanıcı adı girmek zorunludur.
                            </p>
                        )}
                    </div>

                    <div className={styles.field}>
                        <label htmlFor="email">E-posta</label>

                        <input
                            id="email"
                            type="email"
                            autoComplete="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            onBlur={() => markFieldAsTouched("email")}
                            aria-invalid={showEmailError}
                            className={
                                showEmailError
                                    ? styles.inputInvalid
                                    : ""
                            }
                            required
                        />

                        {showEmailError && (
                            <p className={styles.requiredMessage}>
                                E-posta girmek zorunludur.
                            </p>
                        )}
                    </div>

                    <div className={styles.field}>
                        <label htmlFor="password">Şifre</label>

                        <input
                            id="password"
                            type="password"
                            autoComplete="new-password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            onBlur={() => markFieldAsTouched("password")}
                            minLength={8}
                            aria-describedby={
                                hasPasswordRequirementsError
                                    ? "password-requirements"
                                    : undefined
                            }
                            aria-invalid={
                                showPasswordError ||
                                hasPasswordRequirementsError
                            }
                            className={
                                showPasswordError ||
                                hasPasswordRequirementsError
                                    ? styles.inputInvalid
                                    : ""
                            }
                            required
                        />

                        {hasPasswordRequirementsError && (
                            <p
                                id="password-requirements"
                                className={styles.passwordHintInvalid}
                            >
                                En az 8 karakter, en az 1 harf ve 1 rakam içermeli.
                            </p>
                        )}

                        {showPasswordError && !password && (
                            <p className={styles.requiredMessage}>
                                Şifre girmek zorunludur.
                            </p>
                        )}
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
                        disabled={isLoading}
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
