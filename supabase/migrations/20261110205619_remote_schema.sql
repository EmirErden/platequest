SET local check_function_bodies = off;

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON SEQUENCES FROM "anon";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON SEQUENCES FROM "authenticated";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON SEQUENCES FROM "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON FUNCTIONS FROM "anon";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON FUNCTIONS FROM "authenticated";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON FUNCTIONS FROM "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON TABLES FROM "anon";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON TABLES FROM "authenticated";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON TABLES FROM "service_role";

CREATE TABLE "public"."game_results" (
  "id"                  uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "session_id"          uuid                     NOT NULL,
  "user_id"             uuid                     NOT NULL,
  "game_mode"           text                     NOT NULL,
  "play_time_ms"        bigint                   NOT NULL,
  "penalty_time_ms"     bigint                   NOT NULL DEFAULT 0,
  "final_time_ms"       bigint                   GENERATED ALWAYS AS ((play_time_ms + penalty_time_ms)) STORED,
  "letter_hints_used"   integer                  NOT NULL DEFAULT 0,
  "region_hints_used"   integer                  NOT NULL DEFAULT 0,
  "neighbor_hints_used" integer                  NOT NULL DEFAULT 0,
  "completed_at"        timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "game_results_letter_hints_non_negative" CHECK ((letter_hints_used >= 0)),
  CONSTRAINT "game_results_neighbor_hints_non_negative" CHECK ((neighbor_hints_used >= 0)),
  CONSTRAINT "game_results_penalty_time_non_negative" CHECK ((penalty_time_ms >= 0)),
  CONSTRAINT "game_results_pkey" PRIMARY KEY (id),
  CONSTRAINT "game_results_play_time_non_negative" CHECK ((play_time_ms >= 0)),
  CONSTRAINT "game_results_region_hints_non_negative" CHECK ((region_hints_used >= 0)),
  CONSTRAINT "game_results_session_id_key" UNIQUE (session_id)
);

ALTER TABLE "public"."game_results"
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "public"."game_results" FROM "anon";

CREATE TABLE "public"."game_sessions" (
  "id"          uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"     uuid                     NOT NULL,
  "game_mode"   text                     NOT NULL,
  "started_at"  timestamp with time zone NOT NULL DEFAULT now(),
  "finished_at" timestamp with time zone,
  "created_at"  timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "game_sessions_finished_after_started" CHECK (((finished_at IS NULL) OR (finished_at >= started_at))),
  CONSTRAINT "game_sessions_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."game_sessions"
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "public"."game_sessions" FROM "anon";

CREATE TABLE "public"."leaderboard_entries" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"    uuid                     NOT NULL,
  "game_mode"  text                     NOT NULL,
  "result_id"  uuid                     NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "leaderboard_entries_pkey" PRIMARY KEY (id),
  CONSTRAINT "leaderboard_entries_user_game_mode_unique" UNIQUE (user_id, game_mode)
);

ALTER TABLE "public"."leaderboard_entries"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."profiles" (
  "id"         uuid                     NOT NULL,
  "username"   text                     NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "profiles_pkey" PRIMARY KEY (id),
  CONSTRAINT "profiles_username_key" UNIQUE (username)
);

ALTER TABLE "public"."profiles"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."user_game_progress" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"    uuid                     NOT NULL,
  "game_mode"  text                     NOT NULL,
  "state"      jsonb                    NOT NULL DEFAULT '{}'::jsonb,
  "status"     text                     NOT NULL DEFAULT 'in_progress'::text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "user_game_progress_pkey" PRIMARY KEY (id),
  CONSTRAINT "user_game_progress_user_id_game_mode_key" UNIQUE (user_id, game_mode)
);

ALTER TABLE "public"."user_game_progress"
  ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
begin
    insert into public.profiles (id, username)
    values (
        new.id,
        new.raw_user_meta_data ->> 'username'
    );

    return new;
end;
$function$;

REVOKE ALL ON FUNCTION "public"."handle_new_user"() FROM "anon", "authenticated", "service_role";

CREATE OR REPLACE FUNCTION public.rls_auto_enable()
  RETURNS event_trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'pg_catalog'
  AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$;

REVOKE ALL ON FUNCTION "public"."rls_auto_enable"() FROM "anon", "authenticated", "service_role";

ALTER TABLE "public"."game_results"
  ADD CONSTRAINT "game_results_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."game_results"
  ADD CONSTRAINT "game_results_session_id_fkey" FOREIGN KEY (session_id) REFERENCES public.game_sessions(id) ON DELETE CASCADE;

ALTER TABLE "public"."game_sessions"
  ADD CONSTRAINT "game_sessions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."leaderboard_entries"
  ADD CONSTRAINT "leaderboard_entries_result_id_fkey" FOREIGN KEY (result_id) REFERENCES public.game_results(id) ON DELETE CASCADE;

ALTER TABLE "public"."leaderboard_entries"
  ADD CONSTRAINT "leaderboard_entries_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."profiles"
  ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."user_game_progress"
  ADD CONSTRAINT "user_game_progress_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX game_results_mode_final_time_idx ON public.game_results USING btree (game_mode, final_time_ms);

CREATE INDEX game_results_user_mode_completed_idx ON public.game_results USING btree (user_id, game_mode, completed_at DESC);

CREATE INDEX leaderboard_entries_result_idx ON public.leaderboard_entries USING btree (result_id);

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

CREATE POLICY "Users can read own game results" ON "public"."game_results"
  FOR SELECT
  TO "authenticated"
  USING ((auth.uid() = user_id));

CREATE POLICY "Users can read own game sessions" ON "public"."game_sessions"
  FOR SELECT
  TO "authenticated"
  USING ((auth.uid() = user_id));

CREATE POLICY "Leaderboard entries are publicly readable" ON "public"."leaderboard_entries"
  FOR SELECT
  TO "anon", "authenticated"
  USING (true);

CREATE POLICY "Profiles are publicly readable" ON "public"."profiles"
  FOR SELECT
  TO PUBLIC
  USING (true);

CREATE POLICY "Users can update their own profile" ON "public"."profiles"
  FOR UPDATE
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = id))
  WITH CHECK ((( SELECT auth.uid() AS uid) = id));

CREATE POLICY "Users can delete own game progress" ON "public"."user_game_progress"
  FOR DELETE
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "Users can insert own game progress" ON "public"."user_game_progress"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "Users can read own game progress" ON "public"."user_game_progress"
  FOR SELECT
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id));

CREATE POLICY "Users can update own game progress" ON "public"."user_game_progress"
  FOR UPDATE
  TO "authenticated"
  USING ((( SELECT auth.uid() AS uid) = user_id))
  WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));

CREATE EVENT TRIGGER "ensure_rls"
  ON ddl_command_end
  WHEN TAG IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
  EXECUTE FUNCTION "public"."rls_auto_enable"();

GRANT EXECUTE ON FUNCTION "public"."handle_new_user"() TO PUBLIC;

REVOKE ALL ON FUNCTION "public"."handle_new_user"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."handle_new_user"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."rls_auto_enable"() TO PUBLIC;

REVOKE ALL ON FUNCTION "public"."rls_auto_enable"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."rls_auto_enable"() TO "postgres";

REVOKE ALL ON TABLE "public"."game_results" FROM "authenticated";

GRANT SELECT ON TABLE "public"."game_results" TO "authenticated";

REVOKE ALL ON TABLE "public"."game_results" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."game_results" TO "postgres";

REVOKE ALL ON TABLE "public"."game_results" FROM "service_role";

GRANT INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON TABLE "public"."game_results" TO "service_role";

REVOKE ALL ON TABLE "public"."game_sessions" FROM "authenticated";

GRANT SELECT ON TABLE "public"."game_sessions" TO "authenticated";

REVOKE ALL ON TABLE "public"."game_sessions" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."game_sessions" TO "postgres";

REVOKE ALL ON TABLE "public"."game_sessions" FROM "service_role";

GRANT INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."game_sessions" TO "service_role";

REVOKE ALL ON TABLE "public"."leaderboard_entries" FROM "anon";

GRANT SELECT ON TABLE "public"."leaderboard_entries" TO "anon";

REVOKE ALL ON TABLE "public"."leaderboard_entries" FROM "authenticated";

GRANT SELECT ON TABLE "public"."leaderboard_entries" TO "authenticated";

REVOKE ALL ON TABLE "public"."leaderboard_entries" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."leaderboard_entries" TO "postgres";

REVOKE ALL ON TABLE "public"."leaderboard_entries" FROM "service_role";

GRANT INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."leaderboard_entries" TO "service_role";

REVOKE ALL ON TABLE "public"."profiles" FROM "anon";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."profiles" TO "anon";

REVOKE ALL ON TABLE "public"."profiles" FROM "authenticated";

GRANT MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE ON TABLE "public"."profiles" TO "authenticated";

REVOKE ALL ON TABLE "public"."profiles" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."profiles" TO "postgres";

REVOKE ALL ON TABLE "public"."profiles" FROM "service_role";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."profiles" TO "service_role";

REVOKE ALL ON TABLE "public"."user_game_progress" FROM "anon";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."user_game_progress" TO "anon";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."user_game_progress" TO "authenticated";

REVOKE ALL ON TABLE "public"."user_game_progress" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."user_game_progress" TO "postgres";

REVOKE ALL ON TABLE "public"."user_game_progress" FROM "service_role";

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLE "public"."user_game_progress" TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLES TO "anon";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLES TO "authenticated";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON TABLES TO "service_role";

