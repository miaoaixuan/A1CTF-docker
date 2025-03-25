use chrono::NaiveDateTime;
use diesel::prelude::*;
use serde_derive::{Serialize, Deserialize};
use diesel_json::Json;
use super::challenge_model::{ChallengeCategory, JudgeConfig};

#[derive(Debug, Serialize, Deserialize)]
pub struct Solve {
    pub user_id: String,
    pub game_id: i32,
    pub solve_time: NaiveDateTime,
    pub challenge_id: i32,
    pub score: f64,
    pub solve_rank: i32
}

#[derive(Debug, Serialize, Deserialize, Queryable, Selectable, AsChangeset)]
#[allow(dead_code)]
#[diesel(table_name = crate::db::schema::game_challenges)]
pub struct GameChallenge {
    pub ingame_id: i64,
    pub game_id: i64,
    pub challenge_id: i64,
    pub total_score: f64,
    pub cur_score: f64,
    pub enabled: bool,
    pub solved: Json<Vec<Solve>>,
    pub hints: Option<Vec<Option<String>>>,
    pub judge_config: Option<Json<JudgeConfig>>,
    pub belong_stage: Option<i32>
}

#[derive(Debug, Serialize, Deserialize, Insertable, AsChangeset)]
#[allow(dead_code)]
#[diesel(table_name = crate::db::schema::game_challenges)]
pub struct InsertGameChallenge {
    pub game_id: i64,
    pub challenge_id: i64,
    pub total_score: f64,
    pub cur_score: f64,
    pub enabled: bool,
    pub solved: Json<Vec<Solve>>,
    pub hints: Option<Vec<Option<String>>>,
    pub judge_config: Option<Json<JudgeConfig>>,
    pub belong_stage: Option<i32>
}

#[derive(Debug, Serialize, Deserialize)]
#[allow(dead_code)]
pub struct GameSimpleChallenge {
    pub challenge_id: i64,
    pub challenge_name: String,
    pub total_score: f64,
    pub cur_score: f64,
    pub solve_count: i32,
    pub category: ChallengeCategory,
    pub judge_config: JudgeConfig,
    pub hints: Option<Vec<Option<String>>>,
    pub belong_stage: Option<i32>
}