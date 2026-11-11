import styles from "./ResetGameDialog.module.css";

type ResetGameDialogProps = {
    onCancelAction: () => void;
    onConfirmAction: () => void;
};

export default function ResetGameDialog({
                                            onCancelAction,
                                            onConfirmAction,
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
                        onClick={onCancelAction}
                    >
                        Vazgeç
                    </button>

                    <button
                        type="button"
                        className={styles.confirmResetButton}
                        onClick={onConfirmAction}
                    >
                        Sıfırla
                    </button>
                </div>
            </div>
        </div>
    );
}