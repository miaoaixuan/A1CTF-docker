pub mod user {
    use actix_web::{web, get, HttpResponse, Responder};

    use crate::db::lib::establish_connection;
    use crate::db::schema::user::dsl::*;
    use crate::db::models::*;
    use diesel::prelude::*;

    #[get("/hello/{name}")]
    pub async fn greet(name: web::Path<String>) -> impl Responder {
        let connection = &mut establish_connection();
        let results = user
            .limit(1)
            .select(User::as_select())
            .load::<User>(connection)
            .expect("Error loading posts");

        for data in &results {
            println!("{:?}", data); 
        }
        HttpResponse::Ok().body(format!("Hello {name}!"))
    }
}