"use client";

import { SubmitEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Toast from "@/components/toast/Toast";
import { createClient } from "@/lib/supabase/client";
import styles from "./page.module.css";

export default function ResetPasswordPage() {
    const router = useRouter();

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [hasSubmitted, setHasSubmitted] = useState(false);

    const [touchedFields, setTouchedFields] = useState({
        password: false,
        confirmPassword: false,
    });

    const isPasswordValid =
        password.length >= 8 &&
        /[A-Za-z]/.test(password) &&
        /\d/.test(password);

    const doPasswordsMatch =
        password === confirmPassword;

    const isFormValid =
        isPasswordValid &&
        confirmPassword.length > 0 &&
        doPasswordsMatch;

    const showPasswordError =
        (hasSubmitted || touchedFields.password) &&
        !isPasswordValid;

    const hasPasswordRequirementsError =
        password.length > 0 &&
        !isPasswordValid;

    const showConfirmPasswordRequired =
        (hasSubmitted || touchedFields.confirmPassword) &&
        confirmPassword.length === 0;

    const showPasswordMismatch =
        confirmPassword.length > 0 &&
        !doPasswordsMatch;

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
        setHasSubmitted(true);

        if (!isFormValid) {
            return;
        }

        setIsLoading(true);

        const supabase = createClient();

        const { error } = await supabase.auth.updateUser({
            password,
        });

        if (error) {
            setError("Şifre güncellenirken bir hata oluştu.");
            setIsLoading(false);
            return;
        }

        await supabase.auth.signOut();

        router.replace("/login");
    };

    return (
        <main className={styles.page}>
            <Toast message={error} onDismissAction={() => setError("")} />
            <section className={styles.card}>
                <p className={styles.eyebrow}>
                    Plaka Peşinde
                </p>

                <h1 className={styles.title}>
                    Yeni Şifreni Belirle
                </h1>

                <p className={styles.description}>
                    Hesabın için kullanmak istediğin yeni şifreyi
                    iki kez gir.
                </p>

                <form
                    className={styles.form}
                    noValidate
                    onSubmit={handleSubmit}
                >
                    <div className={styles.field}>
                        <label htmlFor="password">
                            Yeni şifre
                        </label>

                        <input
                            id="password"
                            type="password"
                            autoComplete="new-password"
                            value={password}
                            onChange={(event) => {
                                setPassword(event.target.value);
                                setError("");
                            }}
                            onBlur={() =>
                                markFieldAsTouched("password")
                            }
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

                        <div className={styles.validationSlot} aria-live="polite">
                            {hasPasswordRequirementsError && (
                                <p
                                    id="password-requirements"
                                    className={styles.passwordHintInvalid}
                                >
                                    En az 8 karakter, 1 harf ve 1 rakam gerekli.
                                </p>
                            )}

                            {showPasswordError && !password && (
                                <p className={styles.requiredMessage}>
                                    Şifre girmek zorunludur.
                                </p>
                            )}
                        </div>
                    </div>

                    <div className={styles.field}>
                        <label htmlFor="confirmPassword">
                            Yeni şifre tekrar
                        </label>

                        <input
                            id="confirmPassword"
                            type="password"
                            autoComplete="new-password"
                            value={confirmPassword}
                            onChange={(event) => {
                                setConfirmPassword(event.target.value);
                                setError("");
                            }}
                            onBlur={() =>
                                markFieldAsTouched(
                                    "confirmPassword"
                                )
                            }
                            aria-invalid={
                                showConfirmPasswordRequired ||
                                showPasswordMismatch
                            }
                            className={
                                showConfirmPasswordRequired ||
                                showPasswordMismatch
                                    ? styles.inputInvalid
                                    : ""
                            }
                            required
                        />

                        <div className={styles.validationSlot} aria-live="polite">
                            {showConfirmPasswordRequired && (
                                <p className={styles.requiredMessage}>
                                    Şifreyi tekrar girmek zorunludur.
                                </p>
                            )}

                            {showPasswordMismatch && (
                                <p className={styles.requiredMessage}>
                                    Şifreler uyuşmuyor.
                                </p>
                            )}
                        </div>
                    </div>

                    <button
                        className={styles.submitButton}
                        type="submit"
                        disabled={isLoading}
                    >
                        {isLoading
                            ? "Güncelleniyor..."
                            : "Şifreyi güncelle"}
                    </button>
                </form>

                <p className={styles.footerText}>
                    <Link href="/login">
                        Giriş ekranına dön
                    </Link>
                </p>
            </section>
        </main>
    );
}
