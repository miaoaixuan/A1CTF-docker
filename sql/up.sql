CREATE TABLE "users" (
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
    "visible" bool DEFAULT false NOT NULL,
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
    "ingame_id" BIGSERIAL NOT NULL,
    "game_id" BIGSERIAL NOT NULL REFERENCES games(game_id),
    "challenge_id" BIGSERIAL NOT NULL REFERENCES challenges(challenge_id),
    "total_score" double precision DEFAULT 0 NOT NULL,
    "cur_score" double precision DEFAULT 0 NOT NULL,
    "enabled" bool DEFAULT false NOT NULL,
    "solved" jsonb DEFAULT '[]'::jsonb NOT NULL,
    "hints" jsonb DEFAULT '[]'::jsonb,
    "judge_config" jsonb,
    "belong_stage" int4 DEFAULT 0,
    PRIMARY KEY (ingame_id)
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

CREATE TABLE "uploads" (
    "file_id" uuid NOT NULL,
    "user_id" uuid NOT NULL REFERENCES users(user_id),
    "file_name" text NOT NULL,
    "file_path" text NOT NULL,
    "file_hash" text NOT NULL,
    "file_type" text NOT NULL,
    "file_size" int8 NOT NULL,
    "upload_time" timestamp NOT NULL,
    PRIMARY KEY (file_id)
);