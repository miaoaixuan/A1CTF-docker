use diesel::prelude::*;
use uuid::Uuid;


#[derive(Debug, Queryable, Selectable, Insertable, AsChangeset)]
#[allow(dead_code)]
#[diesel(table_name = crate::db::schema::teams)]
pub struct Team {
    pub team_id: i64,
    pub game_id: i64,
    pub team_name: String,
    pub team_avatar: Option<String>,
    pub team_slogan: Option<String>,
    pub team_description: Option<String>,
    pub team_members: Option<Vec<Option<Uuid>>>,
    pub team_score: f64,
    pub team_hash: String,
    pub invite_code: Option<String>,
    pub team_status: i32
}