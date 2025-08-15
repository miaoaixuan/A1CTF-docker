package dockertool

import (
	"fmt"
	"strings"

	"github.com/docker/docker/api/types"
)

type CustomContainerStatus string

const (
	CustomContainerRunning CustomContainerStatus = "ContainerRunning"
	CustomContainerFailed  CustomContainerStatus = "ContainerFailed"
	CustomContainerWaiting CustomContainerStatus = "ContainerWaiting"
)

// ContainerStatusDecision 表示对 Container 状态的处理决定
type ContainerStatusDecision struct {
	Status         CustomContainerStatus // 容器是否已经开启
	ShouldContinue bool                  // 是否继续等待
	ShouldReport   bool                  // 是否上报错误
	Message        string                // 状态信息
}

func CheckContainerStatus(container *types.Container) (ContainerStatusDecision, error) {
	switch container.State {
	case "running":
		return ContainerStatusDecision{
			Status:         CustomContainerRunning,
			ShouldContinue: false,
			ShouldReport:   false,
			Message:        "Container is running successfully",
		}, nil

	case "exited":
		// Check exit code from detailed inspection if needed
		return ContainerStatusDecision{
			Status:         CustomContainerFailed,
			ShouldContinue: false,
			ShouldReport:   true,
			Message:        fmt.Sprintf("Container exited: %s", container.Status),
		}, nil

	case "dead":
		return ContainerStatusDecision{
			Status:         CustomContainerFailed,
			ShouldContinue: false,
			ShouldReport:   true,
			Message:        "Container is dead",
		}, nil

	case "paused":
		return ContainerStatusDecision{
			Status:         CustomContainerWaiting,
			ShouldContinue: true,
			ShouldReport:   false,
			Message:        "Container is paused",
		}, nil

	case "restarting":
		return ContainerStatusDecision{
			Status:         CustomContainerWaiting,
			ShouldContinue: true,
			ShouldReport:   false,
			Message:        "Container is restarting",
		}, nil

	case "created":
		return ContainerStatusDecision{
			Status:         CustomContainerWaiting,
			ShouldContinue: true,
			ShouldReport:   false,
			Message:        "Container is created but not started",
		}, nil

	default:
		// Handle unknown states
		if isContainerFailureStatus(container.Status) {
			return ContainerStatusDecision{
				Status:         CustomContainerFailed,
				ShouldContinue: false,
				ShouldReport:   true,
				Message:        fmt.Sprintf("Container failed: %s", container.Status),
			}, nil
		}

		return ContainerStatusDecision{
			Status:         CustomContainerWaiting,
			ShouldContinue: true,
			ShouldReport:   false,
			Message:        fmt.Sprintf("Container state: %s - %s", container.State, container.Status),
		}, nil
	}
}

// isContainerFailureStatus 检查容器状态字符串是否表示失败
func isContainerFailureStatus(status string) bool {
	failureKeywords := []string{
		"failed",
		"error",
		"oomkilled",
		"killed",
		"unhealthy",
	}

	statusLower := strings.ToLower(status)
	for _, keyword := range failureKeywords {
		if strings.Contains(statusLower, keyword) {
			return true
		}
	}
	return false
}