package redis_tool

import (
	dbtool "a1ctf/src/utils/db_tool"
	"fmt"
	"math/rand"
	"time"

	"github.com/bytedance/sonic"
)

// 使用分布式锁防止缓存击穿
func GetOrCache(key string, model interface{}, callback func() (interface{}, error), cacheTime time.Duration, enableRandomTime bool) error {
	// 1. 尝试从缓存获取数据
	value, err := dbtool.Redis().Get(key).Result()
	if err == nil {
		// 缓存命中，直接返回
		if err := sonic.Unmarshal([]byte(value), model); err != nil {
			return err
		}
		return nil
	}

	// 2. 缓存未命中，使用分布式锁防止缓存击穿
	lockKey := fmt.Sprintf("lock:%s", key)
	// 尝试获取锁，过期时间10秒，防止死锁
	acquired, err := dbtool.Redis().SetNX(lockKey, "1", 10*time.Second).Result()
	if err != nil {
		return err
	}

	if acquired {
		// 获取到锁，执行回调函数重建缓存
		defer dbtool.Redis().Del(lockKey) // 确保锁被释放

		// 双重检查，避免多个进程同时重建
		value, err := dbtool.Redis().Get(key).Result()
		if err == nil {
			// 另一个进程已经重建了缓存
			if err := sonic.Unmarshal([]byte(value), model); err != nil {
				return err
			}
			return nil
		}

		// 执行回调获取数据
		result, err := callback()
		if err != nil {
			return err
		}

		// 设置随机过期时间，避免同时大量过期
		expireTime := cacheTime

		if enableRandomTime {
			expireTime += time.Duration(rand.Intn(500)) * time.Millisecond
		}

		// 序列化并存入Redis
		dataJSON, _ := sonic.Marshal(result)
		if err := dbtool.Redis().Set(key, dataJSON, expireTime).Err(); err != nil {
			return err
		}

		// 为调用者提供返回数据
		// 因为model是指针，直接将result赋值给它
		resultBytes, _ := sonic.Marshal(result)
		return sonic.Unmarshal(resultBytes, model)
	} else {
		// 未获取到锁，说明有其他请求正在重建缓存
		// 短暂等待后重试几次
		for i := 0; i < 3; i++ {
			time.Sleep(300 * time.Millisecond)
			value, err := dbtool.Redis().Get(key).Result()
			if err == nil {
				// 缓存已被重建
				return sonic.Unmarshal([]byte(value), model)
			}
		}

		// 最后一次尝试调用回调
		result, err := callback()
		if err != nil {
			return err
		}

		// 为调用者提供返回数据
		resultBytes, _ := sonic.Marshal(result)
		return sonic.Unmarshal(resultBytes, model)
	}
}
