package tasks

import (
	"a1ctf/src/db/models"
	dbtool "a1ctf/src/utils/db_tool"
	"context"
	"fmt"
	"log"

	"a1ctf/src/utils/zaphelper"

	"github.com/hibiken/asynq"
	"github.com/vmihailenco/msgpack/v5"
	"go.uber.org/zap"

	k8stool "a1ctf/src/utils/k8s_tool"
)

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

func HandleContainerStartTask(ctx context.Context, t *asynq.Task) error {
	var task models.Container
	if err := msgpack.Unmarshal(t.Payload(), &task); err != nil {
		return fmt.Errorf("json.Unmarshal failed: %v: %w", err, asynq.SkipRetry)
	}

	podInfo := k8stool.PodInfo{
		Name:       fmt.Sprintf("cl-%d", task.InGameID),
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

	err := k8stool.CreatePod(&podInfo)
	if err != nil {
		// 记录容器创建失败日志
		LogContainerOperation(nil, nil, models.ActionContainerStarting, task.ContainerID, map[string]interface{}{
			"team_hash":    task.TeamHash,
			"ingame_id":    task.InGameID,
			"pod_name":     podInfo.Name,
			"container_id": task.ContainerID,
		}, err)
		zaphelper.Logger.Error("CreatePod", zap.Error(err), zap.Any("task", task))
		// 强制关闭
		dbtool.DB().Model(&task).Update("container_status", models.ContainerStopping)
		return fmt.Errorf("CreatePod %+v error: %v", task, err)
	} else {
		task.ContainerStatus = models.ContainerStarting
		if err := dbtool.DB().Model(&task).Update("container_status", task.ContainerStatus).Error; err != nil {
			LogContainerOperation(nil, nil, models.ActionContainerStarting, task.ContainerID, map[string]interface{}{
				"team_hash":    task.TeamHash,
				"ingame_id":    task.InGameID,
				"pod_name":     podInfo.Name,
				"container_id": task.ContainerID,
			}, err)
			return fmt.Errorf("failed to update container status: %v", err)
		}
	}

	LogContainerOperation(nil, nil, models.ActionContainerStarted, task.ContainerID, map[string]interface{}{
		"team_hash":    task.TeamHash,
		"ingame_id":    task.InGameID,
		"pod_name":     podInfo.Name,
		"container_id": task.ContainerID,
	}, nil)

	return nil
}

func HandleContainerStopTask(ctx context.Context, t *asynq.Task) error {
	var task models.Container
	if err := msgpack.Unmarshal(t.Payload(), &task); err != nil {
		return fmt.Errorf("json.Unmarshal failed: %v: %w", err, asynq.SkipRetry)
	}

	podInfo := k8stool.PodInfo{
		Name:       fmt.Sprintf("cl-%d", task.InGameID),
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

	log.Printf("data %+v\n", podInfo)
	err := k8stool.DeletePod(&podInfo)
	if err != nil {
		LogContainerOperation(nil, nil, models.ActionContainerStopping, task.ContainerID, map[string]interface{}{
			"team_hash":    task.TeamHash,
			"ingame_id":    task.InGameID,
			"pod_name":     podInfo.Name,
			"container_id": task.ContainerID,
		}, err)
		return fmt.Errorf("DeletePod %+v error: %v", task, err)
	} else {
		if err := dbtool.DB().Model(&task).Updates(map[string]interface{}{
			"container_status": models.ContainerStopped,
		}).Error; err != nil {
			LogContainerOperation(nil, nil, models.ActionContainerStarting, task.ContainerID, map[string]interface{}{
				"team_hash":    task.TeamHash,
				"ingame_id":    task.InGameID,
				"pod_name":     podInfo.Name,
				"container_id": task.ContainerID,
			}, err)
			return fmt.Errorf("failed to update container status: %v", err)
		}
	}

	LogContainerOperation(nil, nil, models.ActionContainerStopped, task.ContainerID, map[string]interface{}{
		"team_hash":    task.TeamHash,
		"ingame_id":    task.InGameID,
		"pod_name":     podInfo.Name,
		"container_id": task.ContainerID,
	}, nil)

	return nil
}
