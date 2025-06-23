package controllers

import (
	"a1ctf/src/db/models"
	dbtool "a1ctf/src/utils/db_tool"
	"a1ctf/src/webmodels"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// AdminGetGameGroups 获取比赛分组列表
func AdminGetGameGroups(c *gin.Context) {
	gameIDStr := c.Param("game_id")
	gameID, err := strconv.ParseInt(gameIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
			Code:    400,
			Message: "Invalid game ID",
		})
		return
	}

	var groups []models.GameGroup
	if err := dbtool.DB().Where("game_id = ?", gameID).Order("display_order ASC, created_at ASC").Find(&groups).Error; err != nil {
		c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
			Code:    500,
			Message: "Failed to load game groups",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": groups,
	})
}

// AdminCreateGameGroup 创建比赛分组
func AdminCreateGameGroup(c *gin.Context) {
	gameIDStr := c.Param("game_id")
	gameID, err := strconv.ParseInt(gameIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
			Code:    400,
			Message: "Invalid game ID",
		})
		return
	}

	var payload webmodels.CreateGameGroupPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
			Code:    400,
			Message: "Invalid request payload",
		})
		return
	}

	// 检查分组名称是否已存在
	var existingGroup models.GameGroup
	if err := dbtool.DB().Where("game_id = ? AND group_name = ?", gameID, payload.GroupName).First(&existingGroup).Error; err == nil {
		c.JSON(http.StatusConflict, webmodels.ErrorMessage{
			Code:    409,
			Message: "Group name already exists",
		})
		return
	}

	// 获取当前最大的显示顺序
	var maxOrder int32
	dbtool.DB().Model(&models.GameGroup{}).Where("game_id = ?", gameID).Select("COALESCE(MAX(display_order), 0)").Scan(&maxOrder)

	newGroup := models.GameGroup{
		GameID:       gameID,
		GroupName:    payload.GroupName,
		Description:  &payload.Description,
		DisplayOrder: maxOrder + 1,
		CreatedAt:    time.Now().UTC(),
		UpdatedAt:    time.Now().UTC(),
	}

	if err := dbtool.DB().Create(&newGroup).Error; err != nil {
		c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
			Code:    500,
			Message: "Failed to create group",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": newGroup,
	})
}

// AdminUpdateGameGroup 更新比赛分组
func AdminUpdateGameGroup(c *gin.Context) {
	gameIDStr := c.Param("game_id")
	gameID, err := strconv.ParseInt(gameIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
			Code:    400,
			Message: "Invalid game ID",
		})
		return
	}

	groupIDStr := c.Param("group_id")
	groupID, err := strconv.ParseInt(groupIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
			Code:    400,
			Message: "Invalid group ID",
		})
		return
	}

	var payload webmodels.UpdateGameGroupPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
			Code:    400,
			Message: "Invalid request payload",
		})
		return
	}

	// 检查分组是否存在
	var group models.GameGroup
	if err := dbtool.DB().Where("group_id = ? AND game_id = ?", groupID, gameID).First(&group).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, webmodels.ErrorMessage{
				Code:    404,
				Message: "Group not found",
			})
		} else {
			c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
				Code:    500,
				Message: "Failed to load group",
			})
		}
		return
	}

	// 检查新名称是否与其他分组冲突
	var existingGroup models.GameGroup
	if err := dbtool.DB().Where("game_id = ? AND group_name = ? AND group_id != ?", gameID, payload.GroupName, groupID).First(&existingGroup).Error; err == nil {
		c.JSON(http.StatusConflict, webmodels.ErrorMessage{
			Code:    409,
			Message: "Group name already exists",
		})
		return
	}

	// 更新分组信息
	if err := dbtool.DB().Model(&group).Updates(map[string]interface{}{
		"group_name":        payload.GroupName,
		"group_description": payload.Description,
		"updated_at":        time.Now().UTC(),
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
			Code:    500,
			Message: "Failed to update group",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "Group updated successfully",
	})
}

// AdminDeleteGameGroup 删除比赛分组
func AdminDeleteGameGroup(c *gin.Context) {
	gameIDStr := c.Param("game_id")
	gameID, err := strconv.ParseInt(gameIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
			Code:    400,
			Message: "Invalid game ID",
		})
		return
	}

	groupIDStr := c.Param("group_id")
	groupID, err := strconv.ParseInt(groupIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
			Code:    400,
			Message: "Invalid group ID",
		})
		return
	}

	// 检查分组是否存在
	var group models.GameGroup
	if err := dbtool.DB().Where("group_id = ? AND game_id = ?", groupID, gameID).First(&group).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, webmodels.ErrorMessage{
				Code:    404,
				Message: "Group not found",
			})
		} else {
			c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
				Code:    500,
				Message: "Failed to load group",
			})
		}
		return
	}

	// 检查是否有队伍在此分组中
	var teamCount int64
	if err := dbtool.DB().Model(&models.Team{}).Where("group_id = ?", groupID).Count(&teamCount).Error; err != nil {
		c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
			Code:    500,
			Message: "Failed to check teams in group",
		})
		return
	}

	if teamCount > 0 {
		c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
			Code:    400,
			Message: "Cannot delete group with teams in it",
		})
		return
	}

	// 删除分组
	if err := dbtool.DB().Delete(&group).Error; err != nil {
		c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
			Code:    500,
			Message: "Failed to delete group",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "Group deleted successfully",
	})
}
