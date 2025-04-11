package models

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"time"
)

const TableNameContainer = "containers"

type ExposePort struct {
	Name string `json:"name"`
	Port int32  `json:"port"`
	IP   string `json:"ip"`
}

type ExposePorts []ExposePort

func (e ExposePorts) Value() (driver.Value, error) {
	return json.Marshal(e)
}

func (e *ExposePorts) Scan(value interface{}) error {
	b, ok := value.([]byte)
	if !ok {
		return errors.New("type assertion to []byte failed")
	}
	return json.Unmarshal(b, e)
}

type ContainerStatus string

const (
	ContainerStopped  ChallengeContainerType = "ContainerStopped"
	ContainerRunning  ChallengeContainerType = "ContainerRunning"
	ContainerQueueing ChallengeContainerType = "ContainerQueueing"
)

func (e ContainerStatus) Value() (driver.Value, error) {
	return json.Marshal(e)
}

func (e *ContainerStatus) Scan(value interface{}) error {
	b, ok := value.([]byte)
	if !ok {
		return errors.New("type assertion to []byte failed")
	}
	return json.Unmarshal(b, e)
}

// Container mapped from table <containers>
type Container struct {
	ContainerID     string          `gorm:"column:container_id;primaryKey" json:"container_id"`
	GameID          int64           `gorm:"column:game_id;not null" json:"game_id"`
	TeamID          int64           `gorm:"column:team_id;not null" json:"team_id"`
	ChallengeID     int64           `gorm:"column:challenge_id;not null" json:"challenge_id"`
	StartTime       time.Time       `gorm:"column:start_time;not null" json:"start_time"`
	ExpireTime      time.Time       `gorm:"column:expire_time;not null" json:"expire_time"`
	ExposePorts     ExposePorts     `gorm:"column:expose_ports;not null" json:"expose_ports"`
	ContainerStatus ContainerStatus `gorm:"column:container_status;not null" json:"container_status"`
	FlagContent     string          `gorm:"column:flag_content;not null" json:"flag_content"`
}

// TableName Container's table name
func (*Container) TableName() string {
	return TableNameContainer
}
