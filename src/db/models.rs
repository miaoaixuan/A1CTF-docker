use diesel::prelude::*;

#[derive(Debug, Queryable, Selectable)]
#[diesel(table_name = crate::db::schema::user)]
pub struct User {
    pub id: String,
    pub username: String,
    pub password: Option<String>,
    pub role: Option<i32>,
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
