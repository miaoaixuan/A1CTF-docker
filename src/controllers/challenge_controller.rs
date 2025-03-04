pub mod challenge {
    use actix_web::cookie::Cookie;
    use actix_web::rt::time;
    use actix_web::{web, post, get, HttpResponse, Responder};

    use jwt_compact::alg::Hs256;
    use serde_derive::Serialize;
    use serde_derive::Deserialize;
    use serde_json::json;

    use crate::utils::crypto_helper::*;
    use crate::db::lib::establish_connection;
    use crate::db::schema::user::dsl::*;
    use crate::db::models::*;
    use crate::UserClaims;
    use diesel::prelude::*;
    use uuid::Uuid;

    use actix_jwt_auth_middleware::use_jwt::UseJWTOnApp;
    use actix_jwt_auth_middleware::{AuthResult, Authority, FromRequest, TokenSigner};

    use std::time::{Duration, SystemTime, UNIX_EPOCH};

    #[get("/api/challenge/list")]
    pub async fn list(jwt_user: UserClaims) -> impl Responder {
        HttpResponse::Ok().json(json!({
            "code": 200,
            "message": "success",
            "data": []
        }))
        
    }
}