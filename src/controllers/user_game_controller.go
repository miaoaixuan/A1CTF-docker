package controllers

import (
	"a1ctf/src/db/models"
	dbtool "a1ctf/src/utils/db_tool"
	general "a1ctf/src/utils/general"
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
func GameStatusMiddleware(visibleAfterEnded bool) gin.HandlerFunc {
	return func(c *gin.Context) {
		gameIDStr := c.Param("game_id")
		gameID, err := strconv.ParseInt(gameIDStr, 10, 64)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"code":    400,
				"message": "Invalid game ID",
			})
			c.Abort()
			return
		}

		var game models.Game
		if err := dbtool.DB().Where("game_id = ?", gameID).First(&game).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, gin.H{
					"code":    404,
					"message": "Game not found",
				})
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{
					"code":    500,
					"message": "Failed to load game",
				})
			}
			c.Abort()
			return
		}

		if !game.Visible {
			c.JSON(http.StatusNotFound, gin.H{
				"code":    404,
				"message": "Game not found",
			})
			c.Abort()
			return
		}

		now := time.Now().UTC()
		if game.StartTime.After(now) {
			c.JSON(http.StatusForbidden, gin.H{
				"code":    403,
				"message": "Game not started yet",
			})
			c.Abort()
			return
		}

		if !visibleAfterEnded && game.EndTime.Before(now) && !game.PracticeMode {
			c.JSON(http.StatusForbidden, gin.H{
				"code":    403,
				"message": "Game has ended",
			})
			c.Abort()
			return
		}

		claims := jwt.ExtractClaims(c)
		user_id := claims["UserID"].(string)

		c.Set("user_id", user_id)

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
		if err := dbtool.DB().Where("? = ANY(team_members)", user_id).First(&team).Error; err != nil {
			c.JSON(http.StatusForbidden, gin.H{
				"code":    403,
				"message": "You must join a team in this game",
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
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "Failed to load games",
		})
		return
	}

	data := make([]gin.H, 0, len(games))
	for _, game := range games {
		if !game.Visible {
			continue
		}

		data = append(data, gin.H{
			"game_id":    game.GameID,
			"name":       game.Name,
			"summary":    game.Summary,
			"start_time": game.StartTime,
			"end_time":   game.EndTime,
			"visible":    game.Visible,
			"poster":     game.Poster,
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

	// 查找队伍
	var team models.Team
	if err := dbtool.DB().Where("? = ANY(team_members)", user_id).First(&team).Error; err != nil {
		team_status = models.ParticipateUnRegistered
	} else {
		team_status = team.TeamStatus
	}

	// team_status = models.ParticipateApproved

	result := gin.H{
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
		"team_info":              team,
	}

	if team_status == models.ParticipateUnRegistered {
		result["team_info"] = nil
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": result,
	})
}

func UserGetGameChallenges(c *gin.Context) {
	game := c.MustGet("game").(models.Game)

	// 查找队伍
	var gameChallenges []struct {
		models.GameChallenge
		models.Challenge
	}

	// 使用 Preload 进行关联查询
	if err := dbtool.DB().Table("game_challenges").
		Joins("LEFT JOIN challenges ON game_challenges.challenge_id = challenges.challenge_id").
		Where("game_id = ?", game.GameID).
		Scan(&gameChallenges).Error; err != nil {

		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "Failed to load game challenges",
		})
		return
	}

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

	result := make([]gin.H, 0, len(gameChallenges))

	for _, gc := range gameChallenges {

		if gc.GameChallenge.BelongStage != nil && *gc.GameChallenge.BelongStage != curStage {
			continue
		}

		if !gc.GameChallenge.Visible {
			continue
		}

		result = append(result, gin.H{
			"challenge_id":   gc.Challenge.ChallengeID,
			"challenge_name": gc.Challenge.Name,
			"total_score":    gc.GameChallenge.TotalScore,
			"cur_score":      gc.GameChallenge.CurScore,
			"belong_stage":   gc.GameChallenge.BelongStage,
			"solve_count":    gc.SolveCount,
			"category":       gc.Challenge.Category,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": result,
	})
}

type UserAttachmentConfig struct {
	AttachName   string                `json:"attach_name"`
	AttachType   models.AttachmentType `json:"attach_type"`
	AttachURL    *string               `json:"attach_url,omitempty"`
	AttachHash   *string               `json:"attach_hash,omitempty"`
	DownloadHash *string               `json:"download_hash,omitempty"`
}

func UserGetGameChallenge(c *gin.Context) {
	game := c.MustGet("game").(models.Game)
	team := c.MustGet("team").(models.Team)

	challengeIDStr := c.Param("challenge_id")
	challengeID, err := strconv.ParseInt(challengeIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "Invalid challenge ID",
		})
		c.Abort()
		return
	}

	var gameChallenges []struct {
		models.GameChallenge
		models.Challenge
	}

	// 使用 Preload 进行关联查询
	if err := dbtool.DB().Table("game_challenges").
		Joins("LEFT JOIN challenges ON game_challenges.challenge_id = challenges.challenge_id").
		Where("game_id = ? and game_challenges.challenge_id = ?", game.GameID, challengeID).
		Scan(&gameChallenges).Error; err != nil {

		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "Failed to load game challenges",
		})
		return
	}

	if len(gameChallenges) == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"code":    404,
			"message": "Challenge not found",
		})
		return
	}

	gameChallenge := gameChallenges[0]

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
	visibleHints := make(models.Hints, 0, len(*gameChallenge.GameChallenge.Hints))
	for _, hint := range *gameChallenge.GameChallenge.Hints {
		if hint.Visible {
			visibleHints = append(visibleHints, hint)
		}
	}

	result := gin.H{
		"challenge_id":         gameChallenge.Challenge.ChallengeID,
		"challenge_name":       gameChallenge.Challenge.Name,
		"description":          gameChallenge.Challenge.Description,
		"total_score":          gameChallenge.GameChallenge.TotalScore,
		"cur_score":            gameChallenge.GameChallenge.CurScore,
		"hints":                visibleHints,
		"belong_stage":         gameChallenge.GameChallenge.BelongStage,
		"solve_count":          gameChallenge.SolveCount,
		"category":             gameChallenge.Challenge.Category,
		"attachments":          userAttachments,
		"container_type":       gameChallenge.Challenge.ContainerType,
		"container_status":     models.NoContainer,
		"container_expiretime": nil,
	}

	// 存活靶机处理
	var containers []models.Container
	if err := dbtool.DB().Where("game_id = ? AND challenge_id = ? AND team_id = ? AND (container_status = ? OR container_status = ?)", game.GameID, gameChallenge.Challenge.ChallengeID, team.TeamID, models.ContainerRunning, models.ContainerQueueing).Find(&containers).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "Failed to load containers",
		})
		return
	}

	if len(containers) > 1 {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "Failed to load containers",
		})
		return
	}

	result["containers"] = make([]gin.H, 0, len(*gameChallenge.Challenge.ContainerConfig))
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

		// var tempPorts models.ExposePorts = make(models.ExposePorts, 0)

		// for _, port := range container.ExposePorts {
		// 	tempPorts = append(tempPorts, models.ExposePort{
		// 		PortName: port.Name,
		// 		Port:     port.Port,
		// 		IP:       "node1.ctf.a1natas.com",
		// 	})
		// }

		// tempConfig["container_ports"] = tempPorts

		result["containers"] = append(result["containers"].([]gin.H), tempConfig)
	}

	if len(containers) > 0 {
		result["container_status"] = containers[0].ContainerStatus
		result["container_expiretime"] = containers[0].ExpireTime
	} else {
		result["container_status"] = models.NoContainer
		result["container_expiretime"] = nil
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
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "Failed to load notices",
		})
		return
	}

	result := make([]gin.H, 0, len(notices))
	for _, notice := range notices {
		result = append(result, gin.H{
			"notice_id":       notice.NoticeID,
			"notice_category": notice.NoticeCategory,
			"data":            notice.Data,
			"create_time":     notice.CreateTime,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": result,
	})
}

type CreateTeamPayload struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
	Slogan      string `json:"slogan"`
}

func UserCreateGameTeam(c *gin.Context) {

	game := c.MustGet("game").(models.Game)

	var payload CreateTeamPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "Invalid request payload",
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
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    501,
			"message": "System error",
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
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "Invalid challenge ID",
		})
		c.Abort()
		return
	}

	var gameChallenges []struct {
		models.GameChallenge
		models.Challenge
	}

	if err := dbtool.DB().Table("game_challenges").
		Joins("LEFT JOIN challenges ON game_challenges.challenge_id = challenges.challenge_id").
		Where("game_id = ? and game_challenges.challenge_id = ?", game.GameID, challengeID).
		Scan(&gameChallenges).Error; err != nil {

		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "Failed to load game challenges",
		})
		return
	}

	if len(gameChallenges) == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"code":    404,
			"message": "Challenge not found",
		})
		return
	}

	gameChallenge := gameChallenges[0]

	var containers []models.Container
	if err := dbtool.DB().Where("game_id = ? AND team_id = ? AND (container_status = ? or container_status = ?)", game.GameID, team.TeamID, models.ContainerRunning, models.ContainerQueueing).Find(&containers).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "Failed to load containers",
		})
		return
	}

	for _, container := range containers {
		log.Printf("container: %+v\n", container)
		if container.ChallengeID == *gameChallenge.Challenge.ChallengeID && container.ContainerStatus == models.ContainerRunning {
			c.JSON(http.StatusBadRequest, gin.H{
				"code":    400,
				"message": "You have created a container for this challenge",
			})
			return
		}

		if container.ChallengeID == *gameChallenge.Challenge.ChallengeID && container.ContainerStatus == models.ContainerQueueing {
			c.JSON(http.StatusBadRequest, gin.H{
				"code":    400,
				"message": "Your container is queueing",
			})
			return
		}
	}

	if len(containers) > int(game.ContainerNumberLimit) {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "You have created too many containers",
		})
		return
	}

	// 加入数据库
	newContainer := models.Container{
		ContainerID:          uuid.NewString(),
		GameID:               game.GameID,
		TeamID:               team.TeamID,
		ChallengeID:          *gameChallenge.Challenge.ChallengeID,
		InGameID:             gameChallenge.GameChallenge.IngameID,
		StartTime:            time.Now().UTC(),
		ExpireTime:           time.Now().Add(time.Duration(2) * time.Hour).UTC(),
		ContainerExposeInfos: make(models.ContainerExposeInfos, 0),
		ContainerStatus:      models.ContainerQueueing,
		FlagContent:          "flag{test_flag}",
		ContainerConfig:      *gameChallenge.Challenge.ContainerConfig,
		ChallengeName:        gameChallenge.Challenge.Name,
		TeamHash:             team.TeamHash,
	}

	if err := dbtool.DB().Create(&newContainer).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    501,
			"message": "System error",
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
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "Invalid challenge ID",
		})
		c.Abort()
		return
	}

	var containers []models.Container
	if err := dbtool.DB().Where("challenge_id = ? AND team_id = ? AND container_status = ?", challengeID, team.TeamID, models.ContainerRunning).Find(&containers).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "Failed to load containers",
		})
		return
	}

	if len(containers) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "Launch a container first.",
		})
		return
	}

	if len(containers) != 1 {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "System error.",
		})
		return
	}

	curContainer := containers[0]

	if err := dbtool.DB().Model(&curContainer).Updates(map[string]interface{}{
		"container_status": models.ContainerStopping,
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    501,
			"message": "System error",
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
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "Invalid challenge ID",
		})
		c.Abort()
		return
	}

	var containers []models.Container
	if err := dbtool.DB().Where("challenge_id = ? AND team_id = ? AND container_status = ?", challengeID, team.TeamID, models.ContainerRunning).Find(&containers).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "Failed to load containers",
		})
		return
	}

	if len(containers) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "Launch a container first.",
		})
		return
	}

	if len(containers) != 1 {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "System error.",
		})
		return
	}

	curContainer := containers[0]

	if curContainer.ExpireTime.Sub(time.Now().UTC()).Minutes() > 30 {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "You cannot extend the container now.",
		})
		return
	}

	if err := dbtool.DB().Model(&curContainer).Updates(map[string]interface{}{
		"expire_time": curContainer.ExpireTime.Add(time.Duration(2) * time.Hour),
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    501,
			"message": "System error",
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
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "Invalid challenge ID",
		})
		c.Abort()
		return
	}

	var containers []models.Container
	if err := dbtool.DB().Where("challenge_id = ? AND team_id = ? AND (container_status = ? OR container_status = ?)", challengeID, team.TeamID, models.ContainerRunning, models.ContainerQueueing).Find(&containers).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "Failed to load containers",
		})
		return
	}

	if len(containers) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "Launch a container first.",
		})
		return
	}

	if len(containers) != 1 {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "System error.",
		})
		return
	}

	var gameChallenges []struct {
		models.GameChallenge
		models.Challenge
	}

	// 使用 Preload 进行关联查询
	if err := dbtool.DB().Table("game_challenges").
		Joins("LEFT JOIN challenges ON game_challenges.challenge_id = challenges.challenge_id").
		Where("game_id = ? and game_challenges.challenge_id = ?", game.GameID, challengeID).
		Scan(&gameChallenges).Error; err != nil {

		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "Failed to load game challenges",
		})
		return
	}

	if len(gameChallenges) == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"code":    404,
			"message": "Challenge not found",
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
