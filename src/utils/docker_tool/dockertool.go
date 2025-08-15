package dockertool

import (
	"a1ctf/src/utils/zaphelper"
	"context"
	"database/sql/driver"
	"errors"
	"fmt"
	"io"
	"strconv"
	"strings"

	"github.com/bytedance/sonic"
	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/network"
	"github.com/docker/docker/client"
	"github.com/docker/go-connections/nat"
	"github.com/go-playground/validator/v10"
	"go.uber.org/zap"
)

var dockerClient *client.Client

type PortName struct {
	Name string `json:"name" validate:"required,portname" label:"PortName" message:"Port name must be a DNS_LABEL"`
	Port int32  `json:"port" validate:"min=1,max=65535" label:"Port" message:"Port must be between 1 and 65535"`
}

type EnvVar struct {
	Name  string `json:"name"`
	Value string `json:"value"`
}

type A1Container struct {
	Name         string    `json:"name" validate:"required,dns_label" label:"ContainerName" message:"Container must be a DNS_LABEL"`
	Image        string    `json:"image" validate:"required" label:"ContainerImage"`
	Command      []string  `json:"command" validate:"-"`
	Env          []EnvVar  `json:"env" validate:"-"`
	ExposePorts  []PortName `json:"expose_ports" validate:"dive"`
	CPULimit     int64     `json:"cpu_limit" validate:"min=0" label:"CPULimit" message:"CPU limit must be greater than 0"`
	MemoryLimit  int64     `json:"memory_limit" validate:"min=0" label:"MemoryLimit" message:"Memory limit must be greater than 0"`
	StorageLimit int64     `json:"storage_limit" validate:"min=0" label:"StorageLimit" message:"Storage limit must be greater than 0"`
}

// 自定义验证函数 - 验证DNS标签格式
func validateDNSLabel(fl validator.FieldLevel) bool {
	// Simple validation - alphanumeric and hyphens, no spaces
	if len(fl.Field().String()) == 0 || len(fl.Field().String()) > 63 {
		return false
	}
	for _, r := range fl.Field().String() {
		if !((r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') || (r >= '0' && r <= '9') || r == '-') {
			return false
		}
	}
	return true
}

// 自定义验证函数 - 验证端口名称格式
func validatePortName(fl validator.FieldLevel) bool {
	// Simple validation - same as DNS label for port names
	return validateDNSLabel(fl)
}

func ValidContainerConfig(containers []A1Container) error {
	validate := validator.New()

	// 注册自定义验证函数
	_ = validate.RegisterValidation("dns_label", validateDNSLabel)
	_ = validate.RegisterValidation("portname", validatePortName)

	for _, container := range containers {
		err := validate.Struct(container)
		if err != nil {
			// 处理验证错误
			if validationErrors, ok := err.(validator.ValidationErrors); ok {
				for _, fieldErr := range validationErrors {
					return fmt.Errorf("field %s failed validation with tag %s value %s",
						fieldErr.Field(),
						fieldErr.Tag(),
						fieldErr.Value(),
					)
				}
			} else {
				return fmt.Errorf("validation error: %v", err)
			}
		}
	}
	return nil
}

type A1Containers []A1Container

func (e A1Containers) Value() (driver.Value, error) {
	return sonic.Marshal(e)
}

func (e *A1Containers) Scan(value interface{}) error {
	b, ok := value.([]byte)
	if !ok {
		return errors.New("type assertion to []byte failed")
	}
	return sonic.Unmarshal(b, e)
}

type ContainerInfo struct {
	Name       string
	TeamHash   string
	Labels     map[string]string
	Containers []A1Container
	Flag       string
	AllowWAN   bool
	AllowDNS   bool
}

type ContainerPort struct {
	Name     string
	Port     int32
	HostPort int32
}

type ContainerPorts []ContainerPort

func GetClient() (*client.Client, error) {
	if dockerClient != nil {
		return dockerClient, nil
	}

	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		return nil, fmt.Errorf("error creating docker client: %v", err)
	}

	dockerClient = cli
	return dockerClient, nil
}

func ListContainers() ([]types.Container, error) {
	cli, err := GetClient()
	if err != nil {
		return nil, err
	}

	containers, err := cli.ContainerList(context.Background(), types.ContainerListOptions{
		All: true,
	})
	if err != nil {
		return nil, fmt.Errorf("error listing containers: %v", err)
	}

	// Filter containers with a1ctf label
	var a1ctfContainers []types.Container
	for _, container := range containers {
		if _, exists := container.Labels["a1ctf.managed"]; exists {
			a1ctfContainers = append(a1ctfContainers, container)
		}
	}

	return a1ctfContainers, nil
}

func CreateContainer(containerInfo *ContainerInfo) error {
	cli, err := GetClient()
	if err != nil {
		return err
	}

	ctx := context.Background()

	// Create network if it doesn't exist
	networkName := "a1ctf-challenges"
	if err := createNetworkIfNotExists(cli, ctx, networkName); err != nil {
		return fmt.Errorf("error creating network: %v", err)
	}

	// For each container in the spec, create a Docker container
	for i, c := range containerInfo.Containers {
		containerName := fmt.Sprintf("%s-%d", containerInfo.Name, i)

		// Prepare environment variables
		env := []string{}
		for _, envVar := range c.Env {
			env = append(env, fmt.Sprintf("%s=%s", envVar.Name, envVar.Value))
		}
		// Add the flag environment variable
		env = append(env, fmt.Sprintf("A1CTF_FLAG=%s", containerInfo.Flag))

		// Prepare port mappings
		portSet := nat.PortSet{}
		portMap := nat.PortMap{}
		
		for _, port := range c.ExposePorts {
			natPort := nat.Port(fmt.Sprintf("%d/tcp", port.Port))
			portSet[natPort] = struct{}{}
			
			// Assign host port (use port + 30000 offset for now, similar to k8s NodePort)
			hostPort := port.Port + 30000
			portMap[natPort] = []nat.PortBinding{{HostPort: strconv.Itoa(int(hostPort))}}
		}

		// Prepare labels
		labels := make(map[string]string)
		for k, v := range containerInfo.Labels {
			labels[k] = v
		}
		labels["a1ctf.managed"] = "true"
		labels["a1ctf.container_name"] = containerInfo.Name
		labels["a1ctf.team_hash"] = containerInfo.TeamHash
		// Add ingame_id if it exists in the original labels
		if ingameID, exists := containerInfo.Labels["ingame_id"]; exists {
			labels["a1ctf.ingame_id"] = ingameID
		}

		// Prepare resource limits
		resources := container.Resources{}
		if c.MemoryLimit > 0 {
			resources.Memory = c.MemoryLimit * 1024 * 1024 // Convert MB to bytes
		}
		if c.CPULimit > 0 {
			// Convert millicores to nano CPUs (1 CPU = 1000000000 nano CPUs)
			resources.NanoCPUs = c.CPULimit * 1000000 // millicores to nano CPUs
		}

		// Create container config
		config := &container.Config{
			Image:        c.Image,
			Env:          env,
			ExposedPorts: portSet,
			Labels:       labels,
		}

		if len(c.Command) > 0 {
			config.Cmd = c.Command
		}

		hostConfig := &container.HostConfig{
			PortBindings: portMap,
			Resources:    resources,
			NetworkMode:  container.NetworkMode(networkName),
		}

		networkingConfig := &network.NetworkingConfig{
			EndpointsConfig: map[string]*network.EndpointSettings{
				networkName: {},
			},
		}

		// Pull image if not exists
		reader, err := cli.ImagePull(ctx, c.Image, types.ImagePullOptions{})
		if err != nil {
			zaphelper.Logger.Warn("Failed to pull image", zap.String("image", c.Image), zap.Error(err))
		} else {
			// Read the response to ensure the pull completes
			io.Copy(io.Discard, reader)
			reader.Close()
		}

		// Create container
		resp, err := cli.ContainerCreate(ctx, config, hostConfig, networkingConfig, nil, containerName)
		if err != nil {
			return fmt.Errorf("error creating container %s: %v", containerName, err)
		}

		// Start container
		if err := cli.ContainerStart(ctx, resp.ID, types.ContainerStartOptions{}); err != nil {
			return fmt.Errorf("error starting container %s: %v", containerName, err)
		}

		zaphelper.Logger.Info("Container created and started", 
			zap.String("container_name", containerName), 
			zap.String("container_id", resp.ID))
	}

	return nil
}

func createNetworkIfNotExists(cli *client.Client, ctx context.Context, networkName string) error {
	networks, err := cli.NetworkList(ctx, types.NetworkListOptions{})
	if err != nil {
		return err
	}

	for _, network := range networks {
		if network.Name == networkName {
			return nil // Network already exists
		}
	}

	// Create network
	_, err = cli.NetworkCreate(ctx, networkName, types.NetworkCreate{
		Driver: "bridge",
	})
	return err
}

func GetContainerPorts(containerInfo *ContainerInfo) (*ContainerPorts, error) {
	cli, err := GetClient()
	if err != nil {
		return nil, err
	}

	ctx := context.Background()
	result := make(ContainerPorts, 0)

	// List containers and find ones that match our container info
	containers, err := cli.ContainerList(ctx, types.ContainerListOptions{})
	if err != nil {
		return nil, fmt.Errorf("error listing containers: %v", err)
	}

	for _, dockerContainer := range containers {
		if dockerContainer.Labels["a1ctf.container_name"] == containerInfo.Name &&
		   dockerContainer.Labels["a1ctf.team_hash"] == containerInfo.TeamHash {
			
			// Get container details for port information
			containerJSON, err := cli.ContainerInspect(ctx, dockerContainer.ID)
			if err != nil {
				continue
			}

			for port, bindings := range containerJSON.NetworkSettings.Ports {
				if len(bindings) > 0 {
					portNum, _ := strconv.Atoi(strings.Split(string(port), "/")[0])
					hostPort, _ := strconv.Atoi(bindings[0].HostPort)
					
					result = append(result, ContainerPort{
						Name:     string(port),
						Port:     int32(portNum),
						HostPort: int32(hostPort),
					})
				}
			}
		}
	}

	return &result, nil
}

func DeleteContainer(containerInfo *ContainerInfo) error {
	cli, err := GetClient()
	if err != nil {
		return err
	}

	ctx := context.Background()

	// List containers and find ones that match our container info
	containers, err := cli.ContainerList(ctx, types.ContainerListOptions{All: true})
	if err != nil {
		return fmt.Errorf("error listing containers: %v", err)
	}

	for _, dockerContainer := range containers {
		if dockerContainer.Labels["a1ctf.container_name"] == containerInfo.Name &&
		   dockerContainer.Labels["a1ctf.team_hash"] == containerInfo.TeamHash {
			
			// Stop container
			_ = cli.ContainerStop(ctx, dockerContainer.ID, container.StopOptions{})
			
			// Remove container
			_ = cli.ContainerRemove(ctx, dockerContainer.ID, types.ContainerRemoveOptions{
				Force: true,
			})

			zaphelper.Logger.Info("Container stopped and removed", 
				zap.String("container_id", dockerContainer.ID))
		}
	}

	return nil
}

func ForceDeleteContainer(containerName string) error {
	cli, err := GetClient()
	if err != nil {
		return err
	}

	ctx := context.Background()

	// List containers and find ones that match our container name
	containers, err := cli.ContainerList(ctx, types.ContainerListOptions{All: true})
	if err != nil {
		return fmt.Errorf("error listing containers: %v", err)
	}

	for _, dockerContainer := range containers {
		if dockerContainer.Labels["a1ctf.container_name"] == containerName {
			
			// Stop container
			_ = cli.ContainerStop(ctx, dockerContainer.ID, container.StopOptions{})
			
			// Remove container
			_ = cli.ContainerRemove(ctx, dockerContainer.ID, types.ContainerRemoveOptions{
				Force: true,
			})

			zaphelper.Logger.Info("Container force deleted", 
				zap.String("container_id", dockerContainer.ID))
		}
	}

	return nil
}