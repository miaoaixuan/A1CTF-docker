package tasks

import (
	"a1ctf/src/db/models"
	dbtool "a1ctf/src/utils/db_tool"
	"context"
	"fmt"

	"a1ctf/src/utils/zaphelper"

	"github.com/hibiken/asynq"
	"github.com/vmihailenco/msgpack/v5"
	"go.uber.org/zap"

	dockertool "a1ctf/src/utils/docker_tool"
)

type ContainerFailedPayload struct {
	Container       models.Container
	ContainerStatus dockertool.ContainerStatusDecision
}

func NewContainerStartTask(data models.Container) error {
	payload, err := msgpack.Marshal(data)
	if err != nil {
		return err
	}

	task := asynq.NewTask(TypeStartContainer, payload)
	_, err = client.Enqueue(task, asynq.TaskID(fmt.Sprintf("container_start_for_%d_%d", data.TeamID, data.InGameID)))
	return err
}

func NewContainerStopTask(data models.Container) error {
	payload, err := msgpack.Marshal(data)
	if err != nil {
		return err
	}

	task := asynq.NewTask(TypeStopContainer, payload)
	_, err = client.Enqueue(task, asynq.TaskID(fmt.Sprintf("container_stop_for_%d_%d", data.TeamID, data.InGameID)))
	return err
}

func NewContainerFailedTask(data models.Container, containerStatus dockertool.ContainerStatusDecision) error {
	payload, err := msgpack.Marshal(ContainerFailedPayload{
		Container:       data,
		ContainerStatus: containerStatus,
	})
	if err != nil {
		return err
	}

	task := asynq.NewTask(TypeContainerFailedOperation, payload)
	_, err = client.Enqueue(task, asynq.TaskID(fmt.Sprintf("container_failed_for_%d_%d", data.TeamID, data.InGameID)))
	return err
}

func HandleContainerStartTask(ctx context.Context, t *asynq.Task) error {
	var task models.Container
	if err := msgpack.Unmarshal(t.Payload(), &task); err != nil {
		return fmt.Errorf("json.Unmarshal failed: %v: %w", err, asynq.SkipRetry)
	}

	containerInfo := dockertool.ContainerInfo{
		Name:       fmt.Sprintf("cl-%d-%s", task.InGameID, task.TeamHash),
		TeamHash:   task.TeamHash,
		Containers: task.ContainerConfig,
		Labels: map[string]string{
			"team_hash":     task.TeamHash,
			"ingame_id":     fmt.Sprintf("%d", task.InGameID),
			"a1ctf.managed": "true",
		},
		Flag:     task.TeamFlag.FlagContent,
		AllowWAN: task.Challenge.AllowWAN,
		AllowDNS: task.Challenge.AllowDNS,
	}

	err := dockertool.CreateContainer(&containerInfo)
	if err != nil {
		// 记录容器创建失败日志
		LogContainerOperation(nil, nil, models.ActionContainerStarting, task.ContainerID, map[string]interface{}{
			"team_hash":      task.TeamHash,
			"ingame_id":      task.InGameID,
			"container_name": containerInfo.Name,
			"container_id":   task.ContainerID,
		}, err)
		zaphelper.Logger.Error("CreateContainer", zap.Error(err), zap.Any("task", task))
		// 强制关闭
		dbtool.DB().Model(&task).Update("container_status", models.ContainerStopping)
		return fmt.Errorf("CreateContainer %+v error: %v", task, err)
	} else {
		task.ContainerStatus = models.ContainerStarting
		if err := dbtool.DB().Model(&task).Update("container_status", task.ContainerStatus).Error; err != nil {
			LogContainerOperation(nil, nil, models.ActionContainerStarting, task.ContainerID, map[string]interface{}{
				"team_hash":      task.TeamHash,
				"ingame_id":      task.InGameID,
				"container_name": containerInfo.Name,
				"container_id":   task.ContainerID,
			}, err)
			return fmt.Errorf("failed to update container status: %v", err)
		}
	}

	return nil
}

func HandleContainerStopTask(ctx context.Context, t *asynq.Task) error {
	var task models.Container
	if err := msgpack.Unmarshal(t.Payload(), &task); err != nil {
		return fmt.Errorf("json.Unmarshal failed: %v: %w", err, asynq.SkipRetry)
	}

	containerInfo := dockertool.ContainerInfo{
		Name:       fmt.Sprintf("cl-%d-%s", task.InGameID, task.TeamHash),
		TeamHash:   task.TeamHash,
		Containers: task.ContainerConfig,
		Labels: map[string]string{
			"team_hash": task.TeamHash,
			"ingame_id": fmt.Sprintf("%d", task.InGameID),
		},
		Flag:     task.TeamFlag.FlagContent,
		AllowWAN: task.Challenge.AllowWAN,
		AllowDNS: task.Challenge.AllowDNS,
	}

	err := dockertool.DeleteContainer(&containerInfo)
	if err != nil {
		LogContainerOperation(nil, nil, models.ActionContainerStopping, task.ContainerID, map[string]interface{}{
			"team_hash":      task.TeamHash,
			"ingame_id":      task.InGameID,
			"container_name": containerInfo.Name,
			"container_id":   task.ContainerID,
		}, err)
		return fmt.Errorf("DeleteContainer %+v error: %v", task, err)
	} else {
		if err := dbtool.DB().Model(&task).Updates(map[string]interface{}{
			"container_status": models.ContainerStopped,
		}).Error; err != nil {
			LogContainerOperation(nil, nil, models.ActionContainerStarting, task.ContainerID, map[string]interface{}{
				"team_hash":      task.TeamHash,
				"ingame_id":      task.InGameID,
				"container_name": containerInfo.Name,
				"container_id":   task.ContainerID,
			}, err)
			return fmt.Errorf("failed to update container status: %v", err)
		}
	}

	LogContainerOperation(nil, nil, models.ActionContainerStopped, task.ContainerID, map[string]interface{}{
		"team_hash":      task.TeamHash,
		"ingame_id":      task.InGameID,
		"container_name": containerInfo.Name,
		"container_id":   task.ContainerID,
	}, nil)

	return nil
}

func HandleContainerFailedTask(ctx context.Context, t *asynq.Task) error {
	var payload ContainerFailedPayload
	if err := msgpack.Unmarshal(t.Payload(), &payload); err != nil {
		return fmt.Errorf("json.Unmarshal failed: %v: %w", err, asynq.SkipRetry)
	}

	task := payload.Container
	containerStatus := payload.ContainerStatus

	containerInfo := dockertool.ContainerInfo{
		Name:       fmt.Sprintf("cl-%d-%s", task.InGameID, task.TeamHash),
		TeamHash:   task.TeamHash,
		Containers: task.ContainerConfig,
		Labels: map[string]string{
			"team_hash": task.TeamHash,
			"ingame_id": fmt.Sprintf("%d", task.InGameID),
		},
		Flag:     task.TeamFlag.FlagContent,
		AllowWAN: task.Challenge.AllowWAN,
		AllowDNS: task.Challenge.AllowDNS,
	}

	err := dockertool.DeleteContainer(&containerInfo)
	if err != nil {
		LogContainerOperation(nil, nil, models.ActionContainerFailed, task.ContainerID, map[string]interface{}{
			"team_hash":      task.TeamHash,
			"ingame_id":      task.InGameID,
			"container_name": containerInfo.Name,
			"container_id":   task.ContainerID,
		}, err)
		return fmt.Errorf("DeleteContainer %+v error: %v", task, err)
	} else {
		if err := dbtool.DB().Model(&task).Updates(map[string]interface{}{
			"container_status": models.ContainerError,
		}).Error; err != nil {
			LogContainerOperation(nil, nil, models.ActionContainerFailed, task.ContainerID, map[string]interface{}{
				"team_hash":      task.TeamHash,
				"ingame_id":      task.InGameID,
				"container_name": containerInfo.Name,
				"container_id":   task.ContainerID,
			}, err)
			return fmt.Errorf("failed to update container status: %v", err)
		}
	}

	LogContainerOperation(nil, nil, models.ActionContainerFailed, task.ContainerID, map[string]interface{}{
		"team_hash":      task.TeamHash,
		"ingame_id":      task.InGameID,
		"container_name": containerInfo.Name,
		"container_id":   task.ContainerID,
		"reason":         containerStatus.Message,
	}, fmt.Errorf("failed to open container"))

	return nil
}
