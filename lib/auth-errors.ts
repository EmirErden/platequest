// Supabase Auth hata kodlarını kullanıcıya gösterilecek Türkçe mesajlara çevirir.
// Supabase'in kendi `error.message` metni İngilizce olduğu için ekrana basılmaz.
const AUTH_ERROR_MESSAGES: Record<string, string> = {
    invalid_credentials: "E-posta veya şifre hatalı.",
    email_not_confirmed:
        "E-posta adresin henüz doğrulanmamış. Gelen kutundaki doğrulama bağlantısına tıkla.",
    user_banned: "Bu hesap askıya alınmış.",
    user_not_found: "Bu bilgilere ait bir hesap bulunamadı.",
    user_already_exists: "Bu e-posta ile zaten bir hesap var. Giriş yapmayı deneyebilirsin.",
    email_exists: "Bu e-posta ile zaten bir hesap var. Giriş yapmayı deneyebilirsin.",
    email_address_invalid: "Geçerli bir e-posta adresi gir.",
    signup_disabled: "Şu anda yeni kayıt alınmıyor.",
    weak_password: "Bu şifre çok zayıf, daha güçlü bir şifre seç.",
    same_password: "Yeni şifren eski şifrenle aynı olamaz.",
    current_password_mismatch: "Mevcut şifren hatalı.",
    current_password_required: "Mevcut şifreni girmen gerekiyor.",
    reauthentication_needed: "Bu işlem için tekrar giriş yapman gerekiyor.",
    session_not_found: "Oturumun sona ermiş. Lütfen tekrar giriş yap.",
    session_expired: "Oturumun sona ermiş. Lütfen tekrar giriş yap.",
    over_request_rate_limit: "Çok fazla deneme yaptın. Biraz bekleyip tekrar dene.",
    over_email_send_rate_limit:
        "Çok fazla e-posta gönderildi. Birkaç dakika bekleyip tekrar dene.",
};

export function getAuthErrorMessage(
    code: string | undefined,
    fallback = "Bir hata oluştu. Lütfen tekrar dene."
) {
    return (code && AUTH_ERROR_MESSAGES[code]) || fallback;
}
