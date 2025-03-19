pub mod game {
    use actix_web::{web, post, get, HttpResponse, Responder, HttpRequest};

    use actix_multipart::form::{tempfile::TempFile, MultipartForm};
    use diesel::query_dsl::methods::{FilterDsl, LimitDsl, SelectDsl};
    use diesel::{ExpressionMethods, RunQueryDsl, SelectableHelper};
    use serde_json::json;
    use mime;

    use crate::db::lib::establish_connection;
    use crate::db::models::upload_model::Upload;
    use crate::db::schema::uploads::dsl::*;
    use crate::UserClaims;
    use chrono::{Datelike, Local};
    use actix_files::NamedFile;

    use serde_derive::{Serialize, Deserialize};

    use std::path::Path;
    use std::fs;

    #[derive(Debug, Serialize, Deserialize)]
    struct ListGamePayload {
        username: String,
        password: String,
        captcha: Option<String>
    }

    #[post("/api/admin/game/list")]
    pub async fn list(jwt_user: UserClaims, payload: web::Json<ListGamePayload>,) -> impl Responder {
        return HttpResponse::Ok().json(json!({
            "code": 200,
            "file": format!("{:?}", 123)
        }));
    }

}