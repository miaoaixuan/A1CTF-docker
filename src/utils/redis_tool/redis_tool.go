package redis_tool

import (
	dbtool "a1ctf/src/utils/db_tool"
	"time"

	"github.com/bytedance/sonic"
)

func GetOrCache(key string, model interface{}, callback func() (interface{}, error)) error {

	game_info, err := dbtool.Redis().Get(key).Result()

	if err != nil {
		if result, err := callback(); err == nil {
			gameJSON, _ := sonic.Marshal(result)
			dbtool.Redis().Set(key, gameJSON, 2*time.Second)

			// 由于 model 是 interface{} 类型,不能直接使用指针赋值
			// 需要使用反射来设置值
			if err := sonic.Unmarshal(gameJSON, model); err != nil {
				return err
			}

			return nil
		} else {
			return err
		}
	} else {
		if err := sonic.Unmarshal([]byte(game_info), model); err != nil {
			return err
		}
	}

	return nil
}
