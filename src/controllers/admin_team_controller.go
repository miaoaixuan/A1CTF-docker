package controllers

import (
	"a1ctf/src/db/models"
	"a1ctf/src/tasks"
	dbtool "a1ctf/src/utils/db_tool"
	"a1ctf/src/webmodels"
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func AdminListTeams(c *gin.Context) {

	var payload webmodels.AdminListTeamsPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
		return
	}

	query := dbtool.DB().Where("game_id = ?", payload.GameID)

	// 如果有搜索关键词，添加搜索条件
	if payload.Search != "" {
		searchPattern := "%" + payload.Search + "%"
		query = query.Where("team_name LIKE ? OR team_slogan LIKE ?", searchPattern, searchPattern)
	}

	var teams []models.Team
	if err := query.Offset(payload.Offset).Limit(payload.Size).Find(&teams).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch teams"})
		return
	}

	// 计算总数时也要应用搜索条件
	var count int64
	countQuery := dbtool.DB().Model(&models.Team{}).Where("game_id = ?", payload.GameID)
	if payload.Search != "" {
		searchPattern := "%" + payload.Search + "%"
		countQuery = countQuery.Where("team_name LIKE ? OR team_slogan LIKE ?", searchPattern, searchPattern)
	}
	if err := countQuery.Count(&count).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count teams"})
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

	teamItems := make([]webmodels.AdminListTeamItem, 0, len(teams))

	for _, team := range teams {

		var tmpMembers []webmodels.AdminSimpleTeamMemberInfo = make([]webmodels.AdminSimpleTeamMemberInfo, 0)

		for _, member := range team.TeamMembers {
			if user, ok := userMap[member]; ok {
				tmpMembers = append(tmpMembers, webmodels.AdminSimpleTeamMemberInfo{
					UserID:   user.UserID,
					UserName: user.Username,
					Avatar:   user.Avatar,
				})
			}
		}

		teamItems = append(teamItems, webmodels.AdminListTeamItem{
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

// AdminApproveTeam 批准队伍
func AdminApproveTeam(c *gin.Context) {
	var payload webmodels.AdminTeamOperationPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
			Code:    400,
			Message: "Invalid request payload",
		})
		return
	}

	// 查找队伍
	var team models.Team
	if err := dbtool.DB().Where("team_id = ?", payload.TeamID).First(&team).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, webmodels.ErrorMessage{
				Code:    404,
				Message: "Team not found",
			})
		} else {
			c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
				Code:    500,
				Message: "Database error",
			})
		}
		return
	}

	// 更新队伍状态为已批准
	oldStatus := team.TeamStatus
	if err := dbtool.DB().Model(&team).Update("team_status", models.ParticipateApproved).Error; err != nil {
		// 记录批准队伍失败日志
		tasks.LogAdminOperationWithError(c, models.ActionApprove, models.ResourceTypeTeam, &team.TeamName, map[string]interface{}{
			"team_id":    team.TeamID,
			"team_name":  team.TeamName,
			"game_id":    team.GameID,
			"old_status": oldStatus,
		}, err)

		c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
			Code:    500,
			Message: "Failed to approve team",
		})
		return
	}

	// 记录批准队伍成功日志
	tasks.LogAdminOperation(c, models.ActionApprove, models.ResourceTypeTeam, &team.TeamName, map[string]interface{}{
		"team_id":    team.TeamID,
		"team_name":  team.TeamName,
		"game_id":    team.GameID,
		"old_status": oldStatus,
		"new_status": models.ParticipateApproved,
	})

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "队伍已批准",
	})
}

// AdminBanTeam 禁赛队伍
func AdminBanTeam(c *gin.Context) {
	var payload webmodels.AdminTeamOperationPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
			Code:    400,
			Message: "Invalid request payload",
		})
		return
	}

	// 查找队伍
	var team models.Team
	if err := dbtool.DB().Where("team_id = ?", payload.TeamID).First(&team).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, webmodels.ErrorMessage{
				Code:    404,
				Message: "Team not found",
			})
		} else {
			c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
				Code:    500,
				Message: "Database error",
			})
		}
		return
	}

	// 更新队伍状态为禁赛
	oldStatus := team.TeamStatus
	if err := dbtool.DB().Model(&team).Update("team_status", models.ParticipateBanned).Error; err != nil {
		// 记录禁赛队伍失败日志
		tasks.LogAdminOperationWithError(c, models.ActionBan, models.ResourceTypeTeam, &team.TeamName, map[string]interface{}{
			"team_id":    team.TeamID,
			"team_name":  team.TeamName,
			"game_id":    team.GameID,
			"old_status": oldStatus,
		}, err)

		c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
			Code:    500,
			Message: "Failed to ban team",
		})
		return
	}

	// 记录禁赛队伍成功日志
	tasks.LogAdminOperation(c, models.ActionBan, models.ResourceTypeTeam, &team.TeamName, map[string]interface{}{
		"team_id":    team.TeamID,
		"team_name":  team.TeamName,
		"game_id":    team.GameID,
		"old_status": oldStatus,
		"new_status": models.ParticipateBanned,
	})

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "队伍已锁定",
	})
}

// AdminUnbanTeam 解禁队伍
func AdminUnbanTeam(c *gin.Context) {
	var payload webmodels.AdminTeamOperationPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
			Code:    400,
			Message: "Invalid request payload",
		})
		return
	}

	// 查找队伍
	var team models.Team
	if err := dbtool.DB().Where("team_id = ?", payload.TeamID).First(&team).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, webmodels.ErrorMessage{
				Code:    404,
				Message: "Team not found",
			})
		} else {
			c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
				Code:    500,
				Message: "Database error",
			})
		}
		return
	}

	// 检查当前状态
	if team.TeamStatus != models.ParticipateBanned {
		c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
			Code:    400,
			Message: "Team is not banned",
		})
		return
	}

	// 更新队伍状态为已批准
	oldStatus := team.TeamStatus
	if err := dbtool.DB().Model(&team).Update("team_status", models.ParticipateApproved).Error; err != nil {
		// 记录解禁队伍失败日志
		tasks.LogAdminOperationWithError(c, models.ActionUnban, models.ResourceTypeTeam, &team.TeamName, map[string]interface{}{
			"team_id":    team.TeamID,
			"team_name":  team.TeamName,
			"game_id":    team.GameID,
			"old_status": oldStatus,
		}, err)

		c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
			Code:    500,
			Message: "Failed to unban team",
		})
		return
	}

	// 记录解禁队伍成功日志
	tasks.LogAdminOperation(c, models.ActionUnban, models.ResourceTypeTeam, &team.TeamName, map[string]interface{}{
		"team_id":    team.TeamID,
		"team_name":  team.TeamName,
		"game_id":    team.GameID,
		"old_status": oldStatus,
		"new_status": models.ParticipateApproved,
	})

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "队伍已解锁",
	})
}

// AdminDeleteTeam 删除队伍
func AdminDeleteTeam(c *gin.Context) {
	var payload webmodels.AdminTeamOperationPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
			Code:    400,
			Message: "Invalid request payload",
		})
		return
	}

	// 查找队伍
	var team models.Team
	if err := dbtool.DB().Where("team_id = ?", payload.TeamID).First(&team).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, webmodels.ErrorMessage{
				Code:    404,
				Message: "Team not found",
			})
		} else {
			c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
				Code:    500,
				Message: "Database error",
			})
		}
		return
	}

	// 开始事务删除相关数据
	tx := dbtool.DB().Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// 删除队伍相关的加入申请
	if err := tx.Where("team_id = ?", payload.TeamID).Delete(&models.TeamJoinRequest{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
			Code:    500,
			Message: "Failed to delete team join requests",
		})
		return
	}

	// 删除队伍
	if err := tx.Delete(&team).Error; err != nil {
		tx.Rollback()

		// 记录删除队伍失败日志
		tasks.LogAdminOperationWithError(c, models.ActionDelete, models.ResourceTypeTeam, &team.TeamName, map[string]interface{}{
			"team_id":     team.TeamID,
			"team_name":   team.TeamName,
			"game_id":     team.GameID,
			"team_status": team.TeamStatus,
		}, err)

		c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
			Code:    500,
			Message: "Failed to delete team",
		})
		return
	}

	// 提交事务
	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
			Code:    500,
			Message: "Transaction failed",
		})
		return
	}

	// 记录删除队伍成功日志
	tasks.LogAdminOperation(c, models.ActionDelete, models.ResourceTypeTeam, &team.TeamName, map[string]interface{}{
		"team_id":      team.TeamID,
		"team_name":    team.TeamName,
		"game_id":      team.GameID,
		"team_status":  team.TeamStatus,
		"member_count": len(team.TeamMembers),
	})

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "队伍已删除",
	})
}
