use chrono::NaiveDateTime;
use diesel::prelude::*;
use serde_derive::{Serialize, Deserialize};
use diesel_json::Json;
use crate::utils::k8s_tool::A1Container;

#[derive(Debug, Serialize, Deserialize)]
pub enum AttachmentType {
    STATICFILE,
    DYNAMICFILE,
    REMOTEFILE
}


#[derive(Debug, Serialize, Deserialize)]
pub struct AttachmentConfig {
    pub attach_name: String,
    pub attach_type: AttachmentType,
    pub attach_url: Option<String>,
    pub attach_hash: Option<String>,
    pub generate_script: Option<String>
}

#[derive(Debug, Serialize, Deserialize)]
pub enum JudgeType {
    STATIC,
    SCRIPT
}

#[derive(Debug, Serialize, Deserialize)]
pub struct JudgeConfig {
    pub judge_type: JudgeType,
    pub judge_script: Option<String>,
    pub flag_template: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Queryable, Selectable, Insertable, AsChangeset)]
#[allow(dead_code)]
#[diesel(table_name = crate::db::schema::challenges)]
pub struct Challenge {
    pub challenge_id: i64,
    pub name: String,
    pub description: String,
    pub category: i32,
    pub attachments: Json<Vec<AttachmentConfig>>,
    pub type_: i32,
    pub container_config: Option<Json<A1Container>>,
    pub create_time: NaiveDateTime,
    pub judge_config: Option<Json<JudgeConfig>>
}