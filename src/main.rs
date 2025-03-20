use actix_multipart::MultipartError;
use actix_multipart::form::MultipartFormConfig;
use actix_web::dev::Service;
use actix_web::http::StatusCode;
use actix_web::{
    App, HttpRequest, HttpResponse, HttpServer, body::to_bytes, middleware::Logger, web,
};
use actix_web::{Error, ResponseError};
use dotenvy::dotenv;
use env_logger::Env;
use futures_util::future::{FutureExt, TryFutureExt};

use utils::crypto_helper::*;
use utils::k8s_tool::*;

use std::env;

use actix_jwt_auth_middleware::{Authority, FromRequest, TokenSigner, use_jwt::UseJWTOnApp};
use jwt_compact::alg::{Hs256, Hs256Key};

use serde_derive::{Deserialize, Serialize};

mod controllers;
mod db;
mod utils;

#[derive(Debug, Serialize)]
struct ErrorResponse {
    code: u16,
    message: String,
}

impl ErrorResponse {
    fn new(code: u16, message: &str) -> Self {
        ErrorResponse {
            code,
            message: message.to_string(),
        }
    }
}

impl std::fmt::Display for ErrorResponse {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}: {}", self.code, self.message)
    }
}

impl ResponseError for ErrorResponse {
    fn status_code(&self) -> StatusCode {
        StatusCode::from_u16(self.code).unwrap_or(StatusCode::INTERNAL_SERVER_ERROR) // 默认使用 500 错误码
    }

    fn error_response(&self) -> HttpResponse {
        HttpResponse::build(self.status_code()).json(self) // 返回 JSON 格式的错误响应
    }
}

#[derive(Serialize, Deserialize, Clone, FromRequest)]
pub struct UserClaims {
    username: String,
    id: String,
    role: Role,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub enum Role {
    User,
    Monitor,
    Admin,
}

fn handle_multipart_error(err: MultipartError, req: &HttpRequest) -> Error {
    // logging::log!("Multipart error: {}", err);
    return Error::from(err);
}

#[tokio::main]
async fn main() -> std::io::Result<()> {
    dotenv().ok();

    // let pod_config = PodInfo {
    //     name: format!("testpod-{}", random_string_lower(0)),
    //     team_hash: "f489bfadc7284".to_string(),
    //     containers: vec![
    //         A1Container {
    //             name: "eval".to_string(),
    //             image: "127.0.0.1:6440/ez_eval".to_string(),
    //             command: None,
    //             env: Some(vec![
    //                 k8s_openapi::api::core::v1::EnvVar {
    //                     name: "SUPER_SECRET".to_string(),
    //                     value: Some("env".to_string()),
    //                     value_from: None
    //                 }
    //             ]),
    //             expose_ports: Some(vec![PortName {
    //                 name: "http1".to_string(),
    //                 port: 80,
    //             }]),
    //         }
    //     ]
    // };

    // println!("{}", serde_json::to_string(&pod_config).unwrap());

    env_logger::init_from_env(Env::default().default_filter_or("info"));

    let _ = HttpServer::new(|| {
        let secret_key =
            Hs256Key::new(env::var("SUPER_SECRET_KEY").expect("SUPER_SECRET_KEY must be set"));

        let authority = Authority::<UserClaims, Hs256, _, _>::new()
            .refresh_authorizer(|| async move { Ok(()) })
            .token_signer(Some(
                TokenSigner::new()
                    .signing_key(secret_key.clone())
                    .algorithm(Hs256)
                    .build()
                    .expect(""),
            ))
            .verifying_key(secret_key)
            .build()
            .expect("");

        let mut app = App::new()
            .wrap_fn(|req, srv| {
                srv.call(req).then(|res| async {
                    match res {
                        Ok(service_response) => {
                            let is_json = service_response
                                .headers()
                                .get("Content-Type")
                                .and_then(|h| h.to_str().ok())
                                .map(|ct| ct.contains("application/json"))
                                .unwrap_or(false);

                            if service_response.status().as_u16() == 400 && !is_json {
                                match to_bytes(service_response.into_body()).await {
                                    Ok(bytes) => {
                                        // 将字节转换为字符串
                                        let body_str = String::from_utf8_lossy(&bytes);
                                        Err(ErrorResponse::new(400, &body_str).into())
                                    }
                                    Err(e) => Err(ErrorResponse::new(500, &e.to_string()).into()),
                                }
                            } else {
                                Ok(service_response)
                            }
                        }
                        Err(e) => Err(ErrorResponse::new(500, &e.to_string()).into()),
                    }

                    // ErrorResponse::new("InternalError", &e.to_string()).into()
                })
            })
            .wrap(Logger::default())
            // .wrap(Logger::new("%a %{User-Agent}i"))
            .app_data(
                MultipartFormConfig::default()
                    .total_limit(10 * 1024 * 1024 * 1024) // 10 GB
                    .memory_limit(100 * 1024 * 1024) // 10 MB
                    .error_handler(handle_multipart_error),
            );

        app = app
            // user_controller
            .service(controllers::user::login)
            .service(controllers::user::register)
            .service(controllers::file::download)
            .use_jwt(
                authority,
                web::scope("")
                    .service(controllers::user::test)
                    .service(controllers::challenge::list)
                    .service(controllers::challenge::create)
                    .service(controllers::challenge::delete)
                    .service(controllers::challenge::update)
                    .service(controllers::challenge::get)
                    .service(controllers::challenge::search)

                    .service(controllers::file::upload)
                    .service(controllers::game::list)
                    .service(controllers::game::create)
                    .service(controllers::game::get)
            );

        app
    })
    .bind(("127.0.0.1", 8080))?
    .run()
    .await;

    Ok(())
}

// #[tokio::main]
// async fn main() -> Result<(), Box<dyn std::error::Error>> {
//     use utils::k8s_tool::*;

//     init_namespace().await?;
//     list_pods().await?;

//     let pod_config = PodInfo {
//         name: format!("testpod-{}", random_string_lower(0)),
//         team_hash: "f489bfadc7284".to_string(),
//         containers: vec![
//             A1Container {
//                 name: "eval".to_string(),
//                 image: "127.0.0.1:6440/ez_eval".to_string(),
//                 command: None,
//                 env: None,
//                 expose_ports: Some(vec![PortName {
//                     name: "http1".to_string(),
//                     port: 80,
//                 }]),
//             },
//             A1Container {
//                 name: "nc-test".to_string(),
//                 image: "127.0.0.1:6440/nc_me_please".to_string(),
//                 command: None,
//                 env: None,
//                 expose_ports: Some(vec![PortName {
//                     name: "pwn".to_string(),
//                     port: 70,
//                 }]),
//             }
//         ]
//     };

//     // create_pod(&pod_config).await?;
//     // get_pod_ports(&pod_config).await?;
//     // list_pods().await?;
//     delete_pod(&pod_config).await?;

//     Ok(())
// }
