use actix_web::{middleware::Logger, App, HttpServer, web};
use dotenvy::dotenv;
use env_logger::Env;
use std::env;

use jwt_compact::alg::{Hs256, Hs256Key};
use actix_jwt_auth_middleware::{use_jwt::UseJWTOnApp, Authority, FromRequest, TokenSigner};

use serde_derive::{Serialize, Deserialize};

mod controllers;
mod db;
mod utils;

#[derive(Serialize, Deserialize, Clone, FromRequest)]
pub struct UserClaims {
    username: String,
    id: String,
    role: Role
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub enum Role {
    User,
    Monitor,
    Admin,
}

#[tokio::main]
async fn main() -> std::io::Result<()> {
    dotenv().ok();
    
    env_logger::init_from_env(Env::default().default_filter_or("info"));

    let _ = HttpServer::new(|| {
        
        let secret_key = Hs256Key::new(env::var("SUPER_SECRET_KEY").expect("SUPER_SECRET_KEY must be set"));

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
        
        let mut app = App::new().wrap(Logger::default()).wrap(Logger::new("%a %{User-Agent}i"));
        
        app = app
            // user_controller
            .service(controllers::user::login)
            .service(controllers::user::register)

            .use_jwt(authority, web::scope("")
                .service(controllers::user::test)
                .service(controllers::challenge::list)
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