package models

import (
	k8stool "a1ctf/src/utils/k8s_tool"
	"database/sql/driver"
	"encoding/json"
	"errors"
	"time"
)

const TableNameChallenge = "challenges"

type AttachmentType string

const (
	AttachmentTypeStaticFile  AttachmentType = "STATICFILE"
	AttachmentTypeDynamicFile AttachmentType = "DYNAMICFILE"
	AttachmentTypeRemoteFile  AttachmentType = "REMOTEFILE"
)

type AttachmentConfig struct {
	AttachName     string         `json:"attach_name"`
	AttachType     AttachmentType `json:"attach_type"`
	AttachURL      *string        `json:"attach_url,omitempty"`
	AttachHash     *string        `json:"attach_hash,omitempty"`
	DownloadHash   *string        `json:"download_hash,omitempty"`
	GenerateScript *string        `json:"generate_script,omitempty"`
}

type AttachmentConfigs []AttachmentConfig

func (e AttachmentConfigs) Value() (driver.Value, error) {
	return json.Marshal(e)
}

func (e *AttachmentConfigs) Scan(value interface{}) error {
	b, ok := value.([]byte)
	if !ok {
		return errors.New("type assertion to []byte failed")
	}
	return json.Unmarshal(b, e)
}

type JudgeType string

const (
	JudgeTypeDynamic JudgeType = "DYNAMIC"
	JudgeTypeScript  JudgeType = "SCRIPT"
)

type JudgeConfig struct {
	JudgeType    JudgeType `json:"judge_type"`
	JudgeScript  *string   `json:"judge_script,omitempty"`
	FlagTemplate *string   `json:"flag_template,omitempty"`
}

func (e JudgeConfig) Value() (driver.Value, error) {
	return json.Marshal(e)
}

func (e *JudgeConfig) Scan(value interface{}) error {
	b, ok := value.([]byte)
	if !ok {
		return errors.New("type assertion to []byte failed")
	}
	return json.Unmarshal(b, e)
}

type ChallengeCategory string

const (
	CategoryWEB        ChallengeCategory = "WEB"
	CategoryPWN        ChallengeCategory = "PWN"
	CategoryREVERSE    ChallengeCategory = "REVERSE"
	CategoryMISC       ChallengeCategory = "MISC"
	CategoryCRYPTO     ChallengeCategory = "CRYPTO"
	CategoryPPC        ChallengeCategory = "PPC"
	CategoryAI         ChallengeCategory = "AI"
	CategoryBLOCKCHAIN ChallengeCategory = "BLOCKCHAIN"
	CategoryIOT        ChallengeCategory = "IOT"
	CategoryMOBILE     ChallengeCategory = "MOBILE"
	CategoryOSINT      ChallengeCategory = "OSINT"
	CategoryFORENSICS  ChallengeCategory = "FORENSICS"
	CategoryOTHER      ChallengeCategory = "OTHER"
)

func (e ChallengeCategory) Value() (driver.Value, error) {
	return json.Marshal(e)
}

func (e *ChallengeCategory) Scan(value interface{}) error {
	b, ok := value.([]byte)
	if !ok {
		return errors.New("type assertion to []byte failed")
	}
	return json.Unmarshal(b, e)
}

// Challenge mapped from table <challenges>
type Challenge struct {
	ChallengeID     *int64                `gorm:"column:challenge_id;primaryKey;autoIncrement:true" json:"challenge_id"`
	Name            string                `gorm:"column:name;not null" json:"name"`
	Description     string                `gorm:"column:description;not null" json:"description"`
	Category        ChallengeCategory     `gorm:"column:category;not null" json:"category"`
	Attachments     AttachmentConfigs     `gorm:"column:attachments;not null" json:"attachments"`
	Type            int32                 `gorm:"column:type;not null" json:"type"`
	ContainerConfig *k8stool.A1Containers `gorm:"column:container_config" json:"container_config"`
	CreateTime      time.Time             `gorm:"column:create_time;not null" json:"create_time"`
	JudgeConfig     *JudgeConfig          `gorm:"column:judge_config" json:"judge_config"`
}

// TableName Challenge's table name
func (*Challenge) TableName() string {
	return TableNameChallenge
}
