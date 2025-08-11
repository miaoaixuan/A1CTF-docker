package controllers

import (
	"a1ctf/src/db/models"
	"a1ctf/src/tasks"
	dbtool "a1ctf/src/utils/db_tool"
	general "a1ctf/src/utils/general"
	i18ntool "a1ctf/src/utils/i18n_tool"
	"a1ctf/src/utils/ristretto_tool"
	"a1ctf/src/webmodels"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/lib/pq"
	"github.com/nicksnyder/go-i18n/v2/i18n"
	"gorm.io/gorm"
)

func UserCreateGameTeam(c *gin.Context) {

	game := c.MustGet("game").(models.Game)
	user := c.MustGet("user").(models.User)

	var payload webmodels.UserCreateTeamPayload = webmodels.UserCreateTeamPayload{}
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
			Code:    400,
			Message: i18ntool.Translate(c, &i18n.LocalizeConfig{MessageID: "InvalidRequestPayload"}),
		})
		return
	}

	// 检查队伍名称是否已经存在
	var existingTeam models.Team
	if err := dbtool.DB().Where("game_id = ? AND team_name = ?", game.GameID, payload.Name).First(&existingTeam).Error; err == nil {
		c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
			Code:    400,
			Message: i18ntool.Translate(c, &i18n.LocalizeConfig{MessageID: "TeamNameAlreadyExists"}),
		})
		return
	} else if err != gorm.ErrRecordNotFound {
		c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
			Code:    500,
			Message: i18ntool.Translate(c, &i18n.LocalizeConfig{MessageID: "FailedToCheckTeamName"}),
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
					Message: i18ntool.Translate(c, &i18n.LocalizeConfig{MessageID: "InvalidGroupID"}),
				})
			} else {
				c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
					Code:    500,
					Message: i18ntool.Translate(c, &i18n.LocalizeConfig{MessageID: "FailedToValidateGroup"}),
				})
			}
			return
		}
	}

	inviteCode := fmt.Sprintf("%s-%s", payload.Name, uuid.New().String())
	teamMembers := pq.StringArray{user.UserID}

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
		TeamType:        models.TeamTypePlayer,
	}

	// 自动审核
	if game.TeamPolicy == models.TeamPolicyAuto {
		newTeam.TeamStatus = models.ParticipateApproved
	}

	if err := dbtool.DB().Create(&newTeam).Error; err != nil {
		// 记录创建队伍失败日志
		tasks.LogUserOperationWithError(c, models.ActionCreate, models.ResourceTypeTeam, nil, map[string]interface{}{
			"game_id":   game.GameID,
			"team_name": payload.Name,
			"group_id":  payload.GroupID,
		}, err)

		c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
			Code:    501,
			Message: i18ntool.Translate(c, &i18n.LocalizeConfig{MessageID: "SystemError"}),
		})
		return
	}

	tasks.LogUserOperation(c, models.ActionCreate, models.ResourceTypeTeam, nil, map[string]interface{}{
		"game_id":     game.GameID,
		"team_name":   payload.Name,
		"team_id":     newTeam.TeamID,
		"group_id":    payload.GroupID,
		"invite_code": inviteCode,
	})

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": newTeam,
	})
}

// TeamJoinRequest 申请加入战队
func TeamJoinRequest(c *gin.Context) {
	game := c.MustGet("game").(models.Game)
	user := c.MustGet("user").(models.User)
	userID := user.UserID

	payload := *c.MustGet("payload").(*webmodels.TeamJoinPayload)

	// 根据邀请码查找战队
	var team models.Team
	if err := dbtool.DB().Where("invite_code = ?", payload.InviteCode).First(&team).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, webmodels.ErrorMessage{
				Code:    404,
				Message: i18ntool.Translate(c, &i18n.LocalizeConfig{MessageID: "InvalidInviteCode"}),
			})
		} else {
			c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
				Code:    500,
				Message: i18ntool.Translate(c, &i18n.LocalizeConfig{MessageID: "SystemError"}),
			})
		}
		return
	}

	// 检查用户是否已经在战队中
	for _, memberID := range team.TeamMembers {
		if memberID == userID {
			c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
				Code:    400,
				Message: i18ntool.Translate(c, &i18n.LocalizeConfig{MessageID: "YouAreAlreadyMemberOfTeam"}),
			})
			return
		}
	}

	// 检查战队成员数是否已经超过最大限制
	if len(team.TeamMembers) >= int(game.TeamNumberLimit) {
		c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
			Code:    400,
			Message: i18ntool.Translate(c, &i18n.LocalizeConfig{MessageID: "TeamIsFull"}),
		})
		return
	}

	// 检查是否已经有待处理的申请
	var existingRequest models.TeamJoinRequest
	if err := dbtool.DB().Where("team_id = ? AND user_id = ? AND status = ?", team.TeamID, userID, models.JoinRequestPending).First(&existingRequest).Error; err == nil {
		c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
			Code:    400,
			Message: i18ntool.Translate(c, &i18n.LocalizeConfig{MessageID: "YouAlreadyHavePendingRequest"}),
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
		// 记录加入队伍申请失败日志
		tasks.LogUserOperationWithError(c, models.ActionJoinTeam, models.ResourceTypeTeam, &team.TeamName, map[string]interface{}{
			"team_id":     team.TeamID,
			"team_name":   team.TeamName,
			"game_id":     team.GameID,
			"invite_code": payload.InviteCode,
		}, err)

		c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
			Code:    500,
			Message: i18ntool.Translate(c, &i18n.LocalizeConfig{MessageID: "SystemError"}),
		})
		return
	}

	tasks.LogUserOperation(c, models.ActionJoinTeam, models.ResourceTypeTeam, &team.TeamName, map[string]interface{}{
		"team_id":     team.TeamID,
		"team_name":   team.TeamName,
		"game_id":     team.GameID,
		"request_id":  newRequest.RequestID,
		"invite_code": payload.InviteCode,
	})

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": i18ntool.Translate(c, &i18n.LocalizeConfig{MessageID: "ApplicationSubmitted"}),
	})
}

// GetTeamJoinRequests 获取战队加入申请列表
func GetTeamJoinRequests(c *gin.Context) {
	user := c.MustGet("user").(models.User)
	userID := user.UserID

	teamIDStr := c.Param("team_id")
	teamID, err := strconv.ParseInt(teamIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
			Code:    400,
			Message: i18ntool.Translate(c, &i18n.LocalizeConfig{MessageID: "InvalidTeamID"}),
		})
		return
	}

	// 检查用户是否是队长
	var team models.Team
	if err := dbtool.DB().Where("team_id = ?", teamID).First(&team).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, webmodels.ErrorMessage{
				Code:    404,
				Message: i18ntool.Translate(c, &i18n.LocalizeConfig{MessageID: "TeamNotFound"}),
			})
		} else {
			c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
				Code:    500,
				Message: i18ntool.Translate(c, &i18n.LocalizeConfig{MessageID: "SystemError"}),
			})
		}
		return
	}

	// 检查是否是队长（第一个成员）
	if len(team.TeamMembers) == 0 || team.TeamMembers[0] != userID {
		c.JSON(http.StatusForbidden, webmodels.ErrorMessage{
			Code:    403,
			Message: i18ntool.Translate(c, &i18n.LocalizeConfig{MessageID: "OnlyTeamCaptainCanViewRequests"}),
		})
		return
	}

	// 获取待处理的申请列表
	var requests []models.TeamJoinRequest
	if err := dbtool.DB().Where("team_id = ? AND status = ?", teamID, models.JoinRequestPending).Preload("User").Order("create_time ASC").Find(&requests).Error; err != nil {
		c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
			Code:    500,
			Message: i18ntool.Translate(c, &i18n.LocalizeConfig{MessageID: "FailedToLoadJoinRequests"}),
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
	game := c.MustGet("game").(models.Game)
	user := c.MustGet("user").(models.User)
	userID := user.UserID

	requestIDStr := c.Param("request_id")
	requestID, err := strconv.ParseInt(requestIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
			Code:    400,
			Message: i18ntool.Translate(c, &i18n.LocalizeConfig{MessageID: "InvalidRequestID"}),
		})
		return
	}

	payload := *c.MustGet("payload").(*webmodels.HandleJoinRequestPayload)

	if payload.Action != "approve" && payload.Action != "reject" {
		c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
			Code:    400,
			Message: "Invalid action",
		})
		return
	}

	// 查询申请记录
	var joinRequest models.TeamJoinRequest
	if err := dbtool.DB().Where("request_id = ?", requestID).First(&joinRequest).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, webmodels.ErrorMessage{
				Code:    404,
				Message: i18ntool.Translate(c, &i18n.LocalizeConfig{MessageID: "RequestNotFound"}),
			})
		} else {
			c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
				Code:    500,
				Message: i18ntool.Translate(c, &i18n.LocalizeConfig{MessageID: "SystemError"}),
			})
		}
		return
	}

	// 检查申请状态
	if joinRequest.Status != models.JoinRequestPending {
		c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
			Code:    400,
			Message: i18ntool.Translate(c, &i18n.LocalizeConfig{MessageID: "RequestAlreadyProcessed"}),
		})
		return
	}

	// 查询队伍信息并验证权限
	var team models.Team
	if err := dbtool.DB().Where("team_id = ?", joinRequest.TeamID).First(&team).Error; err != nil {
		c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
			Code:    500,
			Message: i18ntool.Translate(c, &i18n.LocalizeConfig{MessageID: "SystemError"}),
		})
		return
	}

	// 检查是否是队长（第一个成员）
	if len(team.TeamMembers) == 0 || team.TeamMembers[0] != userID {
		c.JSON(http.StatusForbidden, webmodels.ErrorMessage{
			Code:    403,
			Message: i18ntool.Translate(c, &i18n.LocalizeConfig{MessageID: "OnlyTeamCaptainCanHandleRequests"}),
		})
		return
	}

	// 检查战队成员数是否已经超过最大限制
	if len(team.TeamMembers) >= int(game.TeamNumberLimit) && payload.Action == "approve" {
		c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
			Code:    400,
			Message: i18ntool.Translate(c, &i18n.LocalizeConfig{MessageID: "TeamIsFull"}),
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

	var newStatus models.JoinRequestStatus
	var actionStr string
	if payload.Action == "approve" {
		newStatus = models.JoinRequestApproved
		actionStr = models.ActionApprove

		// 将用户添加到队伍中
		updatedMembers := append(team.TeamMembers, joinRequest.UserID)
		if err := tx.Model(&team).Update("team_members", pq.StringArray(updatedMembers)).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
				Code:    500,
				Message: i18ntool.Translate(c, &i18n.LocalizeConfig{MessageID: "FailedToAddMemberToTeam"}),
			})
			return
		}
	} else {
		newStatus = models.JoinRequestRejected
		actionStr = models.ActionReject
	}

	// 更新申请状态
	if err := tx.Model(&joinRequest).Update("status", newStatus).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
			Code:    500,
			Message: i18ntool.Translate(c, &i18n.LocalizeConfig{MessageID: "FailedToUpdateRequestStatus"}),
		})
		return
	}

	// 提交事务
	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
			Code:    500,
			Message: i18ntool.Translate(c, &i18n.LocalizeConfig{MessageID: "TransactionFailed"}),
		})
		return
	}

	tasks.LogUserOperation(c, actionStr, models.ResourceTypeTeam, &team.TeamName, map[string]interface{}{
		"team_id":      team.TeamID,
		"team_name":    team.TeamName,
		"request_id":   requestID,
		"applicant_id": joinRequest.UserID,
		"action":       payload.Action,
		"game_id":      team.GameID,
	})

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": i18ntool.Translate(c, &i18n.LocalizeConfig{MessageID: "RequestProcessed"}),
	})
}

// TransferTeamCaptain 转移队长
func TransferTeamCaptain(c *gin.Context) {
	user := c.MustGet("user").(models.User)
	currentCaptainID := user.UserID

	teamIDStr := c.Param("team_id")
	teamID, err := strconv.ParseInt(teamIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
			Code:    400,
			Message: i18ntool.Translate(c, &i18n.LocalizeConfig{MessageID: "InvalidTeamID"}),
		})
		return
	}

	payload := *c.MustGet("payload").(*webmodels.TransferCaptainPayload)

	// 查询队伍
	var team models.Team
	if err := dbtool.DB().Where("team_id = ?", teamID).First(&team).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, webmodels.ErrorMessage{
				Code:    404,
				Message: i18ntool.Translate(c, &i18n.LocalizeConfig{MessageID: "TeamNotFound"}),
			})
		} else {
			c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
				Code:    500,
				Message: i18ntool.Translate(c, &i18n.LocalizeConfig{MessageID: "SystemError"}),
			})
		}
		return
	}

	// 检查权限（必须是当前队长）
	if len(team.TeamMembers) == 0 || team.TeamMembers[0] != currentCaptainID {
		c.JSON(http.StatusForbidden, webmodels.ErrorMessage{
			Code:    403,
			Message: i18ntool.Translate(c, &i18n.LocalizeConfig{MessageID: "OnlyTeamCaptainCanTransferCaptaincy"}),
		})
		return
	}

	// 检查新队长是否在队伍中
	newCaptainIndex := -1
	for i, memberID := range team.TeamMembers {
		if memberID == payload.NewCaptainID {
			newCaptainIndex = i
			break
		}
	}

	if newCaptainIndex == -1 {
		c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
			Code:    400,
			Message: i18ntool.Translate(c, &i18n.LocalizeConfig{MessageID: "NewCaptainNotTeamMember"}),
		})
		return
	}

	// 重新排序成员列表，将新队长移到第一位
	newMembers := make([]string, len(team.TeamMembers))
	newMembers[0] = payload.NewCaptainID
	idx := 1
	for _, memberID := range team.TeamMembers {
		if memberID != payload.NewCaptainID {
			newMembers[idx] = memberID
			idx++
		}
	}

	// 更新队伍成员列表
	if err := dbtool.DB().Model(&team).Update("team_members", pq.StringArray(newMembers)).Error; err != nil {
		// 记录转移队长失败日志
		tasks.LogUserOperationWithError(c, models.ActionTransfer, models.ResourceTypeTeam, &team.TeamName, map[string]interface{}{
			"team_id":        team.TeamID,
			"team_name":      team.TeamName,
			"old_captain_id": currentCaptainID,
			"new_captain_id": payload.NewCaptainID,
			"game_id":        team.GameID,
		}, err)

		c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
			Code:    500,
			Message: i18ntool.Translate(c, &i18n.LocalizeConfig{MessageID: "FailedToTransferCaptaincy"}),
		})
		return
	}

	tasks.LogUserOperation(c, models.ActionTransfer, models.ResourceTypeTeam, &team.TeamName, map[string]interface{}{
		"team_id":        team.TeamID,
		"team_name":      team.TeamName,
		"user_id":        user.UserID,
		"old_captain_id": currentCaptainID,
		"new_captain_id": payload.NewCaptainID,
		"game_id":        team.GameID,
	})

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": i18ntool.Translate(c, &i18n.LocalizeConfig{MessageID: "CaptainTransferred"}),
	})
}

// RemoveTeamMember 踢出队员
func RemoveTeamMember(c *gin.Context) {
	user := c.MustGet("user").(models.User)
	captainID := user.UserID

	teamIDStr := c.Param("team_id")
	teamID, err := strconv.ParseInt(teamIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
			Code:    400,
			Message: i18ntool.Translate(c, &i18n.LocalizeConfig{MessageID: "InvalidTeamID"}),
		})
		return
	}

	targetUserID := c.Param("user_id")

	// 查询队伍
	var team models.Team
	if err := dbtool.DB().Where("team_id = ?", teamID).First(&team).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, webmodels.ErrorMessage{
				Code:    404,
				Message: i18ntool.Translate(c, &i18n.LocalizeConfig{MessageID: "TeamNotFound"}),
			})
		} else {
			c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
				Code:    500,
				Message: i18ntool.Translate(c, &i18n.LocalizeConfig{MessageID: "SystemError"}),
			})
		}
		return
	}

	// 检查权限（必须是队长）
	if len(team.TeamMembers) == 0 || team.TeamMembers[0] != captainID {
		c.JSON(http.StatusForbidden, webmodels.ErrorMessage{
			Code:    403,
			Message: i18ntool.Translate(c, &i18n.LocalizeConfig{MessageID: "OnlyTeamCaptainCanRemoveMembers"}),
		})
		return
	}

	// 不能踢出自己（队长）
	if targetUserID == captainID {
		c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
			Code:    400,
			Message: i18ntool.Translate(c, &i18n.LocalizeConfig{MessageID: "CaptainCannotRemoveThemselves"}),
		})
		return
	}

	// 检查目标用户是否在队伍中
	targetIndex := -1
	for i, memberID := range team.TeamMembers {
		if memberID == targetUserID {
			targetIndex = i
			break
		}
	}

	if targetIndex == -1 {
		c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
			Code:    400,
			Message: i18ntool.Translate(c, &i18n.LocalizeConfig{MessageID: "UserIsNotMemberOfTeam"}),
		})
		return
	}

	// 从成员列表中移除目标用户
	newMembers := make([]string, 0, len(team.TeamMembers)-1)
	for _, memberID := range team.TeamMembers {
		if memberID != targetUserID {
			newMembers = append(newMembers, memberID)
		}
	}

	// 更新队伍成员列表
	if err := dbtool.DB().Model(&team).Update("team_members", pq.StringArray(newMembers)).Error; err != nil {
		tasks.LogUserOperationWithError(c, "REMOVE_MEMBER", models.ResourceTypeTeam, &team.TeamName, map[string]interface{}{
			"team_id":         team.TeamID,
			"team_name":       team.TeamName,
			"removed_user_id": targetUserID,
			"game_id":         team.GameID,
		}, err)

		c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
			Code:    500,
			Message: i18ntool.Translate(c, &i18n.LocalizeConfig{MessageID: "FailedToRemoveMember"}),
		})
		return
	}

	tasks.LogUserOperation(c, "REMOVE_MEMBER", models.ResourceTypeTeam, &team.TeamName, map[string]interface{}{
		"team_id":         team.TeamID,
		"team_name":       team.TeamName,
		"removed_user_id": targetUserID,
		"game_id":         team.GameID,
	})

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": i18ntool.Translate(c, &i18n.LocalizeConfig{MessageID: "MemberRemoved"}),
	})
}

// DeleteTeam 解散战队
func DeleteTeam(c *gin.Context) {
	user := c.MustGet("user").(models.User)
	captainID := user.UserID

	teamIDStr := c.Param("team_id")
	teamID, err := strconv.ParseInt(teamIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
			Code:    400,
			Message: i18ntool.Translate(c, &i18n.LocalizeConfig{MessageID: "InvalidTeamID"}),
		})
		return
	}

	// 查询队伍
	var team models.Team
	if err := dbtool.DB().Where("team_id = ?", teamID).First(&team).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, webmodels.ErrorMessage{
				Code:    404,
				Message: i18ntool.Translate(c, &i18n.LocalizeConfig{MessageID: "TeamNotFound"}),
			})
		} else {
			c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
				Code:    500,
				Message: i18ntool.Translate(c, &i18n.LocalizeConfig{MessageID: "SystemError"}),
			})
		}
		return
	}

	// 检查权限（必须是队长）
	if len(team.TeamMembers) == 0 || team.TeamMembers[0] != captainID {
		c.JSON(http.StatusForbidden, webmodels.ErrorMessage{
			Code:    403,
			Message: i18ntool.Translate(c, &i18n.LocalizeConfig{MessageID: "OnlyTeamCaptainCanDeleteTeam"}),
		})
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
	if err := tx.Where("team_id = ?", teamID).Delete(&models.TeamJoinRequest{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
			Code:    500,
			Message: i18ntool.Translate(c, &i18n.LocalizeConfig{MessageID: "FailedToDeleteTeamJoinRequests"}),
		})
		return
	}

	// 删除队伍
	if err := tx.Delete(&team).Error; err != nil {
		tx.Rollback()

		// 记录删除队伍失败日志
		tasks.LogUserOperationWithError(c, models.ActionDelete, models.ResourceTypeTeam, &team.TeamName, map[string]interface{}{
			"team_id":   team.TeamID,
			"team_name": team.TeamName,
			"game_id":   team.GameID,
		}, err)

		c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
			Code:    500,
			Message: i18ntool.Translate(c, &i18n.LocalizeConfig{MessageID: "FailedToDeleteTeam"}),
		})
		return
	}

	// 提交事务
	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
			Code:    500,
			Message: i18ntool.Translate(c, &i18n.LocalizeConfig{MessageID: "TransactionFailed"}),
		})
		return
	}

	tasks.LogUserOperation(c, models.ActionDelete, models.ResourceTypeTeam, &team.TeamName, map[string]interface{}{
		"team_id":      team.TeamID,
		"team_name":    team.TeamName,
		"game_id":      team.GameID,
		"member_count": len(team.TeamMembers),
	})

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": i18ntool.Translate(c, &i18n.LocalizeConfig{MessageID: "TeamDeleted"}),
	})
}

// UpdateTeamInfo 更新战队信息
func UpdateTeamInfo(c *gin.Context) {
	user := c.MustGet("user").(models.User)
	userID := user.UserID

	teamIDStr := c.Param("team_id")
	teamID, err := strconv.ParseInt(teamIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
			Code:    400,
			Message: i18ntool.Translate(c, &i18n.LocalizeConfig{MessageID: "InvalidTeamID"}),
		})
		return
	}

	var payload webmodels.UpdateTeamInfoPayload

	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
			Code:    400,
			Message: i18ntool.Translate(c, &i18n.LocalizeConfig{MessageID: "InvalidRequestPayload"}),
		})
		return
	}

	// 查询队伍
	var team models.Team
	if err := dbtool.DB().Where("team_id = ?", teamID).First(&team).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, webmodels.ErrorMessage{
				Code:    404,
				Message: i18ntool.Translate(c, &i18n.LocalizeConfig{MessageID: "TeamNotFound"}),
			})
		} else {
			c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
				Code:    500,
				Message: i18ntool.Translate(c, &i18n.LocalizeConfig{MessageID: "SystemError"}),
			})
		}
		return
	}

	// 检查权限（必须是队长）
	if len(team.TeamMembers) == 0 || team.TeamMembers[0] != userID {
		c.JSON(http.StatusForbidden, webmodels.ErrorMessage{
			Code:    403,
			Message: i18ntool.Translate(c, &i18n.LocalizeConfig{MessageID: "OnlyTeamCaptainCanUpdateTeamInfo"}),
		})
		return
	}

	// 保存旧值用于日志
	oldSlogan := ""
	if team.TeamSlogan != nil {
		oldSlogan = *team.TeamSlogan
	}

	// 更新队伍信息
	if err := dbtool.DB().Model(&team).Update("team_slogan", payload.TeamSlogan).Error; err != nil {
		tasks.LogUserOperationWithError(c, models.ActionUpdate, models.ResourceTypeTeam, &team.TeamName, map[string]interface{}{
			"team_id":    team.TeamID,
			"team_name":  team.TeamName,
			"old_slogan": oldSlogan,
			"new_slogan": payload.TeamSlogan,
			"game_id":    team.GameID,
		}, err)

		c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
			Code:    500,
			Message: i18ntool.Translate(c, &i18n.LocalizeConfig{MessageID: "FailedToUpdateTeamInfo"}),
		})
		return
	}

	tasks.LogUserOperation(c, models.ActionUpdate, models.ResourceTypeTeam, &team.TeamName, map[string]interface{}{
		"team_id":    team.TeamID,
		"team_name":  team.TeamName,
		"old_slogan": oldSlogan,
		"new_slogan": payload.TeamSlogan,
		"game_id":    team.GameID,
	})

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": i18ntool.Translate(c, &i18n.LocalizeConfig{MessageID: "TeamInfoUpdated"}),
	})
}

// UserGetGameGroups 用户获取比赛分组列表
func UserGetGameGroups(c *gin.Context) {
	gameIDStr := c.Param("game_id")
	gameID, err := strconv.ParseInt(gameIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
			Code:    400,
			Message: i18ntool.Translate(c, &i18n.LocalizeConfig{MessageID: "InvalidGameID"}),
		})
		return
	}

	groupMap, err := ristretto_tool.CachedGameGroups(gameID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
			Code:    500,
			Message: i18ntool.Translate(c, &i18n.LocalizeConfig{MessageID: "FailedToLoadGameGroups"}),
		})
		return
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
