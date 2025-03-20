pub mod game {
    use actix_web::{web, post, get, HttpResponse, Responder, HttpRequest};

    use actix_multipart::form::{tempfile::TempFile, MultipartForm};
    use diesel::query_dsl::methods::{FilterDsl, LimitDsl, OffsetDsl, SelectDsl};
    use diesel::{ExpressionMethods, RunQueryDsl, SelectableHelper};
    use serde_json::json;
    use mime;

    use crate::db::lib::establish_connection;
    use crate::db::models::game_model::{Game, GameModel};
    use crate::db::schema::games::dsl::*;
    use crate::UserClaims;
    use chrono::{Datelike, Local};
    use actix_files::NamedFile;

    use serde_derive::{Serialize, Deserialize};

    use std::path::Path;
    use std::fs;

    #[derive(Debug, Serialize, Deserialize)]
    struct ListGamePayload {
        size: i32,
        offset: Option<i32>
    }

    #[post("/api/admin/game/list")]
    pub async fn list(jwt_user: UserClaims, payload: web::Json<ListGamePayload>,) -> impl Responder {

        let connection = &mut establish_connection();
        let game_results = games
            .select(Game::as_select())
            .offset(payload.offset.unwrap_or(0) as i64)
            .limit(payload.size as i64)
            .load::<Game>(connection);

        match game_results {
            Ok(data) => {
                return HttpResponse::Ok().json(json!({
                    "code": 200,
                    "data": json!(data.iter().map(|gm| {
                        json!({
                            "game_id": gm.game_id,
                            "name": gm.name,
                            "summary": gm.summary,
                            "start_time": gm.start_time,
                            "end_time": gm.end_time,
                            "visible": gm.visible,
                            "poster": gm.poster
                        })
                    }).collect::<Vec<_>>())
                }));
            },
            Err(_) => {
                return HttpResponse::InternalServerError().json(json!({
                    "code": 500,
                    "message": "Server error"
                }));
            }
        }
    }

    #[post("/api/admin/game/create")]
    pub async fn create(jwt_user: UserClaims, payload: web::Json<GameModel>,) -> impl Responder {

        let connection = &mut establish_connection();
        
        let mut game_model = payload.into_inner() as Game;
        let values = vec![ game_model ];

        match diesel::insert_into(games)
            .values(&values)
            .returning(Game::as_select())
            .get_result::<Game>(connection) {
                Ok(game) => HttpResponse::Ok().json(json!({
                    "code": 200,
                    "data": {
                        "game_id": game.game_id
                    }
                })),
                Err(e) => {
                    println!("{:?}", e);

                    HttpResponse::InternalServerError().json(json!({
                        "code": 500,
                        "message": "Failed to create challenge"
                    }))
                }
            }
    }

}