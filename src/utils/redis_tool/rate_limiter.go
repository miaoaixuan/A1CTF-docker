package redistool

import (
	"a1ctf/src/utils/zaphelper"
	"time"

	"go.uber.org/zap"
)

func LockForATime(operationName string, lockTime time.Duration) bool {
	set, err := RedisClient.SetNX(operationName, "locked", lockTime).Result()
	if err != nil {
		zaphelper.Logger.Error("LockForATime failed", zap.Error(err), zap.String("operationName", operationName))
		return false
	}
	return set
}
