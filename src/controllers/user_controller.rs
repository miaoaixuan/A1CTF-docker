pub mod user {
    use actix_web::cookie::Cookie;
    use actix_web::{web, post, get, HttpResponse, Responder};

    use jwt_compact::alg::Hs256;
    use serde_derive::{Serialize, Deserialize};
    use serde_json::json;

    use crate::utils::crypto_helper::*;
    use crate::db::lib::establish_connection;
    use crate::db::schema::users::dsl::*;
    use crate::db::models::user_model::*;
    use crate::UserClaims;
    use diesel::prelude::*;
    use uuid::Uuid;

    use actix_jwt_auth_middleware::TokenSigner;

    use std::time::Duration;

    #[derive(Debug, Serialize, Deserialize)]
    struct LoginPayload {
        username: String,
        password: String,
        captcha: Option<String>
    }

    #[post("/api/auth/login")]
    pub async fn login(payload: web::Json<LoginPayload>, cookie_signer: web::Data<TokenSigner<UserClaims, Hs256>>) -> impl Responder {
        let connection = &mut establish_connection();
        match users.filter(username.eq(&payload.username).or(email.eq(&payload.username)))
            .limit(1)
            .select(User::as_select())
            .load::<User>(connection) {
            Ok(data) => {
                if data.len() == 0 {
                    return HttpResponse::NotFound().json(json!({
                        "code": 404,
                        "message": "User not found"
                    }));
                } else {
                    let cur_user = data.get(0).unwrap();

                    if salt_password(&payload.password, &cur_user.salt) != cur_user.password {
                        return HttpResponse::Unauthorized().json(json!({
                            "code": 401,
                            "message": "Password incorrect."
                        }));
                    }

                    let new_user = UserClaims { 
                        username: cur_user.username.clone(),
                        id: cur_user.user_id.to_string(),
                        role: match cur_user.role {
                            0 => crate::Role::User,
                            1 => crate::Role::Admin,
                            2 => crate::Role::Monitor,
                            _ => crate::Role::User
                        }
                    };

                    let access_token = cookie_signer.create_signed_token(&new_user, Duration::from_secs(3600 * 48));
                    let access_cookie = Cookie::build("access_token".to_string(), access_token.unwrap())
                        .path("/")
                        .secure(true)
                        .finish();

                    return HttpResponse::Ok()
                    .cookie(access_cookie)
                    .json(json!({
                        "code": 200
                    }));
                        
                }
            },
            Err(_e) => {
                return HttpResponse::InternalServerError().json(json!({
                    "code": 500,
                    "message": "System error."
                }));
            }
        }
        
    }

    #[derive(Debug, Serialize, Deserialize)]
    struct RegisterPayload {
        username: String,
        password: String,
        email: String,
        captcha: Option<String>
    }

    #[post("/api/auth/register")]
    pub async fn register(payload: web::Json<RegisterPayload>) -> impl Responder {
        let connection = &mut establish_connection();
        let results = users.filter(username.eq(&payload.username).or(email.eq(&payload.email)))
            .select(User::as_select())
            .load::<User>(connection);

        match results {
            Ok(data) => {
                if data.len() == 0 {
                    let new_salt = generate_salt();
                    let salted_password = salt_password(&payload.password, &new_salt);
                    let new_user = User {
                        user_id: Uuid::new_v4(),
                        username: payload.username.clone(),
                        password: salted_password,
                        salt: new_salt,
                        role: 0,
                        cur_token: None,
                        phone: None,
                        student_number: None,
                        realname: None,
                        slogan: None,
                        avatar: None,
                        sso_data: None,
                        email: Some(payload.email.clone()),
                        email_verified: Some(false)
                    };

                    match diesel::insert_into(users)
                        .values(&new_user)
                        .execute(connection) {
                            Ok(_r) => {
                                return HttpResponse::Ok().json(json!({
                                    "code": 200
                                }));
                            },
                            Err(_e) => {
                                return HttpResponse::InternalServerError().json(json!({
                                    "code": 501,
                                    "message": "System error."
                                }));
                            }
                        }
                } else {
                    return HttpResponse::NotAcceptable().json(json!({
                        "code": 500,
                        "message": "Username or email has registered."
                    }));
                }
            },
            Err(_e) => {
                return HttpResponse::InternalServerError().json(json!({
                    "code": 500,
                    "message": "System error."
                }));
            }
        }
        
    }

    #[get("/api/test")]
    pub async fn test(jwt_user: UserClaims) -> impl Responder {
        HttpResponse::Ok().json(json!({
            "code": 200,
            "user": jwt_user.username
        }))
    }

}