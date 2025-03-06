use chrono::NaiveDateTime;
use diesel::prelude::*;
use serde_derive::{Serialize, Deserialize};
use diesel_json::Json;

#[derive(Debug, Serialize, Deserialize)]
pub struct GameStage {
    pub stage_name: String,
    pub start_time: NaiveDateTime,
    pub end_time: NaiveDateTime
}

#[derive(Debug, Serialize, Deserialize, Queryable, Selectable, Insertable, AsChangeset)]
#[allow(dead_code)]
#[diesel(table_name = crate::db::schema::games)]
pub struct Game {
    pub game_id: i64,
    pub name: String,
    pub summary: String,
    pub description: String,
    pub poster: String,
    pub invite_code: String,
    pub start_time: NaiveDateTime,
    pub end_time: NaiveDateTime,
    pub practice_mode: bool,
    pub team_number_limit: i32,
    pub container_number_limit: i32,
    pub require_wp: bool,
    pub wp_expire_time: NaiveDateTime,
    pub stages: Json<Vec<GameStage>>
}