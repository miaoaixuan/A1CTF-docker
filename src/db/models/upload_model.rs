use diesel::prelude::*;
use uuid::Uuid;
use chrono::NaiveDateTime;

#[derive(Debug, Queryable, Selectable, Insertable, AsChangeset)]
#[allow(dead_code)]
#[diesel(table_name = crate::db::schema::uploads)]
pub struct Upload {
    pub file_id: Uuid,
    pub user_id: Uuid,
    pub file_name: String,
    pub file_path: String,
    pub file_hash: String,
    pub file_type: String,
    pub file_size: i32,
    pub upload_time: NaiveDateTime
}