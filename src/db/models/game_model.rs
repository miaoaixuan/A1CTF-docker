use chrono::NaiveDateTime;
use diesel::prelude::*;
use serde_derive::{Serialize, Deserialize};
use diesel_json::Json;

use super::game_challenge_model::{GameChallenge, GameSimpleChallenge};

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
    pub summary: Option<String>,
    pub description: Option<String>,
    pub poster: Option<String>,
    pub invite_code: Option<String>,
    pub start_time: NaiveDateTime,
    pub end_time: NaiveDateTime,
    pub practice_mode: bool,
    pub team_number_limit: i32,
    pub container_number_limit: i32,
    pub require_wp: bool,
    pub wp_expire_time: NaiveDateTime,
    pub stages: Json<Vec<GameStage>>,
    pub visible: bool
}

#[derive(Debug, Serialize, Deserialize)]
#[allow(dead_code)]
pub struct GameModel {
    pub game_id: i64,
    pub name: String,
    pub summary: Option<String>,
    pub description: Option<String>,
    pub poster: Option<String>,
    pub invite_code: Option<String>,
    pub start_time: NaiveDateTime,
    pub end_time: NaiveDateTime,
    pub practice_mode: bool,
    pub team_number_limit: i32,
    pub container_number_limit: i32,
    pub require_wp: bool,
    pub wp_expire_time: NaiveDateTime,
    pub stages: Json<Vec<GameStage>>,
    pub visible: bool,
    pub challenges: Vec<GameSimpleChallenge>
}

impl From<GameModel> for Game {
    fn from(game_model: GameModel) -> Self {
        Game {
            game_id: game_model.game_id,
            name: game_model.name,
            summary: game_model.summary,
            description: game_model.description,
            poster: game_model.poster,
            invite_code: game_model.invite_code,
            start_time: game_model.start_time,
            end_time: game_model.end_time,
            practice_mode: game_model.practice_mode,
            team_number_limit: game_model.team_number_limit,
            container_number_limit: game_model.container_number_limit,
            require_wp: game_model.require_wp,
            wp_expire_time: game_model.wp_expire_time,
            stages: game_model.stages,
            visible: game_model.visible,
        }
    }
}

impl From<Game> for GameModel {
    fn from(game_model: Game) -> Self {
        GameModel {
            game_id: game_model.game_id,
            name: game_model.name,
            summary: game_model.summary,
            description: game_model.description,
            poster: game_model.poster,
            invite_code: game_model.invite_code,
            start_time: game_model.start_time,
            end_time: game_model.end_time,
            practice_mode: game_model.practice_mode,
            team_number_limit: game_model.team_number_limit,
            container_number_limit: game_model.container_number_limit,
            require_wp: game_model.require_wp,
            wp_expire_time: game_model.wp_expire_time,
            stages: game_model.stages,
            visible: game_model.visible,
            challenges: vec![]
        }
    }
}