// @generated automatically by Diesel CLI.

diesel::table! {
    user (id) {
        id -> Text,
        username -> Text,
        password -> Nullable<Text>,
        role -> Nullable<Int4>,
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
