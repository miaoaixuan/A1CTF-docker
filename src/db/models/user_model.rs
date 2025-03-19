use diesel::prelude::*;
use uuid::Uuid;

#[derive(Debug, Queryable, Selectable, Insertable)]
#[allow(dead_code)]
#[diesel(table_name = crate::db::schema::users)]
pub struct User {
    pub user_id: Uuid,
    pub username: String,
    pub password: String,
    pub salt: String,
    pub role: i32,
    pub cur_token: Option<String>,
    pub phone: Option<String>,
    pub student_number: Option<String>,
    pub realname: Option<String>,
    pub slogan: Option<String>,
    pub avatar: Option<String>,
    pub sso_data: Option<String>,
    pub email: Option<String>,
    pub email_verified: Option<bool>,
}

#[derive(AsChangeset)]
#[diesel(table_name = crate::db::schema::users)]
pub struct UpdateUser {
    pub cur_token: Option<String>
}