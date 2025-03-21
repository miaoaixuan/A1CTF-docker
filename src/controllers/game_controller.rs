pub mod game {
    use std::any;

    use actix_web::{web, post, get, HttpResponse, Responder};

    // use diesel::query_dsl::methods::{FilterDsl};
    use diesel::{allow_tables_to_appear_in_same_query, joinable, ExpressionMethods, JoinOnDsl, NullableExpressionMethods, QueryDsl, RunQueryDsl, SelectableHelper};
    use diesel_json::Json;
    use serde_json::json;

    use crate::db::lib::establish_connection;
    use crate::db::models::challenge_model::Challenge;
    use crate::db::models::game_model::{Game, GameModel};
    use crate::db::models::game_challenge_model::{GameChallenge, GameSimpleChallenge, InsertGameChallenge};
    use crate::db::schema::game_challenges as game_challenges_schema;
    use crate::db::schema::games as games_schema;
    use crate::db::schema::challenges as challenges_schema;

    use crate::UserClaims;

    use serde_derive::{Serialize, Deserialize};

    #[derive(Debug, Serialize, Deserialize)]
    struct ListGamePayload {
        size: i32,
        offset: Option<i32>
    }

    #[post("/api/admin/game/list")]
    pub async fn list(jwt_user: UserClaims, payload: web::Json<ListGamePayload>,) -> impl Responder {
        let connection = &mut establish_connection();
        let game_results = games_schema::dsl::games
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
        
        let game_model: Game = payload.into_inner().into();
        let values = vec![ game_model ];

        match diesel::insert_into(games_schema::dsl::games)
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

    #[get("/api/admin/game/{game_id}")]
    pub async fn get(jwt_user: UserClaims, payload_game_id: web::Path<String>,) -> impl Responder {
        let connection = &mut establish_connection();

        let mut game_id_parsed = 0;

        match payload_game_id.parse::<i64>() {
            Ok(num) => {
                game_id_parsed = num;
            },
            Err(_) => {
                return HttpResponse::BadRequest().json(json!({
                    "code": 400,
                    "message": "Game id error"
                }))
            }
        }
        
        let game_record_result = games_schema::dsl::games
            .filter(games_schema::dsl::game_id.eq(game_id_parsed))
            .first::<Game>(connection);

        // challenges_schema::dsl::challenges.on(on)

        let game_challenges_result: Result<Vec<(GameChallenge, Option<Challenge>)>, diesel::result::Error> = game_challenges_schema::dsl::game_challenges
            .inner_join(challenges_schema::dsl::challenges.on(game_challenges_schema::challenge_id.eq(challenges_schema::challenge_id)))
            .select((
                game_challenges_schema::all_columns,
                challenges_schema::all_columns.nullable()
            ))
            .filter(game_challenges_schema::game_id.eq(payload_game_id.parse::<i64>().unwrap()))
            .load::<(GameChallenge, Option<Challenge>)>(connection);

        match game_record_result {
            Ok(game_record) => {
                match game_challenges_result {
                    Ok(game_challenges) => {
                        let mut result: GameModel = game_record.into();
                        result.challenges = game_challenges.iter().map(|(gc, c)| {

                            let judge_config_data = if gc.judge_config.is_some() {
                                gc.judge_config.as_ref().unwrap().0.clone()
                            } else {
                                c.as_ref().unwrap().judge_config.as_ref().unwrap().0.clone()
                            };

                            return GameSimpleChallenge {
                                challenge_id: c.as_ref().unwrap().challenge_id,
                                challenge_name:c.as_ref().unwrap().name.clone(),
                                score: gc.score,
                                solved: gc.solved.len() as i32,
                                category: c.as_ref().unwrap().category.0.clone(),
                                judge_config: judge_config_data
                            }
                        }).collect::<Vec<_>>();

                        HttpResponse::Ok().json(json!({
                            "code": 200,
                            "data": result
                        }))
                    },
                    Err(_) => {
                        HttpResponse::InternalServerError().json(json!({
                            "code": 500,
                            "message": "Server error"
                        }))
                    }
                }
            },
            Err(e) => {
                println!("{:?}", e);
                HttpResponse::InternalServerError().json(json!({
                    "code": 500,
                    "message": "Server error"
                }))
            }
        }
    }

    #[derive(Debug, Serialize, Deserialize)]
    struct AddGameChallengePayload {
        game_id: i64,
        challenge_id: i64
    }

    #[post("/api/admin/game/challenge/add")]
    pub async fn add_challenge(jwt_user: UserClaims, payload: web::Json<AddGameChallengePayload>,) -> impl Responder {
        let connection = &mut establish_connection();

        let game_record_result = games_schema::dsl::games
            .filter(games_schema::dsl::game_id.eq(payload.game_id))
            .first::<Game>(connection);

        match game_record_result {
            Ok(game_record) => {
                let challenge_record_result = challenges_schema::dsl::challenges
                    .filter(challenges_schema::dsl::challenge_id.eq(payload.challenge_id))
                    .first::<Challenge>(connection);
                match challenge_record_result {
                    Ok(challenge_record) => {

                        let new_value = InsertGameChallenge {
                            game_id: game_record.game_id,
                            challenge_id: payload.challenge_id,
                            score: 500f64,
                            enabled: false,
                            solved: Json::new(vec![]),
                            hints: Some(vec![]),
                            judge_config: Some(Json::new(challenge_record.judge_config.as_ref().unwrap().0.clone())),
                            belong_stage: None
                        };

                        let value_list = vec![ new_value ];

                        match diesel::insert_into(game_challenges_schema::dsl::game_challenges)
                            .values(value_list)
                            .returning(GameChallenge::as_select())
                            .get_result::<GameChallenge>(connection) {
                            Ok(v) => {
                                HttpResponse::Ok().json(json!({
                                    "code": 200,
                                    "data": json![{
                                        "ingame_id": v.ingame_id
                                    }]
                                }))
                            },
                            Err(_) => {
                                HttpResponse::InternalServerError().json(json!({
                                    "code": 500,
                                    "message": "Server error"
                                }))
                            }
                        }


                    },
                    Err(_) => {
                        return HttpResponse::BadRequest().json(json!({
                            "code": 401,
                            "message": "Bad request"
                        }))
                    }
                }
            },
            Err(_) => {
                return HttpResponse::BadRequest().json(json!({
                    "code": 401,
                    "message": "Bad request"
                }))
            }
        }
    }

}