pub mod user {
    use actix_web::cookie::Cookie;
    use actix_web::{web, post, HttpResponse, Responder};

    use serde_derive::Serialize;
    use serde_derive::Deserialize;
    use serde_json::json;

    use crate::utils::crypto_helper::*;
    use crate::db::lib::establish_connection;
    use crate::db::schema::user::dsl::*;
    use crate::db::models::*;
    use diesel::prelude::*;
    use uuid::Uuid;

    #[derive(Debug, Serialize, Deserialize)]
    struct LoginPayload {
        username: String,
        password: String,
        captcha: Option<String>
    }

    #[post("/api/auth/login")]
    pub async fn login(payload: web::Json<LoginPayload>) -> impl Responder {
        let connection = &mut establish_connection();
        match user.filter(username.eq(&payload.username).or(email.eq(&payload.username)))
            .limit(1)
            .select(User::as_select())
            .load::<User>(connection) {
            Ok(data) => {
                if data.len() == 0 {
                    return HttpResponse::InternalServerError().json(json!({
                        "code": 404,
                        "message": "User not found"
                    }));
                } else {
                    let cur_user = data.get(0).unwrap();

                    if salt_password(&payload.password, &cur_user.salt) != cur_user.password {
                        return HttpResponse::Unauthorized().json(json!({
                            "code": 403,
                            "message": "Password incorrect."
                        }));
                    }


                    let token = random_string(256);

                    let updated_user = UpdateUser {
                        cur_token: Some(token.clone()),
                    };

                    match diesel::update(user.filter(id.eq(&cur_user.id)))
                        .set(updated_user)
                        .execute(connection) {
                            Ok(_r) => {
                                return HttpResponse::Ok().cookie(
                                    Cookie::build("A1TOKEN", token)
                                    .path("/")
                                    .secure(true)
                                    .http_only(true)
                                    .finish(),
                                ).json(json!({
                                    "code": 200
                                }));
                            },
                            Err(_e) => {
                                return HttpResponse::InternalServerError().json(json!({
                                    "code": 500,
                                    "message": "System error."
                                }));
                            }
                        }
                        
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
        let results = user.filter(username.eq(&payload.username).or(email.eq(&payload.email)))
            .select(User::as_select())
            .load::<User>(connection);

        match results {
            Ok(data) => {
                if data.len() == 0 {
                    let new_salt = generate_salt();
                    let salted_password = salt_password(&payload.password, &new_salt);
                    let new_user = SetUser {
                        id: Uuid::new_v4().to_string(),
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

                    match diesel::insert_into(user)
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
}