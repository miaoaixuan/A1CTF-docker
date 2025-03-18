pub mod challenge {
    use actix_web::{get, post, web, HttpResponse, Responder};

    use chrono::Local;
    use diesel_json::Json;
    use serde_derive::{Serialize, Deserialize};
    use serde_json::json;

    use crate::db::models::challenge_model::*;
    use crate::db::lib::establish_connection;
    use crate::db::schema::challenges::dsl::*;

    use crate::UserClaims;
    use diesel::prelude::*;

    #[derive(Debug, Serialize, Deserialize)]
    struct ListChallengePayload {
        size: i64,
        offset: i64,
        category: Option<ChallengeCategory>
    }

    #[post("/api/admin/challenge/list")]
    pub async fn list(jwt_user: UserClaims, payload: web::Json<ListChallengePayload>) -> impl Responder {

        let connection = &mut establish_connection();
        let challenges_result;

        if payload.category.is_some() {
            challenges_result = challenges.filter(category.eq(Json::new(payload.category.as_ref().unwrap())))
                .select(Challenge::as_select())
                .load::<Challenge>(connection);
        } else {
            challenges_result = challenges.select(Challenge::as_select())
            .load::<Challenge>(connection);
        }

        match challenges_result {
            Ok(data) => HttpResponse::Ok().json(json!({
                "code": 200,
                "data": data.iter().map(|x| {
                    json!({
                        "challenge_id": x.challenge_id,
                        "name": x.name,
                        "description": x.description,
                        "category": x.category,
                        "create_time": x.create_time
                    })
                }).collect::<Vec<serde_json::Value>>()
            })),
            Err(e) => {
                println!("{:?}", e);

                HttpResponse::InternalServerError().json(json!({
                    "code": 500,
                    "message": "Failed to load challenges"
                }))
            },
        }
    }

    #[derive(Debug, Serialize, Deserialize)]
    struct ChallengeInfoPayload {
        challenge_id: i64
    }

    #[post("/api/admin/challenge/get")]
    pub async fn get(jwt_user: UserClaims, payload: web::Json<ChallengeInfoPayload>) -> impl Responder {

        let connection = &mut establish_connection();

        let challenges_result = challenges.filter(challenge_id.eq(payload.challenge_id))
                .select(Challenge::as_select())
                .limit(1)
                .load::<Challenge>(connection);

        match challenges_result {
            Ok(data) => HttpResponse::Ok().json(json!({
                "code": 200,
                "data": data[0]
            })),
            Err(e) => {
                println!("{:?}", e);

                HttpResponse::InternalServerError().json(json!({
                    "code": 500,
                    "message": "Failed to load challenges"
                }))
            },
        }
    }

    #[post("/api/admin/challenge/create")]
    pub async fn create(jwt_user: UserClaims, payload: web::Json<SetChallenge>) -> impl Responder {

        let connection = &mut establish_connection();

        // let pod_config = PodInfo {
        //     name: format!("testpod-{}", "test"),
        //     team_hash: "f489bfadc7284".to_string(),
        //     containers: vec![
        //         A1Container {
        //             name: "eval".to_string(),
        //             image: "127.0.0.1:6440/ez_eval".to_string(),
        //             command: None,
        //             env: None,
        //             expose_ports: Some(vec![PortName {
        //                 name: "http1".to_string(),
        //                 port: 80,
        //             }]),
        //         },
        //         A1Container {
        //             name: "nc-test".to_string(),
        //             image: "127.0.0.1:6440/nc_me_please".to_string(),
        //             command: None,
        //             env: None,
        //             expose_ports: Some(vec![PortName {
        //                 name: "pwn".to_string(),
        //                 port: 70,
        //             }]),
        //         }
        //     ]
        // };

        // let new_chall = vec![ Challenge {
        //     challenge_id: 0,
        //     category: Json::new(ChallengeCategory::MISC),
        //     name: "New Challenge".to_string(),
        //     description: "New Challenge".to_string(),
        //     attachments: Json::new(vec![ AttachmentConfig {
        //         attach_name: "flag".to_string(),
        //         attach_type: AttachmentType::STATICFILE,
        //         attach_url: Some("flag{test}".to_string()),
        //         attach_hash: None,
        //         generate_script: None
        //     } ]),
        //     judge_config: Some(Json::new(JudgeConfig {
        //         judge_type: JudgeType::STATIC,
        //         judge_script: None,
        //         flag_template: Some("flag{TEST}".to_string())
        //     })),
        //     type_: 0,
        //     container_config: Some(Json::new(pod_config)),
        //     create_time: Local::now().naive_local()
        // } ];

        let mut new_chall = payload.into_inner();
        new_chall.create_time = Local::now().naive_local();
        let values = vec![ new_chall ];

        match diesel::insert_into(challenges)
            .values(&values)
            .returning(Challenge::as_select())
            .get_result::<Challenge>(connection) {
                Ok(challenge) => HttpResponse::Ok().json(json!({
                    "code": 200,
                    "data": {
                        "challenge_id": challenge.challenge_id,
                        "create_at": challenge.create_time
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

    #[derive(Debug, Serialize, Deserialize)]
    struct DeleteChallengePayload {
        challenge_id: i64,
    }

    #[post("/api/admin/challenge/delete")]
    pub async fn delete(jwt_user: UserClaims, payload: web::Json<DeleteChallengePayload>) -> impl Responder {
        
        let connection = &mut establish_connection();

        match diesel::delete(challenges.filter(challenge_id.eq(payload.challenge_id)))
            .execute(connection) {
                Ok(number) => {
                    if number == 0 {
                        return HttpResponse::NotFound().json(json!({
                            "code": 404,
                            "message": "Challenge not found"
                        }));
                    } else {
                        return HttpResponse::Ok().json(json!({
                            "code": 200,
                            "message": "Challenge deleted"
                        }));
                    }
                },
                Err(e) => {
                    println!("{:?}", e);

                    HttpResponse::InternalServerError().json(json!({
                        "code": 500,
                        "message": "Failed to delete challenge"
                    }))
                }
            }
    }

    #[post("/api/admin/challenge/update")]
    pub async fn update(jwt_user: UserClaims, payload: web::Json<Challenge>) -> impl Responder {
        
        let connection = &mut establish_connection();
        let new_challenge = payload.into_inner();

        match challenges.filter(challenge_id.eq(new_challenge.challenge_id))
            .select(Challenge::as_select())
            .load::<Challenge>(connection) {
                Ok(challenge) => {
                    if challenge.len() == 0 {
                        return HttpResponse::NotFound().json(json!({
                            "code": 404,
                            "message": "Challenge not found"
                        }));
                    } else {

                        match diesel::update(challenges.filter(challenge_id.eq(new_challenge.challenge_id)))
                            .set(&new_challenge)
                            .execute(connection) {
                                Ok(_) => {
                                    return HttpResponse::Ok().json(json!({
                                        "code": 200,
                                        "message": "Updated"
                                    }));
                                },
                                Err(e) => {
                                    println!("{:?}", e);

                                    HttpResponse::InternalServerError().json(json!({
                                        "code": 500,
                                        "message": "Failed to delete challenge"
                                    }))
                                }
                            }
                    }
                },
                Err(e) => {
                    println!("{:?}", e);

                    return HttpResponse::InternalServerError().json(json!({
                        "code": 500,
                        "message": "Failed to delete challenge"
                    }));
                }
            }
    }
}