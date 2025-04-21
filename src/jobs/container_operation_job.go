package jobs

import (
	"a1ctf/src/db/models"
	dbtool "a1ctf/src/utils/db_tool"
	k8stool "a1ctf/src/utils/k8s_tool"
	"fmt"
	"log"
	"time"
)

func processQueuedContainer(task models.Container) error {
	podInfo := k8stool.PodInfo{
		Name:       fmt.Sprintf("cl-%d", task.InGameID),
		TeamHash:   task.TeamHash,
		Containers: task.ContainerConfig,
		Labels: map[string]string{
			"team_hash": task.TeamHash,
			"ingame_id": fmt.Sprintf("%d", task.InGameID),
		},
	}

	err := k8stool.CreatePod(&podInfo)
	if err != nil {
		return fmt.Errorf("CreatePod %+v error: %v", task, err)
	} else {
		task.ContainerStatus = models.ContainerStarting
		if err := dbtool.DB().Model(&task).Update("container_status", task.ContainerStatus).Error; err != nil {
			return fmt.Errorf("failed to update container status: %v", err)
		}
	}

	return nil
}

func processStartingContainer(task models.Container) error {
	podInfo := k8stool.PodInfo{
		Name:       fmt.Sprintf("cl-%d", task.InGameID),
		TeamHash:   task.TeamHash,
		Containers: task.ContainerConfig,
		Labels: map[string]string{
			"team_hash": task.TeamHash,
			"ingame_id": fmt.Sprintf("%d", task.InGameID),
		},
	}

	ports, err := k8stool.GetPodPorts(&podInfo)
	if err != nil {
		return fmt.Errorf("GetPodInfo %+v error: %v", task, err)
	} else {
		for index, container := range task.ContainerConfig {
			for _, expose_port := range container.ExposePorts {
				port_name := fmt.Sprintf("%d-%s", index, expose_port.Name)

				expose_ports := make([]models.ExposePort, 0)

				for _, port := range *ports {
					if port.Name == port_name {
						expose_ports = append(expose_ports, models.ExposePort{
							PortName: expose_port.Name,
							Port:     port.NodePort,
							IP:       port.NodeName,
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
	}
	return nil
}

func processStoppingContainer(task models.Container) error {

	podInfo := k8stool.PodInfo{
		Name:       fmt.Sprintf("cl-%d", task.InGameID),
		TeamHash:   task.TeamHash,
		Containers: task.ContainerConfig,
		Labels: map[string]string{
			"team_hash": task.TeamHash,
			"ingame_id": fmt.Sprintf("%d", task.InGameID),
		},
	}

	err := k8stool.DeletePod(&podInfo)
	if err != nil {
		return fmt.Errorf("DeletePod %+v error: %v", task, err)
	} else {
		if err := dbtool.DB().Model(&task).Updates(map[string]interface{}{
			"container_status": models.ContainerStopped,
		}).Error; err != nil {
			return fmt.Errorf("failed to update container status: %v", err)
		}
	}

	return nil
}

func processRunningContainer(task models.Container) error {

	podInfo := k8stool.PodInfo{
		Name:       fmt.Sprintf("cl-%d", task.InGameID),
		TeamHash:   task.TeamHash,
		Containers: task.ContainerConfig,
		Labels: map[string]string{
			"team_hash": task.TeamHash,
			"ingame_id": fmt.Sprintf("%d", task.InGameID),
		},
	}

	if task.ExpireTime.After(time.Now().UTC()) {
		return nil
	}

	err := k8stool.DeletePod(&podInfo)
	if err != nil {
		return fmt.Errorf("DeletePod %+v error: %v", task, err)
	} else {
		if err := dbtool.DB().Model(&task).Updates(map[string]interface{}{
			"container_status": models.ContainerStopped,
		}).Error; err != nil {
			return fmt.Errorf("failed to update container status: %v", err)
		}
	}

	return nil
}

func ContainerOperationsJob() {

	// 获取所有存活容器
	var containers []models.Container
	if err := dbtool.DB().Where("container_status != ? AND container_status != ?", models.ContainerError, models.ContainerStopped).Find(&containers).Error; err != nil {
		log.Fatalf("Failed to find queued containers: %v\n", err)
	}

	if len(containers) == 0 {
		return
	}

	for _, container := range containers {
		var err error

		switch container.ContainerStatus {
		case models.ContainerQueueing:
			err = processQueuedContainer(container)
		case models.ContainerStarting:
			err = processStartingContainer(container)
		case models.ContainerStopping:
			err = processStoppingContainer(container)
		case models.ContainerRunning:
			err = processRunningContainer(container)
		default:
			log.Printf("Unknown container status: %s\n", container.ContainerStatus)
		}

		if err != nil {
			log.Printf("Failed to stop container: %v\n", err)
			if err := dbtool.DB().Model(&container).Updates(map[string]interface{}{
				"container_status": models.ContainerError,
			}).Error; err != nil {
				log.Printf("Failed to update container status: %v\n", err)
			}
		}
	}
}
