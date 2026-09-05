import styles from "./ResetGameDialog.module.css";

type ResetGameDialogProps = {
    onCancel: () => void;
    onConfirm: () => void;
};

export default function ResetGameDialog({
                                            onCancel,
                                            onConfirm,
                                        }: ResetGameDialogProps) {
    return (
        <div className={styles.dialogOverlay}>
            <div className={styles.dialog}>
                <div className={styles.dialogIcon}>!</div>

                <h2>İlerlemeyi sıfırla?</h2>

                <p>
                    Tamamladığın tüm iller silinecek ve oyun baştan başlayacak.
                </p>

                <div className={styles.dialogActions}>
                    <button
                        type="button"
                        className={styles.cancelButton}
                        onClick={onCancel}
                    >
                        Vazgeç
                    </button>

                    <button
                        type="button"
                        className={styles.confirmResetButton}
                        onClick={onConfirm}
                    >
                        Sıfırla
                    </button>
                </div>
            </div>
        </div>
    );
}