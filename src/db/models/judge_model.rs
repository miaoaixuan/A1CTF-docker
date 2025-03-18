use chrono::NaiveDateTime;
use diesel::prelude::*;
use uuid::Uuid;

#[derive(Debug, Queryable, Selectable, Insertable, AsChangeset)]
#[allow(dead_code)]
#[diesel(table_name = crate::db::schema::judges)]
pub struct Judge {
    pub challenge_id: i64,
    pub team_id: i64,
    pub judge_type: i32,
    pub judge_status: i32,
    pub judge_result: i32,
    pub judge_id: Uuid,
    pub judge_time: NaiveDateTime,
    pub judge_content: String
}