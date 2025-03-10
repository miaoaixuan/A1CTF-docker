// @generated automatically by Diesel CLI.

diesel::table! {
    challenges (challenge_id) {
        challenge_id -> Int8,
        name -> Text,
        description -> Text,
        category -> Jsonb,
        attachments -> Jsonb,
        #[sql_name = "type"]
        type_ -> Int4,
        container_config -> Nullable<Jsonb>,
        create_time -> Timestamp,
        judge_config -> Nullable<Jsonb>,
    }
}

diesel::table! {
    containers (container_id) {
        container_id -> Uuid,
        game_id -> Int8,
        team_id -> Int8,
        challenge_id -> Int8,
        start_time -> Timestamp,
        expire_time -> Timestamp,
        expose_ports -> Jsonb,
        container_status -> Int4,
        flag_content -> Text,
    }
}

diesel::table! {
    game_challenges (ingame_id) {
        ingame_id -> Int8,
        game_id -> Int8,
        challenge_id -> Int8,
        score -> Float8,
        enabled -> Bool,
        solved -> Jsonb,
        hints -> Nullable<Array<Nullable<Text>>>,
        judge_config -> Jsonb,
    }
}

diesel::table! {
    games (game_id) {
        game_id -> Int8,
        name -> Text,
        summary -> Nullable<Text>,
        description -> Nullable<Text>,
        poster -> Nullable<Text>,
        invite_code -> Nullable<Text>,
        start_time -> Timestamp,
        end_time -> Timestamp,
        practice_mode -> Bool,
        team_number_limit -> Int4,
        container_number_limit -> Int4,
        require_wp -> Bool,
        wp_expire_time -> Timestamp,
        stages -> Jsonb,
    }
}

diesel::table! {
    judges (judge_id) {
        challenge_id -> Int8,
        team_id -> Int8,
        judge_type -> Int4,
        judge_status -> Int4,
        judge_result -> Int4,
        judge_id -> Uuid,
        judge_time -> Timestamp,
        judge_content -> Text,
    }
}

diesel::table! {
    teams (team_id) {
        team_id -> Int8,
        game_id -> Int8,
        team_name -> Text,
        team_avatar -> Nullable<Text>,
        team_slogan -> Nullable<Text>,
        team_description -> Nullable<Text>,
        team_members -> Nullable<Array<Nullable<Uuid>>>,
        team_score -> Float8,
        team_hash -> Text,
        invite_code -> Nullable<Text>,
        team_status -> Int4,
    }
}

diesel::table! {
    user (user_id) {
        user_id -> Uuid,
        username -> Text,
        password -> Text,
        salt -> Text,
        role -> Int4,
        cur_token -> Nullable<Text>,
        phone -> Nullable<Text>,
        student_number -> Nullable<Text>,
        realname -> Nullable<Text>,
        slogan -> Nullable<Text>,
        avatar -> Nullable<Text>,
        sso_data -> Nullable<Text>,
        email -> Nullable<Text>,
        email_verified -> Nullable<Bool>,
    }
}

diesel::joinable!(containers -> challenges (challenge_id));
diesel::joinable!(containers -> games (game_id));
diesel::joinable!(containers -> teams (team_id));
diesel::joinable!(game_challenges -> challenges (challenge_id));
diesel::joinable!(game_challenges -> games (game_id));
diesel::joinable!(judges -> challenges (challenge_id));
diesel::joinable!(judges -> teams (team_id));
diesel::joinable!(teams -> games (game_id));

diesel::allow_tables_to_appear_in_same_query!(
    challenges,
    containers,
    game_challenges,
    games,
    judges,
    teams,
    user,
);
