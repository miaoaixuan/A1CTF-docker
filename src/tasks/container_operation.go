package tasks

import k8stool "a1ctf/src/utils/k8s_tool"

type ContainerOperationType string

const (
	CreateContainer ContainerOperationType = "CreateContainer"
	StopContainer   ContainerOperationType = "StopContainer"
)

type ContainerOperation struct {
	OperationType   ContainerOperationType `json:"operation_type"`
	ContainerID     string                 `json:"container_id"`
	ChallengeName   string                 `json:"challenge_name"`
	TeamHash        string                 `json:"team_hash"`
	ContainerConfig *k8stool.A1Containers  `json:"container_config"`
}
