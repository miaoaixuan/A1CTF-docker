use diesel::prelude::*;
use std::time::SystemTime;
use serde_derive::{Serialize, Deserialize};
use diesel::sql_types::Jsonb;
use diesel::deserialize::{FromSql, FromSqlRow};
use diesel::serialize::{ToSql, Output};
use diesel::pg::Pg;
use std::io::Write;
use diesel_json::Json;
use chrono::{NaiveDate, NaiveDateTime};

#[derive(Debug, Serialize, Deserialize)]
pub struct Solve {
    pub user_id: String,
    pub game_id: i32,
    pub solve_time: NaiveDateTime,
    pub challenge_id: i32,
    pub score: f64
}

#[derive(Debug, Serialize, Deserialize, Queryable, Selectable, Insertable, AsChangeset)]
#[allow(dead_code)]
#[diesel(table_name = crate::db::schema::games)]
pub struct Game {
    pub id: i32,
    pub name: String,
    pub description: String,
    pub poster: String,
    pub start_time: NaiveDateTime,
    pub end_time: NaiveDateTime,
    pub solve_list: Json<Vec<Solve>>
}