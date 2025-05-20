package controllers

import (
	"a1ctf/src/db/models"
	dbtool "a1ctf/src/utils/db_tool"
	general "a1ctf/src/utils/general"
	"a1ctf/src/utils/redis_tool"
	"errors"
	"fmt"
	"log"
	"net/http"
	"slices"
	"sort"
	"strconv"
	"time"

	jwt "github.com/appleboy/gin-jwt/v2"
	"github.com/bytedance/sonic"
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
			c.JSON(http.StatusBadRequest, ErrorMessage{
				Code:    400,
				Message: "Invalid game ID",
			})
			c.Abort()
			return
		}

		var game models.Game

		if err := redis_tool.GetOrCache(fmt.Sprintf("game_info_%d", gameID), &game, func() (interface{}, error) {
			if err := dbtool.DB().Where("game_id = ?", gameID).First(&game).Error; err != nil {
				if err == gorm.ErrRecordNotFound {
					return nil, errors.New("game not found")
				} else {
					return nil, err
				}
			}

			return game, nil
		}, 1*time.Second, true); err != nil {
			log.Printf("+%v", err)
			c.JSON(http.StatusNotFound, ErrorMessage{
				Code:    404,
				Message: err.Error(),
			})
			c.Abort()
			return
		}

		if !game.Visible {
			c.JSON(http.StatusNotFound, ErrorMessage{
				Code:    404,
				Message: "Game not found",
			})
			c.Abort()
			return
		}

		now := time.Now().UTC()
		if game.StartTime.After(now) {
			c.JSON(http.StatusForbidden, ErrorMessage{
				Code:    403,
				Message: "Game not started yet",
			})
			c.Abort()
			return
		}

		if !visibleAfterEnded && game.EndTime.Before(now) && !game.PracticeMode {
			c.JSON(http.StatusForbidden, ErrorMessage{
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
		c.Set("game", game)
		c.Next()
	}
}

func TeamStatusMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		claims := jwt.ExtractClaims(c)
		user_id := claims["UserID"].(string)

		c.Set("user_id", user_id)

		var team models.Team

		if err := redis_tool.GetOrCache(fmt.Sprintf("team_info_for_user_%s", user_id), &team, func() (interface{}, error) {
			if err := dbtool.DB().Where("? = ANY(team_members)", user_id).First(&team).Error; err != nil {
				return nil, err
			}

			return team, nil
		}, 1*time.Second, true); err != nil {
			log.Printf("+%v", err)
			c.JSON(http.StatusForbidden, ErrorMessage{
				Code:    403,
				Message: "You must join a team in this game",
			})
			c.Abort()
			return
		}

		if team.TeamStatus == models.ParticipateParticipated || team.TeamStatus == models.ParticipatePending || team.TeamStatus == models.ParticipateRejected {
			c.JSON(http.StatusForbidden, ErrorMessage{
				Code:    403,
				Message: "You must join a team in this game",
			})
			c.Abort()
			return
		}

		if team.TeamStatus == models.ParticipateBanned {
			c.JSON(http.StatusForbidden, ErrorMessage{
				Code:    403,
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
		c.JSON(http.StatusInternalServerError, ErrorMessage{
			Code:    500,
			Message: "Failed to load games",
		})
		return
	}

	data := make([]UserGameSimpleInfo, 0, len(games))
	for _, game := range games {
		if !game.Visible {
			continue
		}

		data = append(data, UserGameSimpleInfo{
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

	// 从 JWT 中获取 user_id
	claims := jwt.ExtractClaims(c)
	user_id := claims["UserID"].(string)

	team_status := models.ParticipateUnRegistered

	var allTeams []models.Team
	if err := redis_tool.GetOrCache(fmt.Sprintf("all_teams_for_game_%d", game.GameID), &allTeams, func() (interface{}, error) {
		if err := dbtool.DB().Find(&allTeams).Where("game_id = ?", game.GameID).Error; err != nil {
			return nil, err
		}

		return allTeams, nil
	}, 1*time.Second, true); err != nil {
		c.JSON(http.StatusInternalServerError, ErrorMessage{
			Code:    500,
			Message: "Failed to load teams",
		})
		c.Abort()
		return
	}

	// 查找队伍
	var team models.Team

	for _, curTeam := range allTeams {
		if curTeam.TeamMembers != nil && slices.Contains(curTeam.TeamMembers, user_id) {
			team = curTeam
			team_status = team.TeamStatus
			break
		}
	}

	if team.TeamID == 0 {
		team_status = models.ParticipateUnRegistered
	}

	result := UserFullGameInfo{
		GameID:               game.GameID,
		Name:                 game.Name,
		Summary:              game.Summary,
		Description:          game.Description,
		Poster:               game.Poster,
		StartTime:            game.StartTime,
		EndTime:              game.EndTime,
		PracticeMode:         game.PracticeMode,
		TeamNumberLimit:      game.TeamNumberLimit,
		ContainerNumberLimit: game.ContainerNumberLimit,
		RequireWP:            game.RequireWp,
		WPExpireTime:         game.WpExpireTime,
		Stages:               game.Stages,
		Visible:              game.Visible,
		TeamStatus:           team_status,
		TeamInfo:             &team,
	}

	if team_status == models.ParticipateUnRegistered {
		result.TeamInfo = nil
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": result,
	})
}

func UserGetGameChallenges(c *gin.Context) {
	game := c.MustGet("game").(models.Game)

	var result map[string]interface{} = make(map[string]interface{})

	// Cache challenge list to redis
	if err := redis_tool.GetOrCache(fmt.Sprintf("challenges_for_game_%d", game.GameID), &result, func() (interface{}, error) {
		// 查找队伍
		var gameChallenges []models.GameChallenge

		// 使用 Preload 进行关联查询
		if err := dbtool.DB().Preload("Challenge").Find(&gameChallenges).Error; err != nil {
			errJSON, _ := sonic.Marshal(ErrorMessage{
				Code:    500,
				Message: "Failed to load game challenges",
			})
			return nil, errors.New(string(errJSON))
		}

		sort.Slice(gameChallenges, func(i, j int) bool {
			return gameChallenges[i].Challenge.Name < gameChallenges[j].Challenge.Name
		})

		// 游戏阶段判断
		gameStages := game.Stages
		var curStage = ""

		if gameStages != nil {
			for _, stage := range *gameStages {
				if stage.StartTime.Before(time.Now().UTC()) && stage.EndTime.After(time.Now().UTC()) {
					curStage = stage.StageName
					break
				}
			}
		}

		result["challenges"] = make([]UserSimpleGameChallenge, 0, len(gameChallenges))

		for _, gc := range gameChallenges {

			if gc.BelongStage != nil && *gc.BelongStage != curStage {
				continue
			}

			if !gc.Visible {
				continue
			}

			result["challenges"] = append(result["challenges"].([]UserSimpleGameChallenge), UserSimpleGameChallenge{
				ChallengeID:   *gc.Challenge.ChallengeID,
				ChallengeName: gc.Challenge.Name,
				TotalScore:    gc.TotalScore,
				CurScore:      gc.CurScore,
				SolveCount:    gc.SolveCount,
				Category:      gc.Challenge.Category,
			})
		}

		return result, nil
	}, 1*time.Second, true); err != nil {
		var errMsg ErrorMessage
		sonic.Unmarshal([]byte(err.Error()), &errMsg)
		c.JSON(http.StatusInternalServerError, errMsg)
		return
	}

	var team = c.MustGet("team").(models.Team)

	// Cache all solves to redis
	var totalSolves []models.Solve
	if err := redis_tool.GetOrCache(fmt.Sprintf("solved_challenges_for_game_%d", game.GameID), &totalSolves, func() (interface{}, error) {
		if err := dbtool.DB().Where("game_id = ? AND solve_status = ?", game.GameID, models.SolveCorrect).Preload("Challenge").Find(&totalSolves).Error; err != nil {
			return nil, err
		}

		return totalSolves, nil
	}, 1*time.Second, true); err != nil {
		c.JSON(http.StatusInternalServerError, ErrorMessage{
			Code:    500,
			Message: "System error",
		})
		return
	}

	var solves []models.Solve
	for _, solve := range totalSolves {
		if team.TeamID == solve.TeamID {
			solves = append(solves, solve)
		}
	}

	var solved_challenges []UserSimpleGameSolvedChallenge = make([]UserSimpleGameSolvedChallenge, 0, len(solves))

	for _, solve := range solves {
		solved_challenges = append(solved_challenges, UserSimpleGameSolvedChallenge{
			ChallengeID:   solve.ChallengeID,
			ChallengeName: solve.Challenge.Name,
			SolveTime:     solve.SolveTime,
			Rank:          solve.Rank,
		})
	}

	result["solved_challenges"] = solved_challenges

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": result,
	})
}

func UserGetGameChallenge(c *gin.Context) {
	game := c.MustGet("game").(models.Game)
	team := c.MustGet("team").(models.Team)

	challengeIDStr := c.Param("challenge_id")
	challengeID, err := strconv.ParseInt(challengeIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorMessage{
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

		c.JSON(http.StatusInternalServerError, ErrorMessage{
			Code:    500,
			Message: "Failed to load game challenges",
		})
		return
	}

	if len(gameChallenges) == 0 {
		c.JSON(http.StatusNotFound, ErrorMessage{
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
				c.JSON(http.StatusInternalServerError, ErrorMessage{
					Code:    500,
					Message: "System error",
				})
				return
			}
		} else {
			c.JSON(http.StatusInternalServerError, ErrorMessage{
				Code:    500,
				Message: "System error.",
			})
			return
		}
	}

	userAttachments := make([]UserAttachmentConfig, 0, len(gameChallenge.Challenge.Attachments))

	for _, attachment := range gameChallenge.Challenge.Attachments {
		userAttachments = append(userAttachments, UserAttachmentConfig{
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

	result := UserDetailGameChallenge{
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
		c.JSON(http.StatusInternalServerError, ErrorMessage{
			Code:    500,
			Message: "Failed to load containers",
		})
		return
	}

	if len(containers) > 1 {
		c.JSON(http.StatusInternalServerError, ErrorMessage{
			Code:    500,
			Message: "Failed to load containers",
		})
		return
	}

	result.Containers = make([]ExposePortInfo, 0, len(*gameChallenge.Challenge.ContainerConfig))
	for _, container := range *gameChallenge.Challenge.ContainerConfig {
		tempConfig := ExposePortInfo{
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
		c.JSON(http.StatusInternalServerError, ErrorMessage{
			Code:    500,
			Message: "Failed to load notices",
		})
		return
	}

	result := make([]GameNotice, 0, len(notices))
	for _, notice := range notices {
		result = append(result, GameNotice{
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

	var payload UserCreateTeamPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, ErrorMessage{
			Code:    400,
			Message: "Invalid request payload",
		})
		return
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
	}

	if err := dbtool.DB().Create(&newTeam).Error; err != nil {
		c.JSON(http.StatusInternalServerError, ErrorMessage{
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
		c.JSON(http.StatusBadRequest, ErrorMessage{
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

		c.JSON(http.StatusInternalServerError, ErrorMessage{
			Code:    500,
			Message: "Failed to load game challenges",
		})
		return
	}

	if len(gameChallenges) == 0 {
		c.JSON(http.StatusNotFound, ErrorMessage{
			Code:    404,
			Message: "Challenge not found",
		})
		return
	}

	gameChallenge := gameChallenges[0]

	var containers []models.Container
	if err := dbtool.DB().Where("game_id = ? AND team_id = ? AND (container_status = ? or container_status = ?)", game.GameID, team.TeamID, models.ContainerRunning, models.ContainerQueueing).Find(&containers).Error; err != nil {
		c.JSON(http.StatusInternalServerError, ErrorMessage{
			Code:    500,
			Message: "Failed to load containers",
		})
		return
	}

	for _, container := range containers {
		log.Printf("container: %+v\n", container)
		if container.ChallengeID == *gameChallenge.Challenge.ChallengeID && container.ContainerStatus == models.ContainerRunning {
			c.JSON(http.StatusBadRequest, ErrorMessage{
				Code:    400,
				Message: "You have created a container for this challenge",
			})
			return
		}

		if container.ChallengeID == *gameChallenge.Challenge.ChallengeID && container.ContainerStatus == models.ContainerQueueing {
			c.JSON(http.StatusBadRequest, ErrorMessage{
				Code:    400,
				Message: "Your container is queueing",
			})
			return
		}
	}

	if len(containers) > int(game.ContainerNumberLimit) {
		c.JSON(http.StatusBadRequest, ErrorMessage{
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
				c.JSON(http.StatusInternalServerError, ErrorMessage{
					Code:    500,
					Message: "System error",
				})
				return
			}
		} else {
			c.JSON(http.StatusInternalServerError, ErrorMessage{
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
		c.JSON(http.StatusInternalServerError, ErrorMessage{
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
		c.JSON(http.StatusBadRequest, ErrorMessage{
			Code:    400,
			Message: "Invalid challenge ID",
		})
		c.Abort()
		return
	}

	var containers []models.Container
	if err := dbtool.DB().Where("challenge_id = ? AND team_id = ? AND container_status = ?", challengeID, team.TeamID, models.ContainerRunning).Find(&containers).Error; err != nil {
		c.JSON(http.StatusInternalServerError, ErrorMessage{
			Code:    500,
			Message: "Failed to load containers",
		})
		return
	}

	if len(containers) == 0 {
		c.JSON(http.StatusBadRequest, ErrorMessage{
			Code:    400,
			Message: "Launch a container first.",
		})
		return
	}

	if len(containers) != 1 {
		c.JSON(http.StatusBadRequest, ErrorMessage{
			Code:    400,
			Message: "System error.",
		})
		return
	}

	curContainer := containers[0]

	if err := dbtool.DB().Model(&curContainer).Updates(map[string]interface{}{
		"container_status": models.ContainerStopping,
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, ErrorMessage{
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
		c.JSON(http.StatusBadRequest, ErrorMessage{
			Code:    400,
			Message: "Invalid challenge ID",
		})
		c.Abort()
		return
	}

	var containers []models.Container
	if err := dbtool.DB().Where("challenge_id = ? AND team_id = ? AND container_status = ?", challengeID, team.TeamID, models.ContainerRunning).Find(&containers).Error; err != nil {
		c.JSON(http.StatusInternalServerError, ErrorMessage{
			Code:    500,
			Message: "Failed to load containers",
		})
		return
	}

	if len(containers) == 0 {
		c.JSON(http.StatusBadRequest, ErrorMessage{
			Code:    400,
			Message: "Launch a container first.",
		})
		return
	}

	if len(containers) != 1 {
		c.JSON(http.StatusBadRequest, ErrorMessage{
			Code:    400,
			Message: "System error.",
		})
		return
	}

	curContainer := containers[0]

	if curContainer.ExpireTime.Sub(time.Now().UTC()).Minutes() > 30 {
		c.JSON(http.StatusBadRequest, ErrorMessage{
			Code:    400,
			Message: "You cannot extend the container now.",
		})
		return
	}

	if err := dbtool.DB().Model(&curContainer).Updates(map[string]interface{}{
		"expire_time": curContainer.ExpireTime.Add(time.Duration(2) * time.Hour),
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, ErrorMessage{
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
		c.JSON(http.StatusBadRequest, ErrorMessage{
			Code:    400,
			Message: "Invalid challenge ID",
		})
		c.Abort()
		return
	}

	var containers []models.Container
	if err := dbtool.DB().Where("challenge_id = ? AND team_id = ? AND (container_status = ? OR container_status = ? OR container_status = ?)", challengeID, team.TeamID, models.ContainerRunning, models.ContainerQueueing, models.ContainerStarting).Find(&containers).Error; err != nil {
		c.JSON(http.StatusInternalServerError, ErrorMessage{
			Code:    500,
			Message: "Failed to load containers",
		})
		return
	}

	if len(containers) == 0 {
		c.JSON(http.StatusBadRequest, ErrorMessage{
			Code:    400,
			Message: "Launch a container first.",
		})
		return
	}

	if len(containers) != 1 {
		c.JSON(http.StatusBadRequest, ErrorMessage{
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

		c.JSON(http.StatusInternalServerError, ErrorMessage{
			Code:    500,
			Message: "Failed to load game challenges",
		})
		return
	}

	if len(gameChallenges) == 0 {
		c.JSON(http.StatusNotFound, ErrorMessage{
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

	var payload UserSubmitFlagPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, ErrorMessage{
			Code:    400,
			Message: "Invalid request payload",
		})
		return
	}

	challengeIDStr := c.Param("challenge_id")
	challengeID, err := strconv.ParseInt(challengeIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorMessage{
			Code:    400,
			Message: "Invalid challenge ID",
		})
		c.Abort()
		return
	}

	var gameChallenge models.GameChallenge
	if err := dbtool.DB().Preload("Challenge").Where("game_id = ? AND game_challenges.challenge_id = ?", game.GameID, challengeID).First(&gameChallenge).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, ErrorMessage{
				Code:    404,
				Message: "Challenge not found",
			})
		} else {
			c.JSON(http.StatusInternalServerError, ErrorMessage{
				Code:    500,
				Message: "Failed to load game challenges",
			})
		}
		return
	}

	var teamFlag models.TeamFlag
	if err := dbtool.DB().Where("game_id = ? AND team_id = ? AND challenge_id = ?", game.GameID, team.TeamID, challengeID).First(&teamFlag).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, ErrorMessage{
				Code:    404,
				Message: "Please click the challenge first.",
			})
		} else {
			c.JSON(http.StatusInternalServerError, ErrorMessage{
				Code:    500,
				Message: "System error",
			})
		}
		return
	}

	var solve models.Solve
	if err := dbtool.DB().Where("game_id = ? AND team_id = ? AND challenge_id = ?", game.GameID, team.TeamID, challengeID).First(&solve).Error; err == nil {
		c.JSON(http.StatusBadRequest, ErrorMessage{
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
		c.JSON(http.StatusInternalServerError, ErrorMessage{
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
		c.JSON(http.StatusBadRequest, ErrorMessage{
			Code:    400,
			Message: "Invalid judge ID",
		})
		c.Abort()
		return
	}

	var judge models.Judge
	if err := dbtool.DB().Where("judge_id = ?", judgeIDStr).First(&judge).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, ErrorMessage{
				Code:    404,
				Message: "Judge not found",
			})
		} else {
			c.JSON(http.StatusInternalServerError, ErrorMessage{
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

	var gameChallenges []models.GameChallenge
	if err := dbtool.DB().Preload("Challenge").Where("game_id = ?", game.GameID).Find(&gameChallenges).Error; err != nil {
		c.JSON(http.StatusInternalServerError, ErrorMessage{
			Code:    500,
			Message: "Failed to load game challenges",
		})
		return
	}

	var scoreboardItems []models.ScoreBoard
	if err := dbtool.DB().Where("game_id = ?", game.GameID).Find(&scoreboardItems).Error; err != nil {
		c.JSON(http.StatusInternalServerError, ErrorMessage{
			Code:    500,
			Message: "Failed to load scoreboards",
		})
		return
	}

	var scoreboardRecords []models.ScoreBoardDataWithTime

	// 把所有分块的 ScoreboardItem 合并到一起
	for _, item := range scoreboardItems {
		scoreboardRecords = append(scoreboardRecords, item.Data...)
	}

	// 按照时间升序
	sort.Slice(scoreboardRecords, func(i, j int) bool {
		return scoreboardRecords[i].RecordTime.Before(scoreboardRecords[j].RecordTime)
	})

	// 最新一条记录
	var lastestRecord = scoreboardRecords[len(scoreboardRecords)-1]

	type kv struct {
		TeamID int64
		Value  models.ScoreBoardData
	}

	var lastRecordItems = make([]kv, 0, len(lastestRecord.Data))

	for k, v := range lastestRecord.Data {
		lastRecordItems = append(lastRecordItems, kv{
			TeamID: k,
			Value:  v,
		})
	}

	// 按照分数降序
	sort.Slice(lastRecordItems, func(i, j int) bool {
		return lastRecordItems[i].Value.Score > lastRecordItems[j].Value.Score
	})

	top10 := lastRecordItems[:min(10, len(lastRecordItems))]

	// 统计 TOP10 的分数线
	timeLineMap := make(map[int64]TimeLineItem)
	prevScoreMap := make(map[int64]float64)

	for _, item := range top10 {
		timeLineMap[item.TeamID] = TimeLineItem{
			TeamID:   item.TeamID,
			TeamName: item.Value.TeamName,
			Scores:   make([]TimeLineScoreItem, 0),
		}
	}

	// 统计所有时间的分数线
	for _, item := range scoreboardRecords {
		recordTime := item.RecordTime

		for teamID, scoreValue := range item.Data {
			if timeline, ok := timeLineMap[teamID]; ok {
				lastScore, valid := prevScoreMap[teamID]
				if !valid || lastScore != scoreValue.Score {
					timeline.Scores = append(timeline.Scores, TimeLineScoreItem{
						RecordTime: recordTime.UnixMilli(),
						Score:      scoreValue.Score,
					})
					timeLineMap[teamID] = timeline
					prevScoreMap[teamID] = scoreValue.Score
				}
			}
		}
	}

	// 转换为 []TimeLineItem
	var timeLines []TimeLineItem

	for _, item := range timeLineMap {
		timeLines = append(timeLines, item)
	}

	// 按照分数降序
	sort.Slice(timeLines, func(i, j int) bool {
		return timeLines[i].Scores[len(timeLines[i].Scores)-1].Score > timeLines[j].Scores[len(timeLines[j].Scores)-1].Score
	})

	// 统计剩下的人的解题状态
	var teams []models.Team
	if err := dbtool.DB().Where("game_id = ? AND team_status = ?", game.GameID, models.ParticipateApproved).Find(&teams).Error; err != nil {
		c.JSON(http.StatusInternalServerError, ErrorMessage{
			Code:    500,
			Message: "Failed to load teams",
		})
		return
	}

	var teamMap = make(map[int64]models.Team)
	for _, team := range teams {
		teamMap[team.TeamID] = team
	}

	// 先生成一张 solveID 和 Solve model 的哈希表
	var solves []models.Solve
	if err := dbtool.DB().Where("game_id = ?", game.GameID).Preload("GameChallenge").Preload("Solver").Find(&solves).Error; err != nil {
		c.JSON(http.StatusInternalServerError, ErrorMessage{
			Code:    500,
			Message: "Failed to load solves",
		})
		return
	}

	var solveMap = make(map[string]models.Solve)
	for _, solve := range solves {
		solveMap[solve.SolveID] = solve
	}

	var teamSolveMap = make([]TeamScoreItem, 0, len(teams))

	// 遍历最后一次的时间线
	for teamRank, item := range lastRecordItems {
		team, ok := teamMap[item.TeamID]
		if !ok {
			continue
		}

		teamSolvedChallenges := make([]TeamSolveItem, 0)
		for _, solveID := range item.Value.SolvedChallenges {
			if solve, ok := solveMap[solveID]; ok {
				teamSolvedChallenges = append(teamSolvedChallenges, TeamSolveItem{
					ChallengeID: solve.ChallengeID,
					Score:       solve.GameChallenge.CurScore,
					Solver:      solve.Solver.Username,
					Rank:        int64(solve.Rank),
					SolveTime:   solve.SolveTime,
				})
			}
		}

		teamSolveMap = append(teamSolveMap, TeamScoreItem{
			TeamID:           team.TeamID,
			TeamName:         team.TeamName,
			TeamAvatar:       team.TeamAvatar,
			TeamSlogan:       team.TeamSlogan,
			TeamDescription:  team.TeamDescription,
			Rank:             int64(teamRank + 1),
			Score:            item.Value.Score,
			SolvedChallenges: teamSolvedChallenges,
		})
	}

	var result = GameScoreboardData{
		GameID:     game.GameID,
		Name:       game.Name,
		TimeLines:  timeLines,
		TeamScores: teamSolveMap,
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": result,
	})

}
