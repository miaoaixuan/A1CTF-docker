pub mod file {
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

    use std::path::Path;
    use std::fs;

    // use sha2::{Sha256, Digest};
    // use std::fs::{self, File};
    // use std::io::{BufReader, Read};
    // use tempfile::NamedTempFile;

    // fn calculate_file_hash(file: &NamedTempFile) -> Result<String, std::io::Error> {
    //     // 打开临时文件
    //     let f = File::open(file.path())?;
    //     let mut reader = BufReader::new(f);
    //     let mut hasher = Sha256::new();
    //     let mut buffer = [0; 4096];
    
    //     // 分块读取文件并更新哈希计算
    //     loop {
    //         let count = reader.read(&mut buffer)?;
    //         if count == 0 {
    //             break;
    //         }
    //         hasher.update(&buffer[..count]);
    //     }
    
    //     // 获取最终的哈希值，并以十六进制字符串返回
    //     let hash = hasher.finalize();
    //     Ok(format!("{:x}", hash))
    // }

    #[derive(Debug, MultipartForm)]
    struct UploadForm {
        #[multipart(limit = "2048MB")]
        file: TempFile,
        // json: MPJson<Metadata>,
    }

    #[post("/api/file/upload")]
    pub async fn upload(jwt_user: UserClaims, MultipartForm(form): MultipartForm<UploadForm>) -> impl Responder {

        let mut new_file_uuid = uuid::Uuid::new_v4();
        let connection = &mut establish_connection();

        loop {
            match uploads.filter(file_id.eq(new_file_uuid))
                .limit(1)
                .select(Upload::as_select())
                .load::<Upload>(connection) {
                Ok(results) => {
                    if results.is_empty() {
                        break;
                    } else {
                        new_file_uuid = uuid::Uuid::new_v4();
                    }
                },
                Err(_) => {
                    return HttpResponse::InternalServerError().json(json!({
                        "code": 500,
                        "message": "Database query failed"
                    }));
                }
            }
        }

        let current_time = Local::now().naive_local();

        let store_pathh = format!("./uploads/{}/{}", current_time.month().to_string(), current_time.day().to_string());
        let store_path = Path::new(&store_pathh);
        let _ = fs::create_dir_all(store_path);

        let new_file_path = format!("{}/{}", store_pathh, new_file_uuid);

        match form.file.file.persist(new_file_path.to_string()) {
            Ok(_) => {
                let new_file = Upload {
                    file_id: new_file_uuid,
                    user_id: uuid::Uuid::parse_str(&jwt_user.id).unwrap(),
                    file_name: form.file.file_name.unwrap().to_string(),
                    file_path: new_file_path.to_string(),
                    file_hash: "".to_string(),
                    file_type: form.file.content_type.unwrap().to_string(),
                    file_size: 0,
                    upload_time: current_time
                };

                match diesel::insert_into(uploads)
                    .values(&new_file)
                    .execute(connection) {
                        Ok(_r) => {
                            return HttpResponse::Ok().json(json!({
                                "code": 200,
                                "file_id": format!("{:?}", new_file_uuid)
                            }));
                        },
                        Err(_e) => {
                            return HttpResponse::InternalServerError().json(json!({
                                "code": 501,
                                "message": "System error."
                            }));
                        }
                    } 
            },
            Err(_) => {
                return HttpResponse::InternalServerError().json(json!({
                    "code": 500,
                    "message": "Failed to move file"
                }));
            }
        };
    }

    #[get("/api/file/download/{file_id}")]
    pub async fn download(
        req: HttpRequest,
        path_file_id: web::Path<String>,
    ) -> impl Responder {
        let target_file_id = uuid::Uuid::parse_str(&path_file_id).unwrap();
        let connection = &mut establish_connection();

        // 查询数据库中对应的文件记录
        let file_record = uploads
            .filter(file_id.eq(target_file_id))
            .first::<Upload>(connection);

        match file_record {
            Ok(upload_record) => {
                // 检查文件是否存在
                if !Path::new(&upload_record.file_path).exists() {
                    return HttpResponse::NotFound().json(json!({
                        "code": 404,
                        "message": "File not found on server"
                    }));
                }
                // 异步打开文件
                match NamedFile::open_async(&upload_record.file_path).await {
                    Ok(named_file) => {
                        // 解析数据库中的 file_type 字段为 mime 类型，失败则默认使用 application/octet-stream
                        let content_type: mime::Mime = upload_record.file_type.parse()
                            .unwrap_or(mime::APPLICATION_OCTET_STREAM);
                        // 设置 Content-Type 响应头
                        let named_file = named_file.set_content_type(content_type);
                        named_file.into_response(&req)
                    },
                    Err(_) => HttpResponse::InternalServerError().json(json!({
                        "code": 500,
                        "message": "Error reading file"
                    })),
                }
            },
            Err(_) => HttpResponse::NotFound().json(json!({
                "code": 404,
                "message": "File record not found"
            })),
        }
    }

}