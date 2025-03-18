use chrono::NaiveDateTime;
use diesel::prelude::*;
use serde_derive::{Serialize, Deserialize};
use diesel_json::Json;
use crate::utils::k8s_tool::{A1Container, PodInfo};
use std::str::FromStr;
use strum_macros::{EnumString, Display};


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
    pub download_hash: Option<String>,
    pub generate_script: Option<String>
}

#[derive(Debug, Serialize, Deserialize)]
pub enum JudgeType {
    DYNAMIC,
    SCRIPT
}

#[derive(Debug, Serialize, Deserialize)]
pub struct JudgeConfig {
    pub judge_type: JudgeType,
    pub judge_script: Option<String>,
    pub flag_template: Option<String>,
}

#[derive(Debug, EnumString, Display, Serialize, Deserialize)]
#[strum(ascii_case_insensitive)]
pub enum ChallengeCategory {
    #[strum(serialize = "WEB")]
    WEB = 0,
    #[strum(serialize = "PWN")]
    PWN = 1,
    #[strum(serialize = "REVERSE")]
    REVERSE = 2,
    #[strum(serialize = "MISC")]
    MISC = 3,
    #[strum(serialize = "CRYPTO")]
    CRYPTO = 4,
    #[strum(serialize = "PPC")]
    PPC = 5,
    #[strum(serialize = "AI")]
    AI = 6,
    #[strum(serialize = "BLOCKCHAIN")]
    BLOCKCHAIN = 7,
    #[strum(serialize = "IOT")]
    IOT = 8,
    #[strum(serialize = "MOBILE")]
    MOBILE = 9,
    #[strum(serialize = "OSINT")]
    OSINT = 10,
    #[strum(serialize = "FORENSICS")]
    FORENSICS = 11,
    #[strum(serialize = "OTHER")]
    OTHER = 12,
}

#[derive(Debug, Serialize, Deserialize, Queryable, Selectable, AsChangeset)]
#[allow(dead_code)]
#[diesel(table_name = crate::db::schema::challenges)]
pub struct Challenge {
    pub challenge_id: i64,
    pub name: String,
    pub description: String,
    pub category: Json<ChallengeCategory>,
    pub attachments: Json<Vec<AttachmentConfig>>,
    pub type_: i32,
    pub container_config: Option<Json<Vec<A1Container>>>,
    pub create_time: NaiveDateTime,
    pub judge_config: Option<Json<JudgeConfig>>
}

#[derive(Debug, Serialize, Deserialize, Insertable, AsChangeset)]
#[allow(dead_code)]
#[diesel(table_name = crate::db::schema::challenges)]
pub struct SetChallenge {
    pub name: String,
    pub description: String,
    pub category: Json<ChallengeCategory>,
    pub attachments: Json<Vec<AttachmentConfig>>,
    pub type_: i32,
    pub container_config: Option<Json<Vec<A1Container>>>,
    pub create_time: NaiveDateTime,
    pub judge_config: Option<Json<JudgeConfig>>
}