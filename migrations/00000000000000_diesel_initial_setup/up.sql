-- This file was automatically created by Diesel to setup helper functions
-- and other internal bookkeeping. This file is safe to edit, any future
-- changes will be added to existing projects as new migrations.

CREATE TABLE "user" (
  "user_id" uuid NOT NULL,
  "username" text NOT NULL,
  "password" text NOT NULL,
  "salt" text NOT NULL,
  "role" int4 DEFAULT 0 NOT NULL,
  "cur_token" text,
  "phone" text,
  "student_number" text,
  "realname" text,
  "slogan" text,
  "avatar" text,
  "sso_data" text,
  "email" text,
  "email_verified" bool DEFAULT false,
  PRIMARY KEY (user_id)
);

CREATE TABLE "games" (
    "game_id" BIGSERIAL NOT NULL,
    "name" text NOT NULL,
    "summary" text,
    "description" text,
    "poster" text,
    "invite_code" text,
    "start_time" timestamp NOT NULL,
    "end_time" timestamp NOT NULL,
    "practice_mode" bool DEFAULT false NOT NULL,
    "team_number_limit" int4 NOT NULL,
    "container_number_limit" int4 NOT NULL,
    "require_wp" bool DEFAULT false NOT NULL,
    "wp_expire_time" timestamp NOT NULL,
    "stages" jsonb NOT NULL,
    PRIMARY KEY (game_id)
);

CREATE TABLE "challenges" (
    "challenge_id" BIGSERIAL NOT NULL,
    "name" text NOT NULL,
    "description" text NOT NULL,
    "category" jsonb NOT NULL,
    "attachments" jsonb NOT NULL,
    "type" int4 NOT NULL,
    "container_config" jsonb,
    "create_time" timestamp NOT NULL,
    "judge_config" jsonb,
    PRIMARY KEY (challenge_id)
);

CREATE TABLE "game_challenges" (
    "game_id" BIGSERIAL NOT NULL REFERENCES games(game_id),
    "challenge_id" BIGSERIAL NOT NULL REFERENCES challenges(challenge_id),
    "score" double precision DEFAULT 0 NOT NULL,
    "enabled" bool DEFAULT false NOT NULL,
    "solved" jsonb DEFAULT '[]'::jsonb NOT NULL,
    "hints" text[] DEFAULT '{}'::text[],
    "judge_config" jsonb NOT NULL,
    PRIMARY KEY (challenge_id)
);

CREATE TABLE "teams" (
    "team_id" BIGSERIAL NOT NULL,
    "game_id" BIGSERIAL NOT NULL REFERENCES games(game_id),
    "team_name" text NOT NULL,
    "team_avatar" text,
    "team_slogan" text,
    "team_description" text,
    "team_members" uuid[],
    "team_score" double precision DEFAULT 0 NOT NULL,
    "team_hash" text NOT NULL,
    "invite_code" text,
    "team_status" int4 DEFAULT 0 NOT NULL,
    PRIMARY KEY (team_id)
);

CREATE TABLE "containers" (
    "container_id" uuid NOT NULL,
    "game_id" BIGSERIAL NOT NULL REFERENCES games(game_id),
    "team_id" BIGSERIAL NOT NULL REFERENCES teams(team_id),
    "challenge_id" BIGSERIAL NOT NULL REFERENCES challenges(challenge_id),
    "start_time" timestamp NOT NULL,
    "expire_time" timestamp NOT NULL,
    "expose_ports" jsonb NOT NULL,
    "container_status" int4 DEFAULT 0 NOT NULL,
    "flag_content" text NOT NULL,
    PRIMARY KEY (container_id)
);

CREATE TABLE "judges" (
    "challenge_id" BIGSERIAL NOT NULL REFERENCES challenges(challenge_id),
    "team_id" BIGSERIAL NOT NULL REFERENCES teams(team_id),
    "judge_type" int4 NOT NULL,
    "judge_status" int4 NOT NULL,
    "judge_result" int4 NOT NULL,
    "judge_id" uuid NOT NULL,
    "judge_time" timestamp NOT NULL,
    "judge_content" text NOT NULL,
    PRIMARY KEY (judge_id)
);

-- Sets up a trigger for the given table to automatically set a column called
-- `updated_at` whenever the row is modified (unless `updated_at` was included
-- in the modified columns)
--
-- # Example
--
-- ```sql
-- CREATE TABLE users (id SERIAL PRIMARY KEY, updated_at TIMESTAMP NOT NULL DEFAULT NOW());
--
-- SELECT diesel_manage_updated_at('users');
-- ```
CREATE OR REPLACE FUNCTION diesel_manage_updated_at(_tbl regclass) RETURNS VOID AS $$
BEGIN
    EXECUTE format('CREATE TRIGGER set_updated_at BEFORE UPDATE ON %s
                    FOR EACH ROW EXECUTE PROCEDURE diesel_set_updated_at()', _tbl);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION diesel_set_updated_at() RETURNS trigger AS $$
BEGIN
    IF (
        NEW IS DISTINCT FROM OLD AND
        NEW.updated_at IS NOT DISTINCT FROM OLD.updated_at
    ) THEN
        NEW.updated_at := current_timestamp;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
