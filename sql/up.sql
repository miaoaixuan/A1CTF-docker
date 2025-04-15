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

CREATE INDEX idx_users_username ON users(username);

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

CREATE INDEX idx_games_invite_code ON games(invite_code);
CREATE INDEX idx_games_time_range ON games(start_time, end_time);
CREATE INDEX idx_games_visible ON games(visible);

CREATE TABLE "challenges" (
    "challenge_id" BIGSERIAL NOT NULL,
    "name" text NOT NULL,
    "description" text NOT NULL,
    "category" jsonb NOT NULL,
    "attachments" jsonb NOT NULL,
    "container_type" jsonb NOT NULL,
    "container_config" jsonb,
    "create_time" timestamp NOT NULL,
    "judge_config" jsonb,
    PRIMARY KEY (challenge_id)
);

CREATE INDEX idx_challenges_name ON challenges(name);
CREATE INDEX idx_challenges_category ON challenges USING GIN(category);

CREATE TABLE "game_challenges" (
    "ingame_id" BIGSERIAL NOT NULL,
    "game_id" BIGSERIAL NOT NULL REFERENCES games(game_id),
    "challenge_id" BIGSERIAL NOT NULL REFERENCES challenges(challenge_id),
    "total_score" double precision DEFAULT 0 NOT NULL,
    "cur_score" double precision DEFAULT 0 NOT NULL,
    "minimal_score" double precision DEFAULT 0 NOT NULL,
    "difficulty" double precision DEFAULT 5 NOT NULL,
    "hints" jsonb DEFAULT '[]'::jsonb,
    "solve_count" int4 DEFAULT 0 NOT NULL,
    "judge_config" jsonb,
    "visible" bool DEFAULT false,
    "belong_stage" text,
    PRIMARY KEY (ingame_id)
);

CREATE INDEX idx_game_challenges_game_challenge ON game_challenges(game_id, challenge_id);
CREATE INDEX idx_game_challenges_belong_stage ON game_challenges(belong_stage);
CREATE INDEX idx_game_challenges_enabled ON game_challenges(visible);

CREATE TABLE "teams" (
    "team_id" BIGSERIAL NOT NULL,
    "game_id" BIGSERIAL NOT NULL REFERENCES games(game_id),
    "team_name" text NOT NULL,
    "team_avatar" text,
    "team_slogan" text,
    "team_description" text,
    "team_members" uuid[],
    "team_score" double precision DEFAULT 0 NOT NULL,
    "team_hash" text unique NOT NULL,
    "invite_code" text,
    "team_status" jsonb NOT NULL,
    PRIMARY KEY (team_id)
);

CREATE INDEX idx_teams_invite_code ON teams(invite_code);
CREATE INDEX idx_teams_members ON teams USING GIN(team_members);

CREATE TABLE "containers" (
    "container_id" uuid NOT NULL,
    "game_id" BIGSERIAL NOT NULL REFERENCES games(game_id),
    "team_id" BIGSERIAL NOT NULL REFERENCES teams(team_id),
    "challenge_id" BIGSERIAL NOT NULL REFERENCES challenges(challenge_id),
    "start_time" timestamp NOT NULL,
    "expire_time" timestamp NOT NULL,
    "expose_ports" jsonb NOT NULL,
    "container_status" jsonb NOT NULL,
    "flag_content" text NOT NULL,
    PRIMARY KEY (container_id)
);

CREATE INDEX idx_containers_game_team ON containers(game_id, team_id);
CREATE INDEX idx_containers_challenge ON containers(challenge_id);
CREATE INDEX idx_containers_time_range ON containers(start_time, expire_time);

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

CREATE INDEX idx_judges_challenge_team ON judges(challenge_id, team_id);
CREATE INDEX idx_judges_status_result ON judges(judge_status, judge_result);
CREATE INDEX idx_judges_time ON judges(judge_time);

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

CREATE INDEX idx_uploads_user ON uploads(user_id);
CREATE INDEX idx_uploads_file_hash ON uploads(file_hash);
CREATE INDEX idx_uploads_time ON uploads(upload_time);

CREATE TABLE "solves" (
    "solve_id" uuid NOT NULL,
    "game_id" BIGSERIAL NOT NULL REFERENCES games(game_id),
    "challenge_id" BIGSERIAL NOT NULL REFERENCES challenges(challenge_id),
    "team_id" BIGSERIAL NOT NULL REFERENCES teams(team_id),
    "container_id" uuid REFERENCES containers(container_id),
    "solve_status" int4 NOT NULL,
    "solve_time" timestamp NOT NULL,
    "rank" int4 NOT NULL,
    PRIMARY KEY (solve_id)
);

CREATE INDEX idx_solves_game_team ON solves(game_id, team_id);
CREATE INDEX idx_solves_challenge ON solves(challenge_id);
CREATE INDEX idx_solves_container ON solves(container_id);
CREATE INDEX idx_solves_status ON solves(solve_status);
CREATE INDEX idx_solves_time_rank ON solves(solve_time, rank);

CREATE TABLE "notices" (
    "notice_id" BIGSERIAL NOT NULL,
    "game_id" BIGSERIAL NOT NULL REFERENCES games(game_id),
    "notice_category" jsonb NOT NULL,
    "create_time" timestamp NOT NULL,
    "data" jsonb NOT NULL,
    PRIMARY KEY (notice_id)
);


CREATE INDEX idx_notices_game ON notices(game_id);
CREATE INDEX idx_notices_time ON notices(create_time);
CREATE INDEX idx_notices_category ON notices USING GIN(notice_category);