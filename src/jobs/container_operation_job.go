package jobs

import (
	"a1ctf/src/db/models"
	"a1ctf/src/tasks"
	dbtool "a1ctf/src/utils/db_tool"
	dockertool "a1ctf/src/utils/docker_tool"
	"fmt"
	"log"
	"strconv"
	"time"

	"a1ctf/src/utils/zaphelper"

	"go.uber.org/zap"
	"github.com/docker/docker/api/types"
)

func findExistContainer(containers []models.Container, teamHash string, inGameID int64) *models.Container {
	for _, container := range containers {
		if container.TeamHash == teamHash && container.InGameID == inGameID {
			return &container
		}
	}
	return nil
}

func findExistDockerContainer(containers []types.Container, teamHash string, inGameID int64) *types.Container {
	for _, container := range containers {
		if container.Labels["a1ctf.team_hash"] == teamHash && 
		   container.Labels["a1ctf.ingame_id"] == fmt.Sprintf("%d", inGameID) {
			return &container
		}
	}
	return nil
}

func getContainerPorts(containerInfo dockertool.ContainerInfo, task *models.Container) error {
	ports, err := dockertool.GetContainerPorts(&containerInfo)
	if err != nil {
		return fmt.Errorf("getContainerPorts error: %w", err)
	} else {
		for index, container := range task.ContainerConfig {
			for _, expose_port := range container.ExposePorts {
				port_name := fmt.Sprintf("%d-%s", index, expose_port.Name)

				expose_ports := make([]models.ExposePort, 0)

				for _, port := range *ports {
					if port.Name == port_name || port.Name == fmt.Sprintf("%d/tcp", expose_port.Port) {
						expose_ports = append(expose_ports, models.ExposePort{
							PortName: expose_port.Name,
							Port:     port.HostPort,
							IP:       "localhost", // For Docker, we use localhost since it's single machine
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
			"team_hash":      task.TeamHash,
			"ingame_id":      task.InGameID,
			"container_name": containerInfo.Name,
			"container_id":   task.ContainerID,
		}, nil)
	}

	return nil
}

func deleteRunningContainer(containerInfo dockertool.ContainerInfo, task *models.Container) error {
	err := dockertool.DeleteContainer(&containerInfo)
	if err != nil {
		tasks.LogContainerOperation(nil, nil, models.ActionContainerStopping, task.ContainerID, map[string]interface{}{
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
			return fmt.Errorf("failed to update container status: %v", err)
		}
	}

	tasks.LogContainerOperation(nil, nil, models.ActionContainerStopped, task.ContainerID, map[string]interface{}{
		"team_hash":      task.TeamHash,
		"ingame_id":      task.InGameID,
		"container_name": containerInfo.Name,
		"container_id":   task.ContainerID,
	}, nil)

	return nil
}

func UpdateLivingContainers() {

	// log.Println("UpdateLivingContainers")

	var containers []models.Container
	if err := dbtool.DB().Where("container_status != ? AND container_status != ?", models.ContainerError, models.ContainerStopped).Preload("Challenge").Preload("TeamFlag").Find(&containers).Error; err != nil {
		log.Fatalf("Failed to find queued containers: %v\n", err)
	}

	dockerContainerList, err := dockertool.ListContainers()
	if err != nil {
		zaphelper.Logger.Error("Failed to list containers", zap.Error(err))
		return
	}

	for _, dockerContainer := range dockerContainerList {
		containerLabels := dockerContainer.Labels
		teamHash, exists1 := containerLabels["a1ctf.team_hash"]
		inGameID, exists2 := containerLabels["a1ctf.ingame_id"]

		if !exists1 || !exists2 {
			continue
		}

		inGameIDInt, err := strconv.ParseInt(inGameID, 10, 64)
		if err != nil {
			continue
		}

		container := findExistContainer(containers, teamHash, inGameIDInt)
		if container == nil {
			// zaphelper.Logger.Info("Stopping container that not found in database", zap.Any("container", container))
			// dockertool.ForceDeleteContainer(dockerContainer.Names[0])
			continue
		}

		containerInfo := dockertool.ContainerInfo{
			Name:       fmt.Sprintf("cl-%d-%s", container.InGameID, container.TeamHash),
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

		containerStatus, _ := dockertool.CheckContainerStatus(&dockerContainer)
		// zaphelper.Logger.Info("container status", zap.Any("containerStatus", containerStatus))

		if containerStatus.Status == dockertool.CustomContainerRunning {
			if container.ContainerStatus == models.ContainerStarting {
				// 如果远程服务器Container已经是Running状态，就获取端口并且更新数据库
				zaphelper.Logger.Info("Getting container port", zap.Any("container", container))
				getContainerPorts(containerInfo, container)
			}

			// 下面会处理
			// if time.Now().UTC().After(container.ExpireTime) {
			// 	// 如果远程服务器Container已经是Running状态，并且已经超时，就删除Container并且更新数据库
			// 	zaphelper.Logger.Info("Stopping container for life over", zap.Any("container", container))
			// 	tasks.NewContainerStopTask(*container)
			// }

			if container.ContainerStatus == models.ContainerStopped {
				zaphelper.Logger.Info("Stopping deaded container", zap.Any("container", container))
				tasks.NewContainerStopTask(*container)
			}
		} else if containerStatus.Status == dockertool.CustomContainerFailed {
			zaphelper.Logger.Info("Stopping failed container", zap.Any("container", container), zap.Any("container_status", containerStatus))
			tasks.NewContainerFailedTask(*container, containerStatus)
		} else {
			// 等待中的容器
		}
	}

	for _, container := range containers {
		// 处理队列中的容器
		if container.ContainerStatus == models.ContainerQueueing {
			if err := dbtool.DB().Model(&container).Update("container_status", models.ContainerStarting).Error; err != nil {
				zaphelper.Logger.Error("failed to update container status", zap.Error(err), zap.Any("container", container))
				continue
			}
			zaphelper.Logger.Info("Starting container", zap.Any("container", container))
			tasks.NewContainerStartTask(container)
		}

		// 处理要求关闭的容器
		if container.ContainerStatus == models.ContainerStopping {
			if err := dbtool.DB().Model(&container).Update("container_status", models.ContainerStopped).Error; err != nil {
				zaphelper.Logger.Error("failed to update container status", zap.Error(err), zap.Any("container", container))
				continue
			}
			zaphelper.Logger.Info("Stopping container", zap.Any("container", container))
			tasks.NewContainerStopTask(container)
		}

		// 到期容器处理
		if time.Now().UTC().After(container.ExpireTime) &&
			container.ContainerStatus != models.ContainerStopping {
			zaphelper.Logger.Info("Deleting expired container", zap.Any("container", container))
			if err := dbtool.DB().Model(&container).Update("container_status", models.ContainerStopping).Error; err != nil {
				zaphelper.Logger.Error("failed to update container status", zap.Error(err), zap.Any("container", container))
				continue
			}
		}

		// 处理超时的容器 启动时间超过 10 分钟的
		if time.Now().UTC().Sub(container.StartTime) > 10*time.Minute &&
			container.ContainerStatus == models.ContainerStarting {
			zaphelper.Logger.Info("Deleting timeout starting container", zap.Any("container", container))
			if err := dbtool.DB().Model(&container).Update("container_status", models.ContainerStopping).Error; err != nil {
				zaphelper.Logger.Error("failed to update container status", zap.Error(err), zap.Any("container", container))
				continue
			}
		}
	}
}
