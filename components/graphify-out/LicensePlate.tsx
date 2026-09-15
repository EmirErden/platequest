import styles from "./LicensePlate.module.css";

type LicensePlateProps = {
    value: string;
    className?: string;
};

export default function LicensePlate({value, className = ""}: LicensePlateProps) {
    return (
        <div className={`${styles.plate} ${className}`} aria-label={`${value} plaka kodu`}>
            <span className={styles.country}>TR</span>
            <span className={styles.value}>{value}</span>
        </div>
    );
}
