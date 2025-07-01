package tasks

import (
	"log"

	"github.com/hibiken/asynq"
	"github.com/spf13/viper"
)

var client *asynq.Client
var server *asynq.Server

func InitTaskQueue() {
	redisAddr := viper.GetString("redis.address")
	redisUsername := viper.GetString("redis.username")
	redisPassword := viper.GetString("redis.password")
	redisDB := viper.GetInt("redis.db")

	client = asynq.NewClient(asynq.RedisClientOpt{
		Addr:     redisAddr,
		Username: redisUsername,
		Password: redisPassword,
		DB:       redisDB,
	})

	go func() {
		// start a queue server
		server = asynq.NewServer(
			asynq.RedisClientOpt{
				Addr:     redisAddr,
				Username: redisUsername,
				Password: redisPassword,
				DB:       redisDB,
			},
			asynq.Config{
				// Specify how many concurrent workers to use
				Concurrency: 0,
				// Optionally specify multiple queues with different priority.
				Queues: map[string]int{
					"critical": 6,
					"default":  3,
					"low":      1,
				},
				// See the godoc for other configuration options
			},
		)

		mux := asynq.NewServeMux()
		mux.HandleFunc(TypeNewTeamFlag, HandleTeamCreateTask)
		mux.HandleFunc(TypeNewSystemLog, HandleSystemLogTask)

		if err := server.Run(mux); err != nil {
			log.Fatalf("could not run server: %v", err)
		}
	}()
}

func CloseTaskQueue() {
	client.Close()
	server.Shutdown()
}

const (
	TypeNewTeamFlag  = "teamFlag:create"
	TypeNewSystemLog = "systemLog:create"
)
