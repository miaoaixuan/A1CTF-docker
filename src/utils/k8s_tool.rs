use std::option;

use kube::{api::{Api, DeleteParams, ListParams, PostParams, ResourceExt}, config::Kubeconfig, Client};
use k8s_openapi::{api::core::v1::{Namespace, Node, Pod, Service}, List};
use k8s_openapi::apimachinery::pkg::apis::meta::v1::ObjectMeta;

pub async fn get_client() -> Result<Client, Box<dyn std::error::Error>> {
    let kubeconfig = Kubeconfig::read_from("k8sconfig.yaml")?;
    let config = kube::Config::from_custom_kubeconfig(kubeconfig, &Default::default()).await?;
    let client = Client::try_from(config);

    match client {
        Ok(c) => Ok(c),
        Err(e) => panic!("Error creating client: {}", e),
    }
}

pub async fn list_pods() -> Result<(), Box<dyn std::error::Error>> {
    let client = get_client().await?;

    // Read pods in the configured namespace into the typed interface from k8s-openapi
    let pods: Api<Pod> = Api::namespaced(client, "a1ctf-challenges");
    let pod_list = pods.list(&ListParams::default()).await?;

    for p in pod_list {
        println!("found pod {}", p.name_any());
    }

    Ok(())
}

pub struct PortName {
    pub name: String,
    pub port: i32,
}

pub struct A1Container {
    pub name: String,
    pub image: String,
    pub command: Option<Vec<String>>,
    pub env: Option<Vec<k8s_openapi::api::core::v1::EnvVar>>,
    pub expose_ports: Option<Vec<PortName>>,
}

pub struct PodInfo {
    pub name: String,
    pub team_hash: String,
    pub containers: Vec<A1Container>
}

pub async fn create_pod(pod_info: &PodInfo) -> Result<(), Box<dyn std::error::Error>> {

    // Read pods in the configured namespace into the typed interface from k8s-openapi
    let pods: Api<Pod> = Api::namespaced(get_client().await?, "a1ctf-challenges");

    let containers = pod_info.containers.iter().map(|config| {
        // 初始化一个最基本的配置
        let mut container = k8s_openapi::api::core::v1::Container {
            name: format!("{}-{}", config.name, pod_info.team_hash),
            image: Some(config.image.clone()),
            ..Default::default()
        };

        // 如果有环境变量
        if config.env.is_some() {
            container.env = config.env.clone();
        }

        if config.expose_ports.is_some() {
            container.ports = Some(config.expose_ports.as_ref().unwrap().iter().map(|port| {
                k8s_openapi::api::core::v1::ContainerPort {
                    container_port: port.port,
                    name: Some(port.name.clone()),
                    ..Default::default()
                }
            }).collect());
        }
        
        container
    }).collect();
    
    match pods.create(&PostParams::default(), &Pod {
        metadata: ObjectMeta {
            name: Some(format!("{}-{}", pod_info.name, pod_info.team_hash)),
            labels: Some({
                let mut labels = std::collections::BTreeMap::new();
                labels.insert("app".to_string(), format!("{}-{}", pod_info.name, pod_info.team_hash));
                labels
            }),
            ..Default::default()
        },
        spec: Some(k8s_openapi::api::core::v1::PodSpec {
            containers: containers,
            ..Default::default()
        }),
        ..Default::default()
    }).await {
        Ok(_) => println!("Pod created"),
        Err(e) => panic!("Error creating pod: {}", e),
    };

    let services: Api<Service> = Api::namespaced(get_client().await?, "a1ctf-challenges");

    let ports_ = pod_info.containers.iter().map(|config| {
        let port_config = config.expose_ports.as_ref().unwrap().iter().map(|port| {
            k8s_openapi::api::core::v1::ServicePort {
                name: Some(format!("fd-{}-{}-{}", config.name, pod_info.team_hash, port.port)),
                port: port.port,
                target_port: Some(k8s_openapi::apimachinery::pkg::util::intstr::IntOrString::String(
                    port.name.clone()
                )),
                ..Default::default()
            }
        }).collect::<Vec<k8s_openapi::api::core::v1::ServicePort>>();

        port_config
    }).flatten().collect();


    match services.create(&PostParams::default(), &Service {
        metadata: ObjectMeta {
            name: Some(format!("{}-{}", pod_info.name, pod_info.team_hash)),
            ..Default::default()
        },
        spec: Some(k8s_openapi::api::core::v1::ServiceSpec {
            type_: Some("NodePort".to_string()),
            selector: Some({
                let mut labels = std::collections::BTreeMap::new();
                labels.insert("app".to_string(), format!("{}-{}", pod_info.name, pod_info.team_hash));
                labels
            }),
            ports: Some(ports_),
            ..Default::default()
        }),
        ..Default::default()
    }).await {
        Ok(_) => println!("Service created"),
        Err(e) => panic!("Error creating service: {}", e),
    };

    Ok(())
}

pub async fn get_pod_ports(pod_info: &PodInfo) -> Result<(), Box<dyn std::error::Error>> {
    let service_name = format!("{}-{}", pod_info.name, pod_info.team_hash);

    let services: Api<Service> = Api::namespaced(get_client().await?, "a1ctf-challenges");

    let pods: Api<Pod> = Api::namespaced(get_client().await?, "a1ctf-challenges");
    let pod = pods.get(&service_name).await?;


    let node_name = pod.spec.unwrap().node_name.unwrap();

    match services.get(&service_name).await {
        Ok(service) => {
            let ports = service.spec.unwrap().ports.unwrap();
            for port in ports {
                println!("Service port: {2}:{} -> {2}:{}", port.port, port.node_port.unwrap(), node_name);
            }
        },
        Err(e) => panic!("Error getting service: {}", e),
    }

    Ok(())
}

pub async fn delete_pod(pod_info: &PodInfo) -> Result<(), Box<dyn std::error::Error>> {

    // Read pods in the configured namespace into the typed interface from k8s-openapi
    let pods: Api<Pod> = Api::namespaced(get_client().await?, "a1ctf-challenges");
    
    let pod_name = format!("{}-{}", pod_info.name, pod_info.team_hash);

    match pods.delete(&pod_name, &DeleteParams::default()).await {
        Ok(_) => println!("Pod deleted"),
        Err(e) => panic!("Error deleted pod: {}", e),
    };

    let services: Api<Service> = Api::namespaced(get_client().await?, "a1ctf-challenges");

    match services.delete(&pod_name, &DeleteParams::default()).await {
        Ok(_) => println!("Service deleted"),
        Err(e) => panic!("Error deleted service: {}", e),
    };

    Ok(())
}

pub async fn init_namespace() -> Result<(), Box<dyn std::error::Error>> {
    let client = get_client().await?;

    let namespaces: Api<Namespace> = Api::all(client);
    let namespace_list = namespaces.list(&ListParams::default()).await?;

    let check_exisists = namespace_list.items.iter().find(|e| e.name_any() == "a1ctf-challenges");
    
    if check_exisists.is_none() {
        let new_namespace = Namespace {
            metadata: ObjectMeta {
                name: Some("a1ctf-challenges".to_string()),
                ..Default::default()
            },
            ..Default::default()
        };
        
        match namespaces.create(&PostParams::default(), &new_namespace).await {
            Ok(_) => println!("Namespace created"),
            Err(e) => panic!("Error creating namespace: {}", e),
        }
    }
    
    Ok(())
}