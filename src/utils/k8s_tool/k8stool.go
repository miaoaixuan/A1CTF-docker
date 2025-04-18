package k8stool

import (
	"context"
	"database/sql/driver"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"log"
	"time"

	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/resource"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/util/intstr"

	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/tools/clientcmd"
)

var clientset *kubernetes.Clientset

type PortName struct {
	Name string `json:"name"`
	Port int32  `json:"port"`
}

type A1Container struct {
	Name         string          `json:"name"`
	Image        string          `json:"image"`
	Command      []string        `json:"command"`
	Env          []corev1.EnvVar `json:"env"`
	ExposePorts  []PortName      `json:"expose_ports"`
	CPULimit     int64           `json:"cpu_limit"`
	MemoryLimit  int64           `json:"memory_limit"`
	StorageLimit int64           `json:"storage_limit"`
}

type A1Containers []A1Container

func (e A1Containers) Value() (driver.Value, error) {
	return json.Marshal(e)
}

func (e *A1Containers) Scan(value interface{}) error {
	b, ok := value.([]byte)
	if !ok {
		return errors.New("type assertion to []byte failed")
	}
	return json.Unmarshal(b, e)
}

type PodInfo struct {
	Name       string
	TeamHash   string
	Labels     map[string]string
	Containers []A1Container
}

func GetClient() (*kubernetes.Clientset, error) {

	if clientset != nil {
		return clientset, nil
	}

	kubeconfig := flag.String("kubeconfig", "k8sconfig.yaml", "absolute path to the kubeconfig file")
	flag.Parse()

	config, err := clientcmd.BuildConfigFromFlags("", *kubeconfig)
	if err != nil {
		return nil, fmt.Errorf("error building kubeconfig: %v", err)
	}

	clientsetLocal, err := kubernetes.NewForConfig(config)
	if err != nil {
		return nil, fmt.Errorf("error creating clientset: %v", err)
	}

	clientset = clientsetLocal

	return clientsetLocal, nil
}

func ListPods() error {
	clientset, err := GetClient()
	if err != nil {
		return err
	}
	namespace := "a1ctf-challenges"

	podList, err := clientset.CoreV1().Pods(namespace).List(context.Background(), metav1.ListOptions{})
	if err != nil {
		return fmt.Errorf("error listing pods: %v", err)
	}

	for _, pod := range podList.Items {
		fmt.Printf("Found pod: %s\n", pod.Name)
	}
	return nil
}

func CreatePod(podInfo *PodInfo) error {
	clientset, err := GetClient()
	if err != nil {
		return err
	}
	namespace := "a1ctf-challenges"

	// 构造 Pod 中的容器列表
	var containers []corev1.Container
	for _, c := range podInfo.Containers {
		containerName := c.Name
		container := corev1.Container{
			Name:  containerName,
			Image: c.Image,
		}
		if len(c.Command) > 0 {
			container.Command = c.Command
		}
		if len(c.Env) > 0 {
			container.Env = c.Env
		}
		if len(c.ExposePorts) > 0 {
			var containerPorts []corev1.ContainerPort
			for _, port := range c.ExposePorts {
				containerPorts = append(containerPorts, corev1.ContainerPort{
					ContainerPort: port.Port,
					Name:          port.Name,
				})
			}
			container.Ports = containerPorts
		}

		// 限制资源
		limits := corev1.ResourceList{
			corev1.ResourceCPU:              *resource.NewMilliQuantity(c.CPULimit, resource.DecimalSI),         // 100m = 0.1 CPU
			corev1.ResourceMemory:           *resource.NewQuantity(c.MemoryLimit*1024*1024, resource.BinarySI),  // 64Mi
			corev1.ResourceEphemeralStorage: *resource.NewQuantity(c.StorageLimit*1024*1024, resource.BinarySI), // 128Mi
		}

		// 设置资源请求（通常与限制相同）
		// requests := corev1.ResourceList{
		// 	corev1.ResourceCPU:              *resource.NewMilliQuantity(c.CPULimit, resource.DecimalSI),
		// 	corev1.ResourceMemory:           *resource.NewQuantity(c.MemoryLimit*1024*1024, resource.BinarySI),
		// 	corev1.ResourceEphemeralStorage: *resource.NewQuantity(c.StorageLimit*1024*1024, resource.BinarySI),
		// }

		container.Resources = corev1.ResourceRequirements{
			Limits: limits,
			// Requests: requests,
		}

		containers = append(containers, container)
	}

	podName := fmt.Sprintf("%s-%s", podInfo.Name, podInfo.TeamHash)
	pod := &corev1.Pod{
		ObjectMeta: metav1.ObjectMeta{
			Name:   podName,
			Labels: podInfo.Labels,
		},
		Spec: corev1.PodSpec{
			Containers: containers,
		},
	}

	// 创建 Pod
	_, err = clientset.CoreV1().Pods(namespace).Create(context.Background(), pod, metav1.CreateOptions{})
	if err != nil {
		return fmt.Errorf("error creating pod: %v", err)
	}
	fmt.Println("Pod created")

	// 构造 Service 的端口配置
	var servicePorts []corev1.ServicePort
	for c_index, c := range podInfo.Containers {
		if len(c.ExposePorts) > 0 {
			for _, port := range c.ExposePorts {
				servicePort := corev1.ServicePort{
					Name:       fmt.Sprintf("%d-%s", c_index, port.Name), // 可根据需要自定义 ServicePort 名称
					Port:       port.Port,
					TargetPort: intstr.FromInt(int(port.Port)),
				}
				servicePorts = append(servicePorts, servicePort)
			}
		}
	}

	service := &corev1.Service{
		ObjectMeta: metav1.ObjectMeta{
			Name: podName,
		},
		Spec: corev1.ServiceSpec{
			Type:     corev1.ServiceTypeNodePort,
			Selector: podInfo.Labels,
			Ports:    servicePorts,
		},
	}

	_, err = clientset.CoreV1().Services(namespace).Create(context.Background(), service, metav1.CreateOptions{})
	if err != nil {
		return fmt.Errorf("error creating service: %v", err)
	}

	return nil
}

type PodPort struct {
	Name     string `json:"name"`
	Port     int32  `json:"port"`
	NodePort int32  `json:"node_port"`
	NodeName string `json:"node_name"`
}

type PodPorts []PodPort

func GetPodPorts(podInfo *PodInfo) (*PodPorts, error) {
	clientset, err := GetClient()
	if err != nil {
		return nil, err
	}
	namespace := "a1ctf-challenges"
	podName := fmt.Sprintf("%s-%s", podInfo.Name, podInfo.TeamHash)

	// 获取 Pod，检查其所在的 Node
	pod, err := clientset.CoreV1().Pods(namespace).Get(context.Background(), podName, metav1.GetOptions{})
	if err != nil {
		return nil, fmt.Errorf("error getting pod: %v", err)
	}
	if pod.Spec.NodeName == "" {
		return nil, fmt.Errorf("pod %s not scheduled on a node yet", podName)
	}
	nodeName := pod.Spec.NodeName

	// 获取对应 Service 信息
	service, err := clientset.CoreV1().Services(namespace).Get(context.Background(), podName, metav1.GetOptions{})
	if err != nil {
		return nil, fmt.Errorf("error getting service: %v", err)
	}

	result := make(PodPorts, 0)
	for _, port := range service.Spec.Ports {
		fmt.Printf("Service port: %s: %d -> %s:%d\n", service.Name, port.Port, nodeName, port.NodePort)
		result = append(result, PodPort{
			Name:     port.Name,
			Port:     port.Port,
			NodePort: port.NodePort,
			NodeName: nodeName,
		})
	}
	return &result, nil
}

func DeletePod(podInfo *PodInfo) error {
	clientset, err := GetClient()
	if err != nil {
		return err
	}
	namespace := "a1ctf-challenges"
	podName := fmt.Sprintf("%s-%s", podInfo.Name, podInfo.TeamHash)

	// 删除 Pod
	err = clientset.CoreV1().Pods(namespace).Delete(context.Background(), podName, metav1.DeleteOptions{})
	if err != nil {
		return fmt.Errorf("error deleting pod: %v", err)
	}
	fmt.Println("Pod deleted")

	// 删除 Service
	err = clientset.CoreV1().Services(namespace).Delete(context.Background(), podName, metav1.DeleteOptions{})
	if err != nil {
		return fmt.Errorf("error deleting service: %v", err)
	}
	fmt.Println("Service deleted")

	return nil
}

func InitNamespace() error {
	clientset, err := GetClient()
	if err != nil {
		return err
	}
	namespace := "a1ctf-challenges"

	_, err = clientset.CoreV1().Namespaces().Get(context.Background(), namespace, metav1.GetOptions{})
	if err != nil {
		// 若获取出错则认为该命名空间不存在（实际使用中可判断错误类型）
		ns := &corev1.Namespace{
			ObjectMeta: metav1.ObjectMeta{
				Name: namespace,
			},
		}
		_, err = clientset.CoreV1().Namespaces().Create(context.Background(), ns, metav1.CreateOptions{})
		if err != nil {
			return fmt.Errorf("error creating namespace: %v", err)
		}
		fmt.Println("Namespace created")
	} else {
		fmt.Println("Namespace already exists")
	}

	return nil
}

func TestCreate() {
	// 初始化命名空间
	if err := InitNamespace(); err != nil {
		log.Fatalf("initNamespace error: %v", err)
	}

	// 列出命名空间下的 Pod
	if err := ListPods(); err != nil {
		log.Fatalf("listPods error: %v", err)
	}

	// 构造示例 PodInfo
	podInfo := &PodInfo{
		Name:     "example-pod",
		TeamHash: "abc123",
		Containers: []A1Container{
			{
				Name:  "app",
				Image: "127.0.0.1:6440/ez_include",
				ExposePorts: []PortName{
					{Name: "http", Port: 80},
				},
			},
		},
	}

	// 创建 Pod 和 Service
	if err := CreatePod(podInfo); err != nil {
		log.Fatalf("createPod error: %v", err)
	}

	// 等待一段时间使 Pod 被调度并创建好 Service
	time.Sleep(10 * time.Second)

	// 查询 Service 的端口映射信息
	if _, err := GetPodPorts(podInfo); err != nil {
		log.Fatalf("getPodPorts error: %v", err)
	}

	// 等待一段时间后删除 Pod 和 Service
	time.Sleep(30 * time.Second)
	if err := DeletePod(podInfo); err != nil {
		log.Fatalf("deletePod error: %v", err)
	}
}
