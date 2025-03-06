pub mod challenge {
    use actix_web::{web, post, get, HttpResponse, Responder};

    use chrono::{Local, Duration};
    use diesel_json::Json;
    use serde_json::json;

    use crate::db::models::game_model::Game;
    use crate::db::models::game_challenge_model::Solve;
    use crate::db::lib::establish_connection;
    use crate::db::schema::games::dsl::*;
    use crate::db::models::*;
    use crate::UserClaims;
    use diesel::prelude::*;

    #[get("/api/challenge/list")]
    pub async fn list(jwt_user: UserClaims) -> impl Responder {

        // let value = vec! [ Game {
        //     id: 1,
        //     name: "test".to_string(),
        //     description: "114514".to_string(),
        //     poster: "2314".to_string(),
        //     start_time: Local::now().naive_local(),
        //     end_time: (Local::now() + Duration::days(2)).naive_local(),
        //     solve_list: Json::new(vec![ Solve {
        //         user_id: "114514".to_string(),
        //         game_id: 123,
        //         solve_time: Local::now().naive_local(),
        //         challenge_id: 123,
        //         score: 23.22
        //     }])
        // }];

        // let connection = &mut establish_connection();
        // match diesel::insert_into(games).values(&value).execute(connection) {
        //     Ok(_r) => {
                
        //     },
        //     Err(_e) => {
        //         println!("{:?}", _e);
        //         return HttpResponse::InternalServerError().json(json!({
        //             "code": 501,
        //             "message": "System error."
        //         }));
        //     }
        // };

        return HttpResponse::Ok().json(json!({
            "code": 200
        }));
    }
}