package k8stool

import (
	"fmt"
	"strings"

	corev1 "k8s.io/api/core/v1"
)

type CustomPodStatus string

const (
	CustomPodRunning CustomPodStatus = "PodRunning"
	CustomPodFailed  CustomPodStatus = "PodFailed"
	CustomPodWaiting CustomPodStatus = "PodWaiting"
)

// PodStatusDecision 表示对 Pod 状态的处理决定
type PodStatusDecision struct {
	Status         CustomPodStatus //容器是否已经开启
	ShouldContinue bool            // 是否继续等待
	ShouldReport   bool            // 是否上报错误
	Message        string          // 状态信息
}

func CheckPodStatus(pod *corev1.Pod) (PodStatusDecision, error) {
	switch pod.Status.Phase {
	case corev1.PodRunning:
		return PodStatusDecision{
			Status:         CustomPodRunning,
			ShouldContinue: false,
			ShouldReport:   false,
			Message:        "Pod is running successfully",
		}, nil

	case corev1.PodSucceeded:
		return PodStatusDecision{
			Status:         CustomPodRunning,
			ShouldContinue: false,
			ShouldReport:   false,
			Message:        "Pod completed successfully",
		}, nil

	case corev1.PodFailed:
		return handleFailedPod(pod)

	case corev1.PodPending:
		return handlePendingPod(pod)

	case corev1.PodUnknown:
		return PodStatusDecision{
			Status:         CustomPodFailed,
			ShouldContinue: false,
			ShouldReport:   true,
			Message:        "Pod status is unknown",
		}, nil

	default:
		return PodStatusDecision{
			Status:         CustomPodWaiting,
			ShouldContinue: true,
			ShouldReport:   false,
			Message:        fmt.Sprintf("Waiting for pod to stabilize (current phase: %s)", pod.Status.Phase),
		}, nil
	}
}
func handleFailedPod(pod *corev1.Pod) (PodStatusDecision, error) {
	// 检查容器状态获取更详细的信息
	for _, containerStatus := range pod.Status.ContainerStatuses {
		if containerStatus.State.Terminated != nil && containerStatus.State.Terminated.ExitCode != 0 {
			return PodStatusDecision{
				Status:         CustomPodFailed,
				ShouldContinue: false,
				ShouldReport:   true,
				Message: fmt.Sprintf("Container %s failed with exit code %d: %s",
					containerStatus.Name,
					containerStatus.State.Terminated.ExitCode,
					containerStatus.State.Terminated.Message),
			}, nil
		}
	}

	return PodStatusDecision{
		Status:         CustomPodFailed,
		ShouldContinue: false,
		ShouldReport:   true,
		Message:        "Pod failed but no specific container error found",
	}, nil
}

// handlePendingPod 处理 Pending 状态的 Pod
func handlePendingPod(pod *corev1.Pod) (PodStatusDecision, error) {
	// 检查 Pod 条件
	for _, condition := range pod.Status.Conditions {
		if condition.Type == corev1.PodScheduled && condition.Status == corev1.ConditionFalse {
			// 无法调度的情况
			return PodStatusDecision{
				Status:         CustomPodFailed,
				ShouldContinue: false,
				ShouldReport:   true,
				Message:        fmt.Sprintf("Pod cannot be scheduled: %s", condition.Message),
			}, nil
		}
	}

	// 检查容器状态
	for _, containerStatus := range pod.Status.ContainerStatuses {
		if containerStatus.State.Waiting != nil {
			switch containerStatus.State.Waiting.Reason {
			case "ErrImagePull", "ImagePullBackOff":
				return PodStatusDecision{
					Status:         CustomPodFailed,
					ShouldContinue: false,
					ShouldReport:   true,
					Message: fmt.Sprintf("Failed to pull image for container %s: %s",
						containerStatus.Name, containerStatus.State.Waiting.Message),
				}, nil

			case "ContainerCreating", "PodInitializing":
				// 这些是正常等待状态
				continue

			default:
				// 其他等待状态可能需要特殊处理
				return PodStatusDecision{
					Status:         CustomPodWaiting,
					ShouldContinue: true,
					ShouldReport:   false,
					Message: fmt.Sprintf("Container %s is waiting: %s",
						containerStatus.Name, containerStatus.State.Waiting.Reason),
				}, nil
			}
		}
	}

	// 检查资源情况
	if pod.Status.Reason == "Unschedulable" {
		// 检查是否是因为资源不足
		for _, condition := range pod.Status.Conditions {
			if condition.Type == corev1.PodScheduled && condition.Reason == corev1.PodReasonUnschedulable {
				if isResourceRelatedMessage(condition.Message) {
					// 资源不足，可以等待或上报
					return PodStatusDecision{
						Status:         CustomPodWaiting,
						ShouldContinue: true, // 可以等待资源释放
						ShouldReport:   false,
						Message:        fmt.Sprintf("Waiting for resources: %s", condition.Message),
					}, nil
				}
				return PodStatusDecision{
					Status:         CustomPodFailed,
					ShouldContinue: false,
					ShouldReport:   true,
					Message:        fmt.Sprintf("Unschedulable: %s", condition.Message),
				}, nil
			}
		}
	}

	// 默认情况下，继续等待 Pending 状态
	return PodStatusDecision{
		Status:         CustomPodWaiting,
		ShouldContinue: true,
		ShouldReport:   false,
		Message:        "Pod is pending, waiting for initialization",
	}, nil
}

// isResourceRelatedMessage 检查消息是否与资源相关
func isResourceRelatedMessage(message string) bool {
	// 这里可以根据实际情况添加更多关键词
	resourceKeywords := []string{
		"insufficient cpu",
		"insufficient memory",
		"no nodes available",
		"resource quota",
		"out of",
	}

	for _, keyword := range resourceKeywords {
		if strings.Contains(strings.ToLower(message), keyword) {
			return true
		}
	}
	return false
}
