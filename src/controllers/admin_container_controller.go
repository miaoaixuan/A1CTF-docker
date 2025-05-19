package controllers

import (
	"a1ctf/src/db/models"
	dbtool "a1ctf/src/utils/db_tool"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// AdminListContainers 获取容器列表
func AdminListContainers(c *gin.Context) {
	var payload AdminListContainersPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "无效的请求参数",
		})
		return
	}

	var containers []models.Container
	query := dbtool.DB().Model(&models.Container{})

	// 如果提供了游戏ID，则按游戏ID过滤
	if payload.GameID > 0 {
		query = query.Where("game_id = ? AND container_status NOT IN ?", payload.GameID, []models.ContainerStatus{models.ContainerStopped})
	}

	// 分页查询容器列表
	var total int64
	query.Count(&total)

	if err := query.Offset(payload.Offset).Limit(payload.Size).Find(&containers).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "获取容器列表失败",
		})
		return
	}

	// 查询相关的团队和游戏信息
	var teamIDs []int64
	var gameIDs []int64
	for _, container := range containers {
		teamIDs = append(teamIDs, container.TeamID)
		gameIDs = append(gameIDs, container.GameID)
	}

	var teams []models.Team
	if err := dbtool.DB().Where("team_id IN ?", teamIDs).Find(&teams).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "获取团队信息失败",
		})
		return
	}

	var games []models.Game
	if err := dbtool.DB().Where("game_id IN ?", gameIDs).Find(&games).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "获取游戏信息失败",
		})
		return
	}

	// 构建团队和游戏的映射关系
	teamMap := make(map[int64]models.Team)
	for _, team := range teams {
		teamMap[team.TeamID] = team
	}

	gameMap := make(map[int64]models.Game)
	for _, game := range games {
		gameMap[game.GameID] = game
	}

	// 构建返回数据
	var containerItems []AdminContainerItem = make([]AdminContainerItem, 0)
	for _, container := range containers {
		team, teamExists := teamMap[container.TeamID]
		game, gameExists := gameMap[container.GameID]

		var teamName, gameName string
		if teamExists {
			teamName = team.TeamName
		}
		if gameExists {
			gameName = game.Name
		}

		// 简化处理容器端口，仅使用第一个容器的端口
		var containerPorts models.ExposePorts
		if len(container.ContainerExposeInfos) > 0 {
			containerPorts = container.ContainerExposeInfos[0].ExposePorts
		}

		containerItems = append(containerItems, AdminContainerItem{
			ContainerID:         container.ContainerID,
			ContainerName:       container.ChallengeName,
			ContainerStatus:     container.ContainerStatus,
			ContainerExpireTime: container.ExpireTime,
			ContainerType:       "动态容器", // 可以根据实际情况设置
			ContainerPorts:      containerPorts,
			TeamName:            teamName,
			GameName:            gameName,
			ChallengeName:       container.ChallengeName,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"code":  200,
		"data":  containerItems,
		"total": total,
	})
}

// AdminDeleteContainer 删除容器
func AdminDeleteContainer(c *gin.Context) {
	var payload AdminContainerOperationPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "无效的请求参数",
		})
		return
	}

	// 开始事务
	tx := dbtool.DB().Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// 查询容器
	var container models.Container
	if err := tx.Where("container_id = ?", payload.ContainerID).First(&container).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"code":    404,
				"message": "容器不存在",
			})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{
				"code":    500,
				"message": "查询容器失败",
			})
		}
		tx.Rollback()
		return
	}

	// 删除容器
	if err := tx.Model(&container).Update("container_status", models.ContainerStopping).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "删除容器失败",
		})
		tx.Rollback()
		return
	}

	// 提交事务
	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "提交事务失败",
		})
		return
	}

	// 通知K8S删除容器（实际实现取决于系统架构）
	// TODO: 调用K8S删除容器的逻辑

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "容器已删除",
	})
}

// AdminExtendContainer 延长容器生命周期
func AdminExtendContainer(c *gin.Context) {
	var payload AdminExtendContainerPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "无效的请求参数",
		})
		return
	}

	// 查询容器
	var container models.Container
	if err := dbtool.DB().Where("container_id = ?", payload.ContainerID).First(&container).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"code":    404,
				"message": "容器不存在",
			})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{
				"code":    500,
				"message": "查询容器失败",
			})
		}
		return
	}

	// 延长容器生命周期2小时
	newExpireTime := container.ExpireTime.Add(2 * time.Hour)

	// 更新容器过期时间
	if err := dbtool.DB().Model(&container).Update("expire_time", newExpireTime).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "更新容器过期时间失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":            200,
		"message":         "容器生命周期已延长",
		"new_expire_time": newExpireTime,
	})
}

// AdminGetContainerFlag 获取容器Flag
func AdminGetContainerFlag(c *gin.Context) {
	containerID := c.Query("container_id")
	if containerID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "容器ID不能为空",
		})
		return
	}

	// 查询容器
	var container models.Container
	if err := dbtool.DB().Where("container_id = ?", containerID).First(&container).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"code":    404,
				"message": "容器不存在",
			})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{
				"code":    500,
				"message": "查询容器失败",
			})
		}
		return
	}

	// 查询对应的Flag
	var teamFlag models.TeamFlag
	if err := dbtool.DB().Where("flag_id = ?", container.FlagID).First(&teamFlag).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"code":    404,
				"message": "Flag不存在",
			})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{
				"code":    500,
				"message": "查询Flag失败",
			})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": gin.H{
			"flag_content": teamFlag.FlagContent,
		},
	})
}
