package jobs

import (
	"a1ctf/src/db/models"
	"a1ctf/src/tasks"
	dbtool "a1ctf/src/utils/db_tool"
	k8stool "a1ctf/src/utils/k8s_tool"
	"fmt"
	"log"
	"strconv"
	"time"

	"a1ctf/src/utils/zaphelper"

	"go.uber.org/zap"
	v1 "k8s.io/api/core/v1"
)

func findExistContainer(containers []models.Container, teamHash string, inGameID int64) *models.Container {
	for _, container := range containers {
		if container.TeamHash == teamHash && container.InGameID == inGameID {
			return &container
		}
	}
	return nil
}

func findExistPod(podList []v1.Pod, teamHash string, inGameID int64) *v1.Pod {
	for _, pod := range podList {
		if pod.Labels["team_hash"] == teamHash && pod.Labels["ingame_id"] == fmt.Sprintf("%d", inGameID) {
			return &pod
		}
	}
	return nil
}

func getContainerPorts(podInfo k8stool.PodInfo, task *models.Container) error {
	ports, err := k8stool.GetPodPorts(&podInfo)
	if err != nil {
		return fmt.Errorf("getContainerPorts error: %w", err)
	} else {
		for index, container := range task.ContainerConfig {
			for _, expose_port := range container.ExposePorts {
				port_name := fmt.Sprintf("%d-%s", index, expose_port.Name)

				expose_ports := make([]models.ExposePort, 0)

				for _, port := range *ports {
					if port.Name == port_name {

						address, ok := k8stool.NodeAddressMap[port.NodeName]
						if !ok {
							address = port.NodeName
						}

						expose_ports = append(expose_ports, models.ExposePort{
							PortName: expose_port.Name,
							Port:     port.NodePort,
							IP:       address,
						})
					}
				}

				task.ContainerExposeInfos = append(task.ContainerExposeInfos, models.ContainerExposeInfo{
					ContainerName: container.Name,
					ExposePorts:   expose_ports,
				})
			}
		}

		if err := dbtool.DB().Model(&task).Updates(map[string]interface{}{
			"container_status": models.ContainerRunning,
			"expose_ports":     task.ContainerExposeInfos,
		}).Error; err != nil {
			return fmt.Errorf("failed to update container status: %v", err)
		}

		tasks.LogContainerOperation(nil, nil, models.ActionContainerStarted, task.ContainerID, map[string]interface{}{
			"team_hash":    task.TeamHash,
			"ingame_id":    task.InGameID,
			"pod_name":     podInfo.Name,
			"container_id": task.ContainerID,
		}, nil)
	}

	return nil
}

func deleteRunningPod(podInfo k8stool.PodInfo, task *models.Container) error {
	err := k8stool.DeletePod(&podInfo)
	if err != nil {
		tasks.LogContainerOperation(nil, nil, models.ActionContainerStopping, task.ContainerID, map[string]interface{}{
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
			return fmt.Errorf("failed to update container status: %v", err)
		}
	}

	tasks.LogContainerOperation(nil, nil, models.ActionContainerStopped, task.ContainerID, map[string]interface{}{
		"team_hash":    task.TeamHash,
		"ingame_id":    task.InGameID,
		"pod_name":     podInfo.Name,
		"container_id": task.ContainerID,
	}, nil)

	return nil
}

func UpdateLivingContainers() {

	// log.Println("UpdateLivingContainers")

	var containers []models.Container
	if err := dbtool.DB().Where("container_status != ? AND container_status != ?", models.ContainerError, models.ContainerStopped).Preload("Challenge").Preload("TeamFlag").Find(&containers).Error; err != nil {
		log.Fatalf("Failed to find queued containers: %v\n", err)
	}

	podList, err := k8stool.ListPods()
	if err != nil {
		zaphelper.Logger.Error("Failed to list pods", zap.Error(err))
		return
	}

	for _, pod := range podList.Items {
		podLabels := pod.Labels
		teamHash, exists1 := podLabels["team_hash"]
		inGameID, exists2 := podLabels["ingame_id"]

		if !exists1 || !exists2 {
			continue
		}

		inGameIDInt, err := strconv.ParseInt(inGameID, 10, 64)
		if err != nil {
			continue
		}

		container := findExistContainer(containers, teamHash, inGameIDInt)
		if container == nil {
			continue
		}

		podStatus := pod.Status.Phase

		podInfo := k8stool.PodInfo{
			Name:       fmt.Sprintf("cl-%d", container.InGameID),
			TeamHash:   container.TeamHash,
			Containers: container.ContainerConfig,
			Labels: map[string]string{
				"team_hash": container.TeamHash,
				"ingame_id": fmt.Sprintf("%d", container.InGameID),
			},
			Flag:     container.TeamFlag.FlagContent,
			AllowWAN: container.Challenge.AllowWAN,
			AllowDNS: container.Challenge.AllowDNS,
		}

		// fmt.Printf("%s -> %s, %s\n", pod.Name, pod.Status.Phase, container.ContainerStatus)

		if podStatus == v1.PodRunning && container.ContainerStatus == models.ContainerStarting {
			// 如果远程服务器Pod已经是Running状态，就获取端口并且更新数据库
			zaphelper.FileLogger.Info("Getting container port", zap.Any("container", container))
			getContainerPorts(podInfo, container)
		}

		if podStatus == v1.PodRunning && time.Now().UTC().After(container.ExpireTime) {
			// 如果远程服务器Pod已经是Running状态，并且已经超时，就删除Pod并且更新数据库
			zaphelper.FileLogger.Info("Stopping container", zap.Any("container", container))
			tasks.NewContainerStopTask(*container)
		}

		if podStatus == v1.PodRunning && container.ContainerStatus == models.ContainerStopped {
			zaphelper.FileLogger.Info("Stopping deaded container", zap.Any("container", container))
			tasks.NewContainerStopTask(*container)
		}
	}

	for _, container := range containers {
		if container.ContainerStatus == models.ContainerQueueing {
			if err := dbtool.DB().Model(&container).Update("container_status", models.ContainerStarting).Error; err != nil {
				zaphelper.Logger.Error("failed to update container status", zap.Error(err), zap.Any("container", container))
				continue
			}
			zaphelper.FileLogger.Info("Starting container", zap.Any("container", container))
			tasks.NewContainerStartTask(container)
		}

		if container.ContainerStatus == models.ContainerStopping {
			if err := dbtool.DB().Model(&container).Update("container_status", models.ContainerStopped).Error; err != nil {
				zaphelper.Logger.Error("failed to update container status", zap.Error(err), zap.Any("container", container))
				continue
			}
			zaphelper.FileLogger.Info("Stopping container", zap.Any("container", container))
			tasks.NewContainerStopTask(container)
		}
	}
}
