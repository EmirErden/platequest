"use client";

import { SubmitEvent, useState } from "react";

import ProfileMenu from "@/components/ProfileMenu";
import { createClient } from "@/lib/supabase/client";

import styles from "./Profile.module.css";

type ProfileProps = { email: string; username: string };

export default function Profile({ email, username }: ProfileProps) {
    const [currentPassword, setCurrentPassword] = useState("");
    const [password, setPassword] = useState("");
    const [confirmation, setConfirmation] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const isPasswordValid = password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password);

    const handleSubmit = async (
        event: SubmitEvent<HTMLFormElement>
    )=> {
        event.preventDefault();

        setError("");
        setMessage("");

        if (!isPasswordValid) {
            setError("Şifren en az 8 karakter, 1 harf ve 1 rakam içermeli.");
            return;
        }

        if (password !== confirmation) {
            setError("Şifreler birbiriyle eşleşmiyor.");
            return;
        }

        setIsSaving(true);

        const { error: updateError } = await createClient().auth.updateUser({
            password,
            current_password: currentPassword,
        });

        setIsSaving(false);

        if (updateError) {
            setError(updateError.message);
            return;
        }

        setCurrentPassword("");
        setPassword("");
        setConfirmation("");
        setMessage("Şifren başarıyla güncellendi.");
    };

    return (
        <main className={styles.page}>
            <div className={styles.profileMenu}><ProfileMenu username={username} /></div>

            <section className={styles.card}>
                <p className={styles.eyebrow}>Hesabım</p>
                <h1>Profil</h1>
                <p className={styles.description}>Hesap bilgilerini görüntüle ve şifreni güncelle.</p>

                <dl className={styles.details}>
                    <div><dt>Kullanıcı adı</dt><dd>{username}</dd></div>
                    <div><dt>E-posta</dt><dd>{email}</dd></div>
                </dl>

                <form className={styles.form} onSubmit={handleSubmit}>
                    <h2>Şifre değiştir</h2>
                    <div className={styles.field}>
                        <label htmlFor="current-password">Mevcut şifre</label>
                        <input id="current-password" type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required />
                    </div>
                    <div className={styles.field}>
                        <label htmlFor="new-password">Yeni şifre</label>
                        <input id="new-password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
                        <p>En az 8 karakter, 1 harf ve 1 rakam.</p>
                    </div>
                    <div className={styles.field}>
                        <label htmlFor="confirm-password">Yeni şifre (tekrar)</label>
                        <input id="confirm-password" type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required />
                    </div>
                    {error && <p className={styles.error} role="alert">{error}</p>}
                    {message && <p className={styles.success} role="status">{message}</p>}
                    <button type="submit" disabled={isSaving}>{isSaving ? "Güncelleniyor..." : "Şifreyi Güncelle"}</button>
                </form>
            </section>
        </main>
    );
}
