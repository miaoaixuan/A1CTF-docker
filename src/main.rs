use actix_web::{middleware::Logger, App, HttpServer};
use env_logger::Env;

mod controllers;
mod db;
mod utils;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    env_logger::init_from_env(Env::default().default_filter_or("info"));

    HttpServer::new(|| {
        let mut app = App::new().wrap(Logger::default()).wrap(Logger::new("%a %{User-Agent}i"));
        
        app = app
            // user_controller
            .service(controllers::user::login)
            .service(controllers::user::register);
        
        app
    })
    .bind(("127.0.0.1", 8080))?
    .run()
    .await
}