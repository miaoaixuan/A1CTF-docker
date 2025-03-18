use diesel_json::Json;
use chrono::NaiveDateTime;
use diesel::prelude::*;
use uuid::Uuid;
use serde_derive::{Serialize, Deserialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct PortInfo {
    pub name: String,
    pub port: i32,
    pub ip: String
}

#[derive(Debug, Queryable, Selectable, Insertable, AsChangeset)]
#[allow(dead_code)]
#[diesel(table_name = crate::db::schema::containers)]
pub struct Container {
    pub container_id: Uuid,
    pub game_id: i64,
    pub team_id: i64,
    pub challenge_id: i64,
    pub start_time: NaiveDateTime,
    pub expire_time: NaiveDateTime,
    pub expose_ports: Json<Vec<PortInfo>>,
    pub container_status: i32,
    pub flag_content: String
}