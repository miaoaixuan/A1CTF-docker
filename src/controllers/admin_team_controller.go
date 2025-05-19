package controllers

import (
	"a1ctf/src/db/models"
	dbtool "a1ctf/src/utils/db_tool"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func AdminListTeams(c *gin.Context) {

	var payload AdminListTeamsPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
		return
	}

	log.Printf("payloads: %v", payload)

	var teams []models.Team
	if err := dbtool.DB().Find(&teams).Where("game_id", payload.GameID).Offset(payload.Offset).Limit(payload.Size).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch users"})
		return
	}

	log.Printf("teams: %v", teams)

	var count int64
	if err := dbtool.DB().Model(&models.Team{}).Count(&count).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count users"})
		return
	}

	var users []models.User
	if err := dbtool.DB().Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch users"})
		return
	}

	var userMap = make(map[string]models.User)
	for _, user := range users {
		userMap[user.UserID] = user
	}

	teamItems := make([]AdminListTeamItem, 0, len(teams))

	for _, team := range teams {

		var tmpMembers []AdminSimpleTeamMemberInfo = make([]AdminSimpleTeamMemberInfo, 0)

		for _, member := range team.TeamMembers {
			if user, ok := userMap[member]; ok {
				tmpMembers = append(tmpMembers, AdminSimpleTeamMemberInfo{
					UserID:   user.UserID,
					UserName: user.Username,
					Avatar:   user.Avatar,
				})
			}
		}

		teamItems = append(teamItems, AdminListTeamItem{
			TeamID:     team.TeamID,
			TeamName:   team.TeamName,
			TeamAvatar: team.TeamAvatar,
			TeamSlogan: team.TeamSlogan,
			Members:    tmpMembers,
			Status:     team.TeamStatus,
			Score:      team.TeamScore,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"code":  200,
		"data":  teamItems,
		"total": count,
	})
}

// AdminApproveTeam 批准队伍（设置状态为Approved）
func AdminApproveTeam(c *gin.Context) {
	var payload AdminTeamOperationPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "无效的请求参数",
		})
		return
	}

	// 首先查询队伍当前状态
	var team models.Team
	if err := dbtool.DB().First(&team, payload.TeamID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"code":    404,
				"message": "未找到队伍",
			})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{
				"code":    500,
				"message": "查询队伍失败",
			})
		}
		return
	}

	// 只有未审核状态的队伍才能批准
	if team.TeamStatus != models.ParticipatePending {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "只有未审核的队伍才能批准",
		})
		return
	}

	// 更新队伍状态为已批准
	result := dbtool.DB().Model(&models.Team{}).
		Where("team_id = ?", payload.TeamID).
		Update("team_status", models.ParticipateApproved)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "更新队伍状态失败",
		})
		return
	}

	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"code":    404,
			"message": "未找到队伍",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "队伍已批准",
	})
}

// AdminBanTeam 锁定队伍（设置状态为Banned）
func AdminBanTeam(c *gin.Context) {
	var payload AdminTeamOperationPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "无效的请求参数",
		})
		return
	}

	// 更新队伍状态为已禁赛
	result := dbtool.DB().Model(&models.Team{}).
		Where("team_id = ?", payload.TeamID).
		Update("team_status", models.ParticipateBanned)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "锁定队伍失败",
		})
		return
	}

	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"code":    404,
			"message": "未找到队伍",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "队伍已锁定",
	})
}

// AdminUnbanTeam 解锁队伍（将Banned状态恢复为Approved）
func AdminUnbanTeam(c *gin.Context) {
	var payload AdminTeamOperationPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "无效的请求参数",
		})
		return
	}

	// 首先查询队伍当前状态
	var team models.Team
	if err := dbtool.DB().First(&team, payload.TeamID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"code":    404,
				"message": "未找到队伍",
			})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{
				"code":    500,
				"message": "查询队伍失败",
			})
		}
		return
	}

	// 只有被锁定的队伍才能解锁
	if team.TeamStatus != models.ParticipateBanned {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "只有被锁定的队伍才能解锁",
		})
		return
	}

	// 更新队伍状态为已批准
	result := dbtool.DB().Model(&models.Team{}).
		Where("team_id = ?", payload.TeamID).
		Update("team_status", models.ParticipateApproved)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "解锁队伍失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "队伍已解锁",
	})
}

// AdminDeleteTeam 删除队伍
func AdminDeleteTeam(c *gin.Context) {
	var payload AdminTeamOperationPayload
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

	// 先检查队伍是否存在
	var team models.Team
	if err := tx.First(&team, payload.TeamID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"code":    404,
				"message": "未找到队伍",
			})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{
				"code":    500,
				"message": "查询队伍失败",
			})
		}
		tx.Rollback()
		return
	}

	// 删除队伍
	if err := tx.Delete(&team).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "删除队伍失败",
		})
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

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "队伍已删除",
	})
}
