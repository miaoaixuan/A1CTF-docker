// @generated automatically by Diesel CLI.

diesel::table! {
    games (id) {
        id -> Int4,
        name -> Text,
        description -> Text,
        poster -> Text,
        start_time -> Timestamp,
        end_time -> Timestamp,
        solve_list -> Jsonb,
    }
}

diesel::table! {
    user (id) {
        id -> Text,
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

diesel::allow_tables_to_appear_in_same_query!(
    games,
    user,
);
