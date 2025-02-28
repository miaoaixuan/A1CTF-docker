// use actix_web::{middleware::Logger, App, HttpServer};
// use env_logger::Env;
// use utils::k8s_tool::list_pods;

use k8s_openapi::api::core::v1::Pod;

mod controllers;
mod db;
mod utils;

// #[tokio::main]
// async fn main() -> std::io::Result<()> {
//     env_logger::init_from_env(Env::default().default_filter_or("info"));

//     let _ = HttpServer::new(|| {
//         let mut app = App::new().wrap(Logger::default()).wrap(Logger::new("%a %{User-Agent}i"));
        
//         app = app
//             // user_controller
//             .service(controllers::user::login)
//             .service(controllers::user::register);
        
//         app
//     })
//     .bind(("127.0.0.1", 8080))?
//     .run()
//     .await;

//     Ok(())
// }

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    use utils::k8s_tool::*;

    init_namespace().await?;
    list_pods().await?;

    let pod_config = PodInfo {
        name: "testpod".to_string(),
        team_hash: "f489bfadc7284".to_string(),
        containers: vec![
            A1Container {
                name: "eval".to_string(),
                image: "127.0.0.1:6440/ez_eval".to_string(),
                command: None,
                env: None,
                expose_ports: Some(vec![80]),
            }
        ]
    };

    create_pod(&pod_config).await?;
    get_pod_ports(&pod_config).await?;
    // delete_pod(&pod_config).await?;
    list_pods().await?;

    Ok(())
}