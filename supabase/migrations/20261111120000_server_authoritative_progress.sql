-- Oyun ilerlemesini artık sadece sunucu yazıyor (sunucu-otoriter ilerleme).
--
-- Önce: tarayıcı user_game_progress'e kendi oturumuyla doğrudan yazıyordu;
-- /api/game/finish de istemcinin bildirdiği ipucu sayılarına güveniyordu.
-- Şimdi: her eylem /api/game/action'da doğrulanıp service role ile yazılıyor,
-- /api/game/finish sonucu bu kayıttan hesaplıyor. Kullanıcı kendi kaydını
-- sadece okuyabilir.

-- Sunucu (service role) ilerlemeyi okuyup yazabilsin. DELETE gerekmiyor:
-- yeniden başlatma kaydın üzerine yazıyor (upsert).
GRANT SELECT, INSERT, UPDATE ON TABLE "public"."user_game_progress" TO "service_role";

-- Kullanıcının doğrudan yazma yetkileri kaldırılıyor (SELECT kalıyor).
-- TRUNCATE Supabase varsayılanından geliyordu; yazma yetkisi olduğu için o da gidiyor.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE "public"."user_game_progress" FROM "authenticated";

-- Yetki olmadan işe yaramayan yazma policy'leri de kaldırılıyor ki şema
-- "kullanıcı yazabilir" izlenimi vermesin. Okuma policy'si kalıyor.
DROP POLICY "Users can insert own game progress" ON "public"."user_game_progress";
DROP POLICY "Users can update own game progress" ON "public"."user_game_progress";
DROP POLICY "Users can delete own game progress" ON "public"."user_game_progress";
