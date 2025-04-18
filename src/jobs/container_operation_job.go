package jobs

import (
	"a1ctf/src/db/models"
	dbtool "a1ctf/src/utils/db_tool"
	k8stool "a1ctf/src/utils/k8s_tool"
	"fmt"
	"log"
)

func processQueuedContainer() {
	var containers []models.Container
	if err := dbtool.DB().Where("container_status = ?", models.ContainerQueueing).Find(&containers).Error; err != nil {
		log.Fatalf("Failed to find queued containers: %v\n", err)
	}

	if len(containers) == 0 {
		return
	}

	task := containers[0]

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
		log.Fatalf("CreatePod %+v error: %v", task, err)
	} else {
		log.Printf("CreatePod %+v success", task)

		task.ContainerStatus = models.ContainerStarting
		if err := dbtool.DB().Model(&task).Update("container_status", task.ContainerStatus).Error; err != nil {
			log.Fatalf("Failed to update container status: %v\n", err)
		}
	}
}

func processStartingContainer() {
	var containers []models.Container
	if err := dbtool.DB().Where("container_status = ?", models.ContainerStarting).Find(&containers).Error; err != nil {
		log.Fatalf("Failed to find queued containers: %v\n", err)
	}

	if len(containers) == 0 {
		return
	}

	task := containers[0]

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
		log.Fatalf("GetPodInfo %+v error: %v", task, err)
	} else {
		log.Printf("GetPodInfo %+v success %+v", task, ports)

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

		task.ContainerStatus = models.ContainerRunning
		if err := dbtool.DB().Model(&task).Updates(map[string]interface{}{
			"container_status": task.ContainerStatus,
			"expose_ports":     task.ContainerExposeInfos,
		}).Error; err != nil {
			log.Fatalf("Failed to update container status: %v\n", err)
		}
	}
}

func ContainerOperationsJob() {
	processQueuedContainer()
	processStartingContainer()
}
