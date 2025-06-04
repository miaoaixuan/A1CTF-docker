package controllers

import (
	"a1ctf/src/db/models"
	jwtauth "a1ctf/src/modules/jwt_auth"
	dbtool "a1ctf/src/utils/db_tool"
	general "a1ctf/src/utils/general"
	"a1ctf/src/utils/redis_tool"
	"a1ctf/src/webmodels"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"time"

	jwt "github.com/appleboy/gin-jwt/v2"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/lib/pq"
	"gorm.io/gorm"
)

// 比赛状态检查中间件
func GameStatusMiddleware(visibleAfterEnded bool, extractUserID bool) gin.HandlerFunc {
	return func(c *gin.Context) {
		gameIDStr := c.Param("game_id")
		gameID, err := strconv.ParseInt(gameIDStr, 10, 64)
		if err != nil {
			c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
				Code:    400,
				Message: "Invalid game ID",
			})
			c.Abort()
			return
		}

		game, err := redis_tool.CachedGameInfo(gameID)
		if err != nil {
			c.JSON(http.StatusNotFound, webmodels.ErrorMessage{
				Code:    404,
				Message: "Game not found",
			})
			c.Abort()
			return
		}

		if !game.Visible {
			c.JSON(http.StatusNotFound, webmodels.ErrorMessage{
				Code:    404,
				Message: "Game not found",
			})
			c.Abort()
			return
		}

		now := time.Now().UTC()
		if game.StartTime.After(now) {
			c.JSON(http.StatusForbidden, webmodels.ErrorMessage{
				Code:    403,
				Message: "Game not started yet",
			})
			c.Abort()
			return
		}

		if !visibleAfterEnded && game.EndTime.Before(now) && !game.PracticeMode {
			c.JSON(http.StatusForbidden, webmodels.ErrorMessage{
				Code:    403,
				Message: "Game has ended",
			})
			c.Abort()
			return
		}

		if extractUserID {
			claims := jwt.ExtractClaims(c)
			user_id := claims["UserID"].(string)

			c.Set("user_id", user_id)
		}

		// 将比赛信息存入上下文
		c.Set("game", *game)
		c.Next()
	}
}

func TeamStatusMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		claims := jwt.ExtractClaims(c)
		game := c.MustGet("game").(models.Game)
		user_id := claims["UserID"].(string)

		c.Set("user_id", user_id)

		memberBelongSearchMap, err := redis_tool.CachedMemberSearchTeamMap(game.GameID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
				Code:    500,
				Message: "Failed to load teams",
			})
			c.Abort()
			return
		}

		team, ok := memberBelongSearchMap[user_id]
		if !ok {
			c.JSON(http.StatusForbidden, webmodels.ErrorMessage{
				Code:    403,
				Message: "You must join a team in this game",
			})
			c.Abort()
			return
		}

		if team.TeamStatus == models.ParticipateParticipated || team.TeamStatus == models.ParticipatePending || team.TeamStatus == models.ParticipateRejected {
			c.JSON(http.StatusForbidden, webmodels.ErrorMessage{
				Code:    403,
				Message: "You must join a team in this game",
			})
			c.Abort()
			return
		}

		if team.TeamStatus == models.ParticipateBanned {
			c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
				Code:    400,
				Message: "You are banned from this game",
			})
			c.Abort()
			return
		}

		c.Set("team", team)
		c.Next()
	}
}

func UserListGames(c *gin.Context) {

	var games []models.Game
	query := dbtool.DB()

	if err := query.Find(&games).Error; err != nil {
		c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
			Code:    500,
			Message: "Failed to load games",
		})
		return
	}

	data := make([]webmodels.UserGameSimpleInfo, 0, len(games))
	for _, game := range games {
		if !game.Visible {
			continue
		}

		data = append(data, webmodels.UserGameSimpleInfo{
			GameID:    game.GameID,
			Name:      game.Name,
			Summary:   game.Summary,
			StartTime: game.StartTime,
			EndTime:   game.EndTime,
			Visible:   game.Visible,
			Poster:    game.Poster,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": data,
	})
}

func UserGetGameDetailWithTeamInfo(c *gin.Context) {

	game := c.MustGet("game").(models.Game)

	claims, err := jwtauth.GetJwtMiddleWare().GetClaimsFromJWT(c)

	var user_id string
	var logined bool = false
	var curTeam models.Team

	// 先获取所有队伍的信息
	teamDataMap, err := redis_tool.CachedMemberSearchTeamMap(game.GameID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
			Code:    500,
			Message: "failed to load team data",
		})
		return
	}

	tmpUserID, ok := claims["UserID"]
	if ok {
		user_id = tmpUserID.(string)
		curTeam, ok = teamDataMap[user_id]
		if ok {
			logined = true
		}
	}

	var team_status models.ParticipationStatus = models.ParticipateUnRegistered

	if logined {
		team_status = curTeam.TeamStatus
	} else {
		team_status = models.ParticipateUnLogin
	}

	// 基本游戏信息
	gameInfo := gin.H{
		"game_id":                game.GameID,
		"name":                   game.Name,
		"summary":                game.Summary,
		"description":            game.Description,
		"poster":                 game.Poster,
		"start_time":             game.StartTime,
		"end_time":               game.EndTime,
		"practice_mode":          game.PracticeMode,
		"team_number_limit":      game.TeamNumberLimit,
		"container_number_limit": game.ContainerNumberLimit,
		"require_wp":             game.RequireWp,
		"wp_expire_time":         game.WpExpireTime,
		"stages":                 game.Stages,
		"visible":                game.Visible,
		"team_status":            team_status,
		"team_info":              nil,
	}

	// 如果用户已加入队伍，添加队伍信息
	if team_status != models.ParticipateUnRegistered && curTeam.TeamID != 0 {
		// 获取团队成员信息
		var members []webmodels.TeamMemberInfo
		if len(curTeam.TeamMembers) > 0 {
			userMap, err := redis_tool.CachedMemberMap()
			if err != nil {
				c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
					Code:    500,
					Message: "Failed to load team members",
				})
			}

			// 构建成员详细信息
			for _, memberID := range curTeam.TeamMembers {
				user, ok := userMap[memberID]
				if !ok {
					continue
				}

				members = append(members, webmodels.TeamMemberInfo{
					Avatar:   user.Avatar,
					UserName: user.Username,
					UserID:   user.UserID,
					Captain:  false,
				})
			}

			// 设置第一个成员为队长
			if len(members) > 0 {
				// 假设第一个成员是队长/创建者
				members[0].Captain = true
			}
		}

		// 构建团队信息
		teamInfo := gin.H{
			"team_id":          curTeam.TeamID,
			"game_id":          curTeam.GameID,
			"team_name":        curTeam.TeamName,
			"team_avatar":      curTeam.TeamAvatar,
			"team_slogan":      curTeam.TeamSlogan,
			"team_description": curTeam.TeamDescription,
			"team_members":     members,
			"team_score":       curTeam.TeamScore,
			"team_hash":        curTeam.TeamHash,
			"invite_code":      curTeam.InviteCode,
			"team_status":      curTeam.TeamStatus,
			"rank":             0,
			"penalty":          0,
		}

		if curTeam.TeamStatus == models.ParticipateApproved {
			cachedData, err := redis_tool.CachedGameScoreBoard(game.GameID)
			if err != nil {
				c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
					Code:    500,
					Message: err.Error(),
				})
				return
			}

			teamSatus, ok := cachedData.FinalScoreBoardMap[curTeam.TeamID]

			if !ok {
				teamInfo["rank"] = 0
				teamInfo["penalty"] = 0
			} else {
				teamInfo["rank"] = teamSatus.Rank
				teamInfo["penalty"] = teamSatus.Penalty
			}

		}

		gameInfo["team_info"] = teamInfo
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": gameInfo,
	})
}

func UserGetGameChallenges(c *gin.Context) {
	game := c.MustGet("game").(models.Game)

	simpleGameChallenges, err := redis_tool.CachedGameSimpleChallenges(game.GameID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
			Code:    500,
			Message: "Failed to load game challenges",
		})
		return
	}

	var team = c.MustGet("team").(models.Team)

	// Cache all solves to redis

	solveMap, err := redis_tool.CachedSolvedChallengesForGame(game.GameID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
			Code:    500,
			Message: "Failed to load solves",
		})
	}

	solves, ok := solveMap[team.TeamID]
	if !ok {
		solves = make([]models.Solve, 0)
	}

	var solved_challenges []webmodels.UserSimpleGameSolvedChallenge = make([]webmodels.UserSimpleGameSolvedChallenge, 0, len(solves))

	for _, solve := range solves {
		solved_challenges = append(solved_challenges, webmodels.UserSimpleGameSolvedChallenge{
			ChallengeID:   solve.ChallengeID,
			ChallengeName: solve.Challenge.Name,
			SolveTime:     solve.SolveTime,
			Rank:          solve.Rank,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": gin.H{
			"challenges":        simpleGameChallenges,
			"solved_challenges": solved_challenges,
		},
	})
}

func UserGetGameChallenge(c *gin.Context) {
	game := c.MustGet("game").(models.Game)
	team := c.MustGet("team").(models.Team)

	challengeIDStr := c.Param("challenge_id")
	challengeID, err := strconv.ParseInt(challengeIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
			Code:    400,
			Message: "Invalid challenge ID",
		})
		c.Abort()
		return
	}
	var gameChallenges []models.GameChallenge

	// 使用 Preload 进行关联查询
	if err := dbtool.DB().Preload("Challenge").
		Where("game_id = ? and game_challenges.challenge_id = ?", game.GameID, challengeID).
		Find(&gameChallenges).Error; err != nil {

		c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
			Code:    500,
			Message: "Failed to load game challenges",
		})
		return
	}

	if len(gameChallenges) == 0 {
		c.JSON(http.StatusNotFound, webmodels.ErrorMessage{
			Code:    404,
			Message: "Challenge not found",
		})
		return
	}

	gameChallenge := gameChallenges[0]

	// 检查是否存在 Flag 如果不存在就按照 flag 模板生成一份
	var flag models.TeamFlag
	if err := dbtool.DB().Where("game_id = ? AND team_id = ? AND challenge_id = ?", game.GameID, team.TeamID, gameChallenge.Challenge.ChallengeID).First(&flag).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			// 生成 Flag
			flag = models.TeamFlag{
				FlagID:      0,
				FlagContent: *gameChallenge.JudgeConfig.FlagTemplate,
				TeamID:      team.TeamID,
				GameID:      game.GameID,
				ChallengeID: *gameChallenge.Challenge.ChallengeID,
			}

			if err := dbtool.DB().Create(&flag).Error; err != nil {
				c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
					Code:    500,
					Message: "System error",
				})
				return
			}
		} else {
			c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
				Code:    500,
				Message: "System error.",
			})
			return
		}
	}

	userAttachments := make([]webmodels.UserAttachmentConfig, 0, len(gameChallenge.Challenge.Attachments))

	for _, attachment := range gameChallenge.Challenge.Attachments {
		userAttachments = append(userAttachments, webmodels.UserAttachmentConfig{
			AttachName:   attachment.AttachName,
			AttachType:   attachment.AttachType,
			AttachURL:    attachment.AttachURL,
			AttachHash:   attachment.AttachHash,
			DownloadHash: attachment.DownloadHash,
		})
	}

	// Hints 处理
	visibleHints := make(models.Hints, 0, len(*gameChallenge.Hints))
	for _, hint := range *gameChallenge.Hints {
		if hint.Visible {
			visibleHints = append(visibleHints, hint)
		}
	}

	result := webmodels.UserDetailGameChallenge{
		ChallengeID:         *gameChallenge.Challenge.ChallengeID,
		ChallengeName:       gameChallenge.Challenge.Name,
		Description:         gameChallenge.Challenge.Description,
		TotalScore:          gameChallenge.TotalScore,
		CurScore:            gameChallenge.CurScore,
		Hints:               visibleHints,
		BelongStage:         gameChallenge.BelongStage,
		SolveCount:          gameChallenge.SolveCount,
		Category:            gameChallenge.Challenge.Category,
		Attachments:         userAttachments,
		ContainerType:       gameChallenge.Challenge.ContainerType,
		ContainerStatus:     models.NoContainer,
		ContainerExpireTime: nil,
	}

	// 存活靶机处理
	var containers []models.Container
	if err := dbtool.DB().Where("game_id = ? AND challenge_id = ? AND team_id = ? AND (container_status = ? OR container_status = ?)", game.GameID, gameChallenge.Challenge.ChallengeID, team.TeamID, models.ContainerRunning, models.ContainerQueueing).Find(&containers).Error; err != nil {
		c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
			Code:    500,
			Message: "Failed to load containers",
		})
		return
	}

	if len(containers) > 1 {
		c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
			Code:    500,
			Message: "Failed to load containers",
		})
		return
	}

	result.Containers = make([]webmodels.ExposePortInfo, 0, len(*gameChallenge.Challenge.ContainerConfig))
	for _, container := range *gameChallenge.Challenge.ContainerConfig {
		tempConfig := webmodels.ExposePortInfo{
			ContainerName:  container.Name,
			ContainerPorts: make(models.ExposePorts, 0),
		}

		if len(containers) == 1 {
			for _, container_expose := range containers[0].ContainerExposeInfos {
				if container_expose.ContainerName == container.Name {
					tempConfig.ContainerPorts = container_expose.ExposePorts
					break
				}
			}
		}

		// var tempPorts models.ExposePorts = make(models.ExposePorts, 0)

		// for _, port := range container.ExposePorts {
		// 	tempPorts = append(tempPorts, models.ExposePort{
		// 		PortName: port.Name,
		// 		Port:     port.Port,
		// 		IP:       "node1.ctf.a1natas.com",
		// 	})
		// }

		// tempConfig["container_ports"] = tempPorts

		result.Containers = append(result.Containers, tempConfig)
	}

	if len(containers) > 0 {
		result.ContainerStatus = containers[0].ContainerStatus
		result.ContainerExpireTime = &containers[0].ExpireTime
	} else {
		result.ContainerStatus = models.NoContainer
		result.ContainerExpireTime = nil
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": result,
	})
}

func UserGetGameNotices(c *gin.Context) {

	game := c.MustGet("game").(models.Game)

	var notices []models.Notice

	if err := dbtool.DB().Where("game_id = ?", game.GameID).Find(&notices).Error; err != nil {
		c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
			Code:    500,
			Message: "Failed to load notices",
		})
		return
	}

	result := make([]webmodels.GameNotice, 0, len(notices))
	for _, notice := range notices {
		result = append(result, webmodels.GameNotice{
			NoticeID:       notice.NoticeID,
			NoticeCategory: notice.NoticeCategory,
			Data:           notice.Data,
			CreateTime:     notice.CreateTime,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": result,
	})
}

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

func UserCreateGameContainer(c *gin.Context) {
	game := c.MustGet("game").(models.Game)
	team := c.MustGet("team").(models.Team)

	challengeIDStr := c.Param("challenge_id")
	challengeID, err := strconv.ParseInt(challengeIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
			Code:    400,
			Message: "Invalid challenge ID",
		})
		c.Abort()
		return
	}

	var gameChallenges []models.GameChallenge

	if err := dbtool.DB().Preload("Challenge").
		Where("game_id = ? and game_challenges.challenge_id = ?", game.GameID, challengeID).
		Find(&gameChallenges).Error; err != nil {

		c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
			Code:    500,
			Message: "Failed to load game challenges",
		})
		return
	}

	if len(gameChallenges) == 0 {
		c.JSON(http.StatusNotFound, webmodels.ErrorMessage{
			Code:    404,
			Message: "Challenge not found",
		})
		return
	}

	gameChallenge := gameChallenges[0]

	var containers []models.Container
	if err := dbtool.DB().Where("game_id = ? AND team_id = ? AND (container_status = ? or container_status = ?)", game.GameID, team.TeamID, models.ContainerRunning, models.ContainerQueueing).Find(&containers).Error; err != nil {
		c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
			Code:    500,
			Message: "Failed to load containers",
		})
		return
	}

	for _, container := range containers {
		log.Printf("container: %+v\n", container)
		if container.ChallengeID == *gameChallenge.Challenge.ChallengeID && container.ContainerStatus == models.ContainerRunning {
			c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
				Code:    400,
				Message: "You have created a container for this challenge",
			})
			return
		}

		if container.ChallengeID == *gameChallenge.Challenge.ChallengeID && container.ContainerStatus == models.ContainerQueueing {
			c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
				Code:    400,
				Message: "Your container is queueing",
			})
			return
		}
	}

	if len(containers) > int(game.ContainerNumberLimit) {
		c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
			Code:    400,
			Message: "You have created too many containers",
		})
		return
	}

	var flag models.TeamFlag
	if err := dbtool.DB().Where("game_id = ? AND team_id = ? AND challenge_id = ?", game.GameID, team.TeamID, gameChallenge.Challenge.ChallengeID).First(&flag).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			// 生成 Flag
			flag = models.TeamFlag{
				FlagID:      0,
				FlagContent: *gameChallenge.JudgeConfig.FlagTemplate,
				TeamID:      team.TeamID,
				GameID:      game.GameID,
				ChallengeID: *gameChallenge.Challenge.ChallengeID,
			}

			if err := dbtool.DB().Create(&flag).Error; err != nil {
				c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
					Code:    500,
					Message: "System error",
				})
				return
			}
		} else {
			c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
				Code:    500,
				Message: "System error.",
			})
			return
		}
	}

	// 加入数据库
	newContainer := models.Container{
		ContainerID:          uuid.NewString(),
		GameID:               game.GameID,
		FlagID:               flag.FlagID,
		TeamID:               team.TeamID,
		ChallengeID:          *gameChallenge.Challenge.ChallengeID,
		InGameID:             gameChallenge.IngameID,
		StartTime:            time.Now().UTC(),
		ExpireTime:           time.Now().Add(time.Duration(2) * time.Hour).UTC(),
		ContainerExposeInfos: make(models.ContainerExposeInfos, 0),
		ContainerStatus:      models.ContainerQueueing,
		ContainerConfig:      *gameChallenge.Challenge.ContainerConfig,
		ChallengeName:        gameChallenge.Challenge.Name,
		TeamHash:             team.TeamHash,
	}

	if err := dbtool.DB().Create(&newContainer).Error; err != nil {
		c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
			Code:    501,
			Message: "System error",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "OK",
	})
}

func UserCloseGameContainer(c *gin.Context) {
	_ = c.MustGet("game").(models.Game)
	team := c.MustGet("team").(models.Team)

	challengeIDStr := c.Param("challenge_id")
	challengeID, err := strconv.ParseInt(challengeIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
			Code:    400,
			Message: "Invalid challenge ID",
		})
		c.Abort()
		return
	}

	var containers []models.Container
	if err := dbtool.DB().Where("challenge_id = ? AND team_id = ? AND container_status = ?", challengeID, team.TeamID, models.ContainerRunning).Find(&containers).Error; err != nil {
		c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
			Code:    500,
			Message: "Failed to load containers",
		})
		return
	}

	if len(containers) == 0 {
		c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
			Code:    400,
			Message: "Launch a container first.",
		})
		return
	}

	if len(containers) != 1 {
		c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
			Code:    400,
			Message: "System error.",
		})
		return
	}

	curContainer := containers[0]

	if err := dbtool.DB().Model(&curContainer).Updates(map[string]interface{}{
		"container_status": models.ContainerStopping,
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
			Code:    501,
			Message: "System error",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "OK",
	})
}

func UserExtendGameContainer(c *gin.Context) {
	_ = c.MustGet("game").(models.Game)
	team := c.MustGet("team").(models.Team)

	challengeIDStr := c.Param("challenge_id")
	challengeID, err := strconv.ParseInt(challengeIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
			Code:    400,
			Message: "Invalid challenge ID",
		})
		c.Abort()
		return
	}

	var containers []models.Container
	if err := dbtool.DB().Where("challenge_id = ? AND team_id = ? AND container_status = ?", challengeID, team.TeamID, models.ContainerRunning).Find(&containers).Error; err != nil {
		c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
			Code:    500,
			Message: "Failed to load containers",
		})
		return
	}

	if len(containers) == 0 {
		c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
			Code:    400,
			Message: "Launch a container first.",
		})
		return
	}

	if len(containers) != 1 {
		c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
			Code:    400,
			Message: "System error.",
		})
		return
	}

	curContainer := containers[0]

	if curContainer.ExpireTime.Sub(time.Now().UTC()).Minutes() > 30 {
		c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
			Code:    400,
			Message: "You cannot extend the container now.",
		})
		return
	}

	if err := dbtool.DB().Model(&curContainer).Updates(map[string]interface{}{
		"expire_time": curContainer.ExpireTime.Add(time.Duration(2) * time.Hour),
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
			Code:    501,
			Message: "System error",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "OK",
	})
}

func UserGetGameChallengeContainerInfo(c *gin.Context) {
	game := c.MustGet("game").(models.Game)
	team := c.MustGet("team").(models.Team)

	challengeIDStr := c.Param("challenge_id")
	challengeID, err := strconv.ParseInt(challengeIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
			Code:    400,
			Message: "Invalid challenge ID",
		})
		c.Abort()
		return
	}

	var containers []models.Container
	if err := dbtool.DB().Where("challenge_id = ? AND team_id = ? AND (container_status = ? OR container_status = ? OR container_status = ?)", challengeID, team.TeamID, models.ContainerRunning, models.ContainerQueueing, models.ContainerStarting).Find(&containers).Error; err != nil {
		c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
			Code:    500,
			Message: "Failed to load containers",
		})
		return
	}

	if len(containers) == 0 {
		c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
			Code:    400,
			Message: "Launch a container first.",
		})
		return
	}

	if len(containers) != 1 {
		c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
			Code:    400,
			Message: "System error.",
		})
		return
	}

	var gameChallenges []models.GameChallenge

	// 使用 Preload 进行关联查询
	if err := dbtool.DB().Preload("Challenge").
		Where("game_id = ? and game_challenges.challenge_id = ?", game.GameID, challengeID).
		Find(&gameChallenges).Error; err != nil {

		c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
			Code:    500,
			Message: "Failed to load game challenges",
		})
		return
	}

	if len(gameChallenges) == 0 {
		c.JSON(http.StatusNotFound, webmodels.ErrorMessage{
			Code:    404,
			Message: "Challenge not found",
		})
		return
	}

	gameChallenge := gameChallenges[0]

	result := gin.H{
		"container_status":     containers[0].ContainerStatus,
		"containers":           make([]gin.H, 0, len(*gameChallenge.Challenge.ContainerConfig)),
		"container_expiretime": containers[0].ExpireTime,
	}

	for _, container := range *gameChallenge.Challenge.ContainerConfig {
		tempConfig := gin.H{
			"container_name":  container.Name,
			"container_ports": make(models.ExposePorts, 0),
		}

		if len(containers) == 1 {
			for _, container_expose := range containers[0].ContainerExposeInfos {
				if container_expose.ContainerName == container.Name {
					tempConfig["container_ports"] = container_expose.ExposePorts
					break
				}
			}
		}

		result["containers"] = append(result["containers"].([]gin.H), tempConfig)
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": result,
	})
}

func UserGameChallengeSubmitFlag(c *gin.Context) {
	game := c.MustGet("game").(models.Game)
	team := c.MustGet("team").(models.Team)

	var payload webmodels.UserSubmitFlagPayload = webmodels.UserSubmitFlagPayload{}
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
			Code:    400,
			Message: "Invalid request payload",
		})
		return
	}

	challengeIDStr := c.Param("challenge_id")
	challengeID, err := strconv.ParseInt(challengeIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
			Code:    400,
			Message: "Invalid challenge ID",
		})
		c.Abort()
		return
	}

	var gameChallenge models.GameChallenge
	if err := dbtool.DB().Preload("Challenge").Where("game_id = ? AND game_challenges.challenge_id = ?", game.GameID, challengeID).First(&gameChallenge).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, webmodels.ErrorMessage{
				Code:    404,
				Message: "Challenge not found",
			})
		} else {
			c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
				Code:    500,
				Message: "Failed to load game challenges",
			})
		}
		return
	}

	var teamFlag models.TeamFlag
	if err := dbtool.DB().Where("game_id = ? AND team_id = ? AND challenge_id = ?", game.GameID, team.TeamID, challengeID).First(&teamFlag).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, webmodels.ErrorMessage{
				Code:    404,
				Message: "Please click the challenge first.",
			})
		} else {
			c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
				Code:    500,
				Message: "System error",
			})
		}
		return
	}

	var solve models.Solve
	if err := dbtool.DB().Where("game_id = ? AND team_id = ? AND challenge_id = ?", game.GameID, team.TeamID, challengeID).First(&solve).Error; err == nil {
		c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
			Code:    400,
			Message: "You have already solved this challenge",
		})
		return
	}

	// 插入 Judge 队列
	newJudge := models.Judge{
		IngameID:     gameChallenge.IngameID,
		GameID:       game.GameID,
		ChallengeID:  *gameChallenge.Challenge.ChallengeID,
		TeamID:       team.TeamID,
		FlagID:       teamFlag.FlagID,
		JudgeType:    gameChallenge.JudgeConfig.JudgeType,
		JudgeStatus:  models.JudgeQueueing,
		SubmiterID:   c.MustGet("user_id").(string),
		JudgeID:      uuid.NewString(),
		JudgeTime:    time.Now().UTC(),
		JudgeContent: payload.FlagContent,
	}

	if err := dbtool.DB().Create(&newJudge).Error; err != nil {
		c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
			Code:    500,
			Message: "System error",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": gin.H{
			"judge_id": newJudge.JudgeID,
		},
	})
}

func UserGameGetJudgeResult(c *gin.Context) {
	_ = c.MustGet("game").(models.Game)
	_ = c.MustGet("team").(models.Team)

	judgeIDStr := c.Param("judge_id")

	if _, err := uuid.Parse(judgeIDStr); err != nil {
		c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
			Code:    400,
			Message: "Invalid judge ID",
		})
		c.Abort()
		return
	}

	team := c.MustGet("team").(models.Team)
	var judge models.Judge
	if err := dbtool.DB().Where("judge_id = ? AND team_id = ?", judgeIDStr, team.TeamID).First(&judge).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, webmodels.ErrorMessage{
				Code:    404,
				Message: "Judge not found",
			})
		} else {
			c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
				Code:    500,
				Message: "Failed to load judge",
			})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": gin.H{
			"judge_id":     judge.JudgeID,
			"judge_status": judge.JudgeStatus,
		},
	})
}

func UserGameGetScoreBoard(c *gin.Context) {
	game := c.MustGet("game").(models.Game)

	// 解析查询参数
	groupIDStr := c.Query("group_id")
	pageStr := c.DefaultQuery("page", "1")
	sizeStr := c.DefaultQuery("size", "20")

	var groupID *int64
	if groupIDStr != "" {
		if gid, err := strconv.ParseInt(groupIDStr, 10, 64); err == nil {
			groupID = &gid
		}
	}

	page, err := strconv.ParseInt(pageStr, 10, 64)
	if err != nil || page < 1 {
		page = 1
	}

	size, err := strconv.ParseInt(sizeStr, 10, 64)
	if err != nil || size < 1 || size > 100 {
		size = 20
	}

	// 获取当前用户的队伍信息（如果已登录）
	claims, err := jwtauth.GetJwtMiddleWare().GetClaimsFromJWT(c)

	var user_id string
	var logined bool = false
	var curTeamScoreItem *webmodels.TeamScoreItem = nil
	var curTeam models.Team

	// 先获取所有队伍的信息
	teamDataMap, err := redis_tool.CachedMemberSearchTeamMap(game.GameID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
			Code:    500,
			Message: "failed to load team data",
		})
		return
	}

	tmpUserID, ok := claims["UserID"]
	if ok {
		user_id = tmpUserID.(string)
		curTeam, ok = teamDataMap[user_id]
		if ok {
			logined = true
		}
	}

	// 获取题目信息
	simpleGameChallenges, err := redis_tool.CachedGameSimpleChallenges(game.GameID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
			Code:    500,
			Message: "failed to load game challenges",
		})
		return
	}

	// 获取排行榜数据（用于获取 Top10 时间线和当前用户队伍信息）
	scoreBoard, err := redis_tool.CachedGameScoreBoard(game.GameID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
			Code:    500,
			Message: "failed to load game scoreboard",
		})
		return
	}

	// 获取带队伍数量的分组信息（已缓存）
	simpleGameGroups, err := redis_tool.CachedGameGroupsWithTeamCount(game.GameID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
			Code:    500,
			Message: "failed to load game groups",
		})
		return
	}

	// 查找当前分组信息
	var currentGroup *webmodels.GameGroupSimple
	if groupID != nil {
		for _, group := range simpleGameGroups {
			if group.GroupID == *groupID {
				currentGroup = &group
				break
			}
		}
	}

	// 获取过滤后的排行榜数据（已缓存）
	filteredData, err := redis_tool.CachedFilteredGameScoreBoard(game.GameID, groupID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
			Code:    500,
			Message: "failed to load filtered scoreboard",
		})
		return
	}

	totalCachedTeamsCount := filteredData.TotalCount

	totalPages := (totalCachedTeamsCount + size - 1) / size
	pagination := webmodels.PaginationInfo{
		CurrentPage: page,
		PageSize:    size,
		TotalCount:  totalCachedTeamsCount,
		TotalPages:  totalPages,
	}

	if totalPages == 0 {
		// 如果没有数据，设置为第1页
		page = 1
		pagination.CurrentPage = 1
	} else if page > totalPages {
		// 如果页码超出范围，使用最后一页
		page = totalPages
		pagination.CurrentPage = totalPages
	}

	// 设置当前用户的队伍信息
	if logined {
		if myTeamScoreItem, ok := scoreBoard.FinalScoreBoardMap[curTeam.TeamID]; ok {
			curTeamScoreItem = &myTeamScoreItem
		}
	}

	curStartIdx := (page - 1) * size
	curEndIdx := min(curStartIdx+size, totalCachedTeamsCount)

	var pageTeamScores []webmodels.TeamScoreItem
	var pageTimeLines []webmodels.TimeLineItem

	if totalCachedTeamsCount > 0 && curStartIdx < totalCachedTeamsCount {
		pageTeamScores = filteredData.FilteredTeamRankings[curStartIdx:curEndIdx]
		pageTimeLines = filteredData.FilteredTimeLines[curStartIdx:curEndIdx]
	} else {
		pageTeamScores = make([]webmodels.TeamScoreItem, 0)
		pageTimeLines = make([]webmodels.TimeLineItem, 0)
	}

	result := webmodels.GameScoreboardData{
		GameID:               game.GameID,
		Name:                 game.Name,
		Top10TimeLines:       scoreBoard.Top10TimeLines,
		TeamScores:           pageTeamScores,
		TeamTimeLines:        pageTimeLines,
		SimpleGameChallenges: simpleGameChallenges,
		Groups:               simpleGameGroups,
		CurrentGroup:         currentGroup,
		Pagination:           &pagination,
	}

	if logined {
		result.YourTeam = curTeamScoreItem
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": result,
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
