package controllers

import (
	"a1ctf/src/db/models"
	dbtool "a1ctf/src/utils/db_tool"
	general "a1ctf/src/utils/general"
	"a1ctf/src/utils/ristretto_tool"
	"a1ctf/src/webmodels"
	"fmt"
	"net/http"
	"strconv"
	"time"

	jwt "github.com/appleboy/gin-jwt/v2"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/lib/pq"
	"gorm.io/gorm"
)

func UserCreateGameTeam(c *gin.Context) {

	game := c.MustGet("game").(models.Game)

	var payload webmodels.UserCreateTeamPayload = webmodels.UserCreateTeamPayload{}
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
			Code:    400,
			Message: "Invalid request payload",
		})
		return
	}

	// 如果指定了分组ID，验证分组是否存在
	if payload.GroupID != nil {
		var group models.GameGroup
		if err := dbtool.DB().Where("group_id = ? AND game_id = ?", *payload.GroupID, game.GameID).First(&group).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
					Code:    400,
					Message: "Invalid group ID",
				})
			} else {
				c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
					Code:    500,
					Message: "Failed to validate group",
				})
			}
			return
		}
	}

	inviteCode := fmt.Sprintf("%s-%s", payload.Name, uuid.New().String())
	teamMembers := pq.StringArray{c.MustGet("user_id").(string)}

	newTeam := models.Team{
		TeamID:          0,
		GameID:          game.GameID,
		TeamName:        payload.Name,
		TeamDescription: &payload.Description,
		TeamAvatar:      nil,
		TeamSlogan:      &payload.Slogan,
		TeamMembers:     teamMembers,
		TeamScore:       0,
		TeamHash:        general.RandomHash(16),
		InviteCode:      &inviteCode,
		TeamStatus:      models.ParticipatePending,
		GroupID:         payload.GroupID,
	}

	if err := dbtool.DB().Create(&newTeam).Error; err != nil {
		c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
			Code:    501,
			Message: "System error",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": newTeam,
	})
}

// TeamJoinRequest 申请加入战队
func TeamJoinRequest(c *gin.Context) {
	claims := jwt.ExtractClaims(c)
	userID := claims["UserID"].(string)

	var payload struct {
		InviteCode string `json:"invite_code" binding:"required"`
	}

	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
			Code:    400,
			Message: "Invalid request payload",
		})
		return
	}

	// 根据邀请码查找战队
	var team models.Team
	if err := dbtool.DB().Where("invite_code = ?", payload.InviteCode).First(&team).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, webmodels.ErrorMessage{
				Code:    404,
				Message: "Invalid invite code",
			})
		} else {
			c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
				Code:    500,
				Message: "System error",
			})
		}
		return
	}

	// 检查用户是否已经在战队中
	for _, memberID := range team.TeamMembers {
		if memberID == userID {
			c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
				Code:    400,
				Message: "You are already a member of this team",
			})
			return
		}
	}

	// 检查是否已经有待处理的申请
	var existingRequest models.TeamJoinRequest
	if err := dbtool.DB().Where("team_id = ? AND user_id = ? AND status = ?", team.TeamID, userID, models.JoinRequestPending).First(&existingRequest).Error; err == nil {
		c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
			Code:    400,
			Message: "You already have a pending request for this team",
		})
		return
	}

	// 创建加入申请
	newRequest := models.TeamJoinRequest{
		TeamID:     team.TeamID,
		UserID:     userID,
		GameID:     team.GameID,
		Status:     models.JoinRequestPending,
		CreateTime: time.Now().UTC(),
	}

	if err := dbtool.DB().Create(&newRequest).Error; err != nil {
		c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
			Code:    500,
			Message: "System error",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "申请已提交，等待队长审核",
	})
}

// GetTeamJoinRequests 获取战队加入申请列表
func GetTeamJoinRequests(c *gin.Context) {
	claims := jwt.ExtractClaims(c)
	userID := claims["UserID"].(string)

	teamIDStr := c.Param("team_id")
	teamID, err := strconv.ParseInt(teamIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
			Code:    400,
			Message: "Invalid team ID",
		})
		return
	}

	// 检查用户是否是队长
	var team models.Team
	if err := dbtool.DB().Where("team_id = ?", teamID).First(&team).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, webmodels.ErrorMessage{
				Code:    404,
				Message: "Team not found",
			})
		} else {
			c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
				Code:    500,
				Message: "System error",
			})
		}
		return
	}

	// 检查是否是队长（第一个成员）
	if len(team.TeamMembers) == 0 || team.TeamMembers[0] != userID {
		c.JSON(http.StatusForbidden, webmodels.ErrorMessage{
			Code:    403,
			Message: "Only team captain can view join requests",
		})
		return
	}

	// 获取待处理的申请列表
	var requests []models.TeamJoinRequest
	if err := dbtool.DB().Where("team_id = ? AND status = ?", teamID, models.JoinRequestPending).Preload("User").Order("create_time ASC").Find(&requests).Error; err != nil {
		c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
			Code:    500,
			Message: "Failed to load join requests",
		})
		return
	}

	// 构造返回数据
	var result []gin.H = make([]gin.H, 0)
	for _, request := range requests {
		result = append(result, gin.H{
			"request_id":  request.RequestID,
			"user_id":     request.UserID,
			"username":    request.User.Username,
			"user_avatar": request.User.Avatar,
			"status":      request.Status,
			"create_time": request.CreateTime,
			"message":     request.Message,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": result,
	})
}

// HandleTeamJoinRequest 处理加入申请
func HandleTeamJoinRequest(c *gin.Context) {
	claims := jwt.ExtractClaims(c)
	userID := claims["UserID"].(string)

	requestIDStr := c.Param("request_id")
	requestID, err := strconv.ParseInt(requestIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
			Code:    400,
			Message: "Invalid request ID",
		})
		return
	}

	var payload struct {
		Action string `json:"action" binding:"required"`
	}

	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
			Code:    400,
			Message: "Invalid request payload",
		})
		return
	}

	if payload.Action != "approve" && payload.Action != "reject" {
		c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
			Code:    400,
			Message: "Invalid action, must be 'approve' or 'reject'",
		})
		return
	}

	// 获取申请信息
	var request models.TeamJoinRequest
	if err := dbtool.DB().Preload("Team").Where("request_id = ?", requestID).First(&request).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, webmodels.ErrorMessage{
				Code:    404,
				Message: "Request not found",
			})
		} else {
			c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
				Code:    500,
				Message: "System error",
			})
		}
		return
	}

	// 检查是否是队长
	if len(request.Team.TeamMembers) == 0 || request.Team.TeamMembers[0] != userID {
		c.JSON(http.StatusForbidden, webmodels.ErrorMessage{
			Code:    403,
			Message: "Only team captain can handle join requests",
		})
		return
	}

	// 检查申请状态
	if request.Status != models.JoinRequestPending {
		c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
			Code:    400,
			Message: "Request has already been handled",
		})
		return
	}

	now := time.Now().UTC()
	handledBy := userID

	if payload.Action == "approve" {
		// 批准申请，将用户加入战队
		updatedMembers := append(request.Team.TeamMembers, request.UserID)

		// 更新战队成员列表
		if err := dbtool.DB().Model(&request.Team).Update("team_members", pq.StringArray(updatedMembers)).Error; err != nil {
			c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
				Code:    500,
				Message: "Failed to add member to team",
			})
			return
		}

		// 更新申请状态
		if err := dbtool.DB().Model(&request).Updates(map[string]interface{}{
			"status":      models.JoinRequestApproved,
			"handle_time": &now,
			"handled_by":  &handledBy,
		}).Error; err != nil {
			c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
				Code:    500,
				Message: "Failed to update request status",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"code":    200,
			"message": "申请已批准，用户已加入战队",
		})
	} else {
		// 拒绝申请
		if err := dbtool.DB().Model(&request).Updates(map[string]interface{}{
			"status":      models.JoinRequestRejected,
			"handle_time": &now,
			"handled_by":  &handledBy,
		}).Error; err != nil {
			c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
				Code:    500,
				Message: "Failed to update request status",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"code":    200,
			"message": "申请已拒绝",
		})
	}
}

// TransferTeamCaptain 转移队长
func TransferTeamCaptain(c *gin.Context) {
	claims := jwt.ExtractClaims(c)
	userID := claims["UserID"].(string)

	teamIDStr := c.Param("team_id")
	teamID, err := strconv.ParseInt(teamIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
			Code:    400,
			Message: "Invalid team ID",
		})
		return
	}

	var payload struct {
		NewCaptainID string `json:"new_captain_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
			Code:    400,
			Message: "Invalid request payload",
		})
		return
	}

	// 获取战队信息
	var team models.Team
	if err := dbtool.DB().Where("team_id = ?", teamID).First(&team).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, webmodels.ErrorMessage{
				Code:    404,
				Message: "Team not found",
			})
		} else {
			c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
				Code:    500,
				Message: "System error",
			})
		}
		return
	}

	// 检查是否是队长
	if len(team.TeamMembers) == 0 || team.TeamMembers[0] != userID {
		c.JSON(http.StatusForbidden, webmodels.ErrorMessage{
			Code:    403,
			Message: "Only team captain can transfer leadership",
		})
		return
	}

	// 检查新队长是否在战队中
	var newCaptainIndex = -1
	for i, memberID := range team.TeamMembers {
		if memberID == payload.NewCaptainID {
			newCaptainIndex = i
			break
		}
	}

	if newCaptainIndex == -1 {
		c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
			Code:    400,
			Message: "New captain is not a member of this team",
		})
		return
	}

	// 调整成员顺序，将新队长移到第一位
	newMembers := make(pq.StringArray, len(team.TeamMembers))
	newMembers[0] = payload.NewCaptainID

	j := 1
	for i, memberID := range team.TeamMembers {
		if i != newCaptainIndex {
			newMembers[j] = memberID
			j++
		}
	}

	// 更新战队成员列表
	if err := dbtool.DB().Model(&team).Update("team_members", newMembers).Error; err != nil {
		c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
			Code:    500,
			Message: "Failed to transfer team leadership",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "队长已转移",
	})
}

// RemoveTeamMember 踢出队员
func RemoveTeamMember(c *gin.Context) {
	claims := jwt.ExtractClaims(c)
	userID := claims["UserID"].(string)

	teamIDStr := c.Param("team_id")
	teamID, err := strconv.ParseInt(teamIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
			Code:    400,
			Message: "Invalid team ID",
		})
		return
	}

	targetUserID := c.Param("user_id")

	// 获取战队信息
	var team models.Team
	if err := dbtool.DB().Where("team_id = ?", teamID).First(&team).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, webmodels.ErrorMessage{
				Code:    404,
				Message: "Team not found",
			})
		} else {
			c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
				Code:    500,
				Message: "System error",
			})
		}
		return
	}

	// 检查是否是队长
	if len(team.TeamMembers) == 0 || team.TeamMembers[0] != userID {
		c.JSON(http.StatusForbidden, webmodels.ErrorMessage{
			Code:    403,
			Message: "Only team captain can remove members",
		})
		return
	}

	// 不能踢出自己
	if userID == targetUserID {
		c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
			Code:    400,
			Message: "Cannot remove yourself",
		})
		return
	}

	// 检查目标用户是否在战队中
	var targetUserIndex = -1
	for i, memberID := range team.TeamMembers {
		if memberID == targetUserID {
			targetUserIndex = i
			break
		}
	}

	if targetUserIndex == -1 {
		c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
			Code:    400,
			Message: "User is not a member of this team",
		})
		return
	}

	// 检查目标用户是否为队伍解出过题目
	var solveCount int64
	if err := dbtool.DB().Model(&models.Solve{}).Where("team_id = ? AND solver_id = ?", teamID, targetUserID).Count(&solveCount).Error; err != nil {
		c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
			Code:    500,
			Message: "Failed to check solve records",
		})
		return
	}

	if solveCount > 0 {
		c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
			Code:    400,
			Message: "无法移除已为战队解出题目的队员",
		})
		return
	}

	// 从成员列表中移除用户
	newMembers := make(pq.StringArray, 0, len(team.TeamMembers)-1)
	for i, memberID := range team.TeamMembers {
		if i != targetUserIndex {
			newMembers = append(newMembers, memberID)
		}
	}

	// 更新战队成员列表
	if err := dbtool.DB().Model(&team).Update("team_members", newMembers).Error; err != nil {
		c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
			Code:    500,
			Message: "Failed to remove team member",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "队员已移除",
	})
}

// DeleteTeam 解散战队
func DeleteTeam(c *gin.Context) {
	claims := jwt.ExtractClaims(c)
	userID := claims["UserID"].(string)

	teamIDStr := c.Param("team_id")
	teamID, err := strconv.ParseInt(teamIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
			Code:    400,
			Message: "Invalid team ID",
		})
		return
	}

	// 获取战队信息
	var team models.Team
	if err := dbtool.DB().Where("team_id = ?", teamID).First(&team).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, webmodels.ErrorMessage{
				Code:    404,
				Message: "Team not found",
			})
		} else {
			c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
				Code:    500,
				Message: "System error",
			})
		}
		return
	}

	// 检查是否是队长
	if len(team.TeamMembers) == 0 || team.TeamMembers[0] != userID {
		c.JSON(http.StatusForbidden, webmodels.ErrorMessage{
			Code:    403,
			Message: "Only team captain can delete the team",
		})
		return
	}

	// 检查战队是否有得分
	if team.TeamScore > 0 {
		c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
			Code:    400,
			Message: "无法解散有得分的战队",
		})
		return
	}

	// 删除战队（级联删除会处理相关记录）
	if err := dbtool.DB().Delete(&team).Error; err != nil {
		c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
			Code:    500,
			Message: "Failed to delete team",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "战队已解散",
	})
}

// UpdateTeamInfo 更新战队信息
func UpdateTeamInfo(c *gin.Context) {
	claims := jwt.ExtractClaims(c)
	userID := claims["UserID"].(string)

	teamIDStr := c.Param("team_id")
	teamID, err := strconv.ParseInt(teamIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
			Code:    400,
			Message: "Invalid team ID",
		})
		return
	}

	var payload struct {
		TeamSlogan *string `json:"team_slogan"`
	}

	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
			Code:    400,
			Message: "Invalid request payload",
		})
		return
	}

	// 获取战队信息
	var team models.Team
	if err := dbtool.DB().Where("team_id = ?", teamID).First(&team).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, webmodels.ErrorMessage{
				Code:    404,
				Message: "Team not found",
			})
		} else {
			c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
				Code:    500,
				Message: "System error",
			})
		}
		return
	}

	// 检查是否是队长
	if len(team.TeamMembers) == 0 || team.TeamMembers[0] != userID {
		c.JSON(http.StatusForbidden, webmodels.ErrorMessage{
			Code:    403,
			Message: "Only team captain can update team info",
		})
		return
	}

	// 更新战队口号
	if err := dbtool.DB().Model(&team).Update("team_slogan", payload.TeamSlogan).Error; err != nil {
		c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
			Code:    500,
			Message: "Failed to update team info",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "战队信息已更新",
	})
}

// UserGetGameGroups 用户获取比赛分组列表
func UserGetGameGroups(c *gin.Context) {
	gameIDStr := c.Param("game_id")
	gameID, err := strconv.ParseInt(gameIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
			Code:    400,
			Message: "Invalid game ID",
		})
		return
	}

	groupMap, err := ristretto_tool.CachedGameGroups(gameID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
			Code:    500,
			Message: "Failed to load game groups",
		})
	}

	groups := make([]webmodels.GameGroupSimple, 0, len(groupMap))
	for _, group := range groupMap {
		groups = append(groups, webmodels.GameGroupSimple{
			GroupID:   group.GroupID,
			GroupName: group.GroupName,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": groups,
	})
}
