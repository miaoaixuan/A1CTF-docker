pub mod challenge {
    use actix_web::{web, post, get, HttpResponse, Responder};

    use chrono::{Local, Duration};
    use diesel_json::Json;
    use serde_derive::{Serialize, Deserialize};
    use serde_json::json;

    use crate::db::models::challenge_model::*;
    use crate::db::lib::establish_connection;
    use crate::db::schema::challenges::dsl::*;

    use crate::utils::k8s_tool::*;
    use crate::UserClaims;
    use diesel::prelude::*;

    #[derive(Debug, Serialize, Deserialize)]
    struct ListChallengePayload {
        game_id: i64,
        category: Option<ChallengeCategory>
    }

    #[get("/api/challenge/list")]
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
                "data": data
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
    struct CreateChallengePayload {
        game_id: i64,
        
    }

    #[post("/api/challenge/create")]
    pub async fn create(jwt_user: UserClaims, payload: web::Json<Challenge>) -> impl Responder {

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

        let new_chall = vec![ payload.into_inner() ];

        diesel::insert_into(challenges)
            .values(&new_chall)
            .execute(connection).expect("Failed to insert challenge");

        return HttpResponse::Ok().json(json!({
            "code": 200,
            "data": "1"
        }));
    }
}