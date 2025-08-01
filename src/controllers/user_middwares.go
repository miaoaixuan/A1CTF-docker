package controllers

import (
	"a1ctf/src/db/models"
	clientconfig "a1ctf/src/modules/client_config"
	i18ntool "a1ctf/src/utils/i18n_tool"
	"a1ctf/src/utils/ristretto_tool"
	"a1ctf/src/webmodels"
	"net/http"
	"strconv"
	"time"

	jwt "github.com/appleboy/gin-jwt/v2"
	"github.com/gin-gonic/gin"
	"github.com/nicksnyder/go-i18n/v2/i18n"
)

// 比赛状态检查中间件
func GameStatusMiddleware(visibleAfterEnded bool, extractUserID bool, checkGameStarted bool) gin.HandlerFunc {
	return func(c *gin.Context) {
		gameIDStr := c.Param("game_id")
		gameID, err := strconv.ParseInt(gameIDStr, 10, 64)
		if err != nil {
			c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
				Code:    400,
				Message: i18ntool.Translate(c, &i18n.LocalizeConfig{MessageID: "InvalidGameID"}),
			})
			c.Abort()
			return
		}

		game, err := ristretto_tool.CachedGameInfo(gameID)
		if err != nil {
			c.JSON(http.StatusNotFound, webmodels.ErrorMessage{
				Code:    404,
				Message: i18ntool.Translate(c, &i18n.LocalizeConfig{MessageID: "GameNotFound"}),
			})
			c.Abort()
			return
		}

		if !game.Visible {
			c.JSON(http.StatusNotFound, webmodels.ErrorMessage{
				Code:    404,
				Message: i18ntool.Translate(c, &i18n.LocalizeConfig{MessageID: "GameNotFound"}),
			})
			c.Abort()
			return
		}

		user, exists := c.Get("user")

		// 管理员绕过时间检查
		var skipTimeCheck bool = false

		if exists {
			cvt := user.(models.User)
			if cvt.Role == models.UserRoleAdmin {
				skipTimeCheck = true
			}
		}

		if !skipTimeCheck {
			now := time.Now().UTC()
			if game.StartTime.After(now) && checkGameStarted {
				c.JSON(http.StatusForbidden, webmodels.ErrorMessage{
					Code:    403,
					Message: i18ntool.Translate(c, &i18n.LocalizeConfig{MessageID: "GameNotStartedYet"}),
				})
				c.Abort()
				return
			}

			if !visibleAfterEnded && game.EndTime.Before(now) && !game.PracticeMode {
				c.JSON(http.StatusForbidden, webmodels.ErrorMessage{
					Code:    403,
					Message: i18ntool.Translate(c, &i18n.LocalizeConfig{MessageID: "GameHasEnded"}),
				})
				c.Abort()
				return
			}
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

		memberBelongSearchMap, err := ristretto_tool.CachedMemberSearchTeamMap(game.GameID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
				Code:    500,
				Message: i18ntool.Translate(c, &i18n.LocalizeConfig{MessageID: "FailedToLoadTeams"}),
			})
			c.Abort()
			return
		}

		team, ok := memberBelongSearchMap[user_id]
		if !ok {
			c.JSON(http.StatusForbidden, webmodels.ErrorMessage{
				Code:    403,
				Message: i18ntool.Translate(c, &i18n.LocalizeConfig{MessageID: "YouMustJoinTeamInThisGame"}),
			})
			c.Abort()
			return
		}

		if team.TeamStatus == models.ParticipateParticipated || team.TeamStatus == models.ParticipatePending || team.TeamStatus == models.ParticipateRejected {
			c.JSON(http.StatusForbidden, webmodels.ErrorMessage{
				Code:    403,
				Message: i18ntool.Translate(c, &i18n.LocalizeConfig{MessageID: "YouMustJoinTeamInThisGame"}),
			})
			c.Abort()
			return
		}

		if team.TeamStatus == models.ParticipateBanned {
			c.JSON(http.StatusBadRequest, webmodels.ErrorMessage{
				Code:    400,
				Message: i18ntool.Translate(c, &i18n.LocalizeConfig{MessageID: "YouAreBannedFromThisGame"}),
			})
			c.Abort()
			return
		}

		c.Set("team", team)
		c.Next()
	}
}

func EmailVerifiedMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		user := c.MustGet("user").(models.User)

		// 检查邮箱验证状态
		if !user.EmailVerified && clientconfig.ClientConfig.AccountActivationMethod == "email" {
			c.JSON(421, webmodels.ErrorMessage{
				Code:    421,
				Message: i18ntool.Translate(c, &i18n.LocalizeConfig{MessageID: "YouMustVerifyEmailFirst"}),
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

func OperationNotAllowedAfterGameStartMiddleWare() gin.HandlerFunc {
	return func(c *gin.Context) {
		game := c.MustGet("game").(models.Game)

		if game.StartTime.Before(time.Now().UTC()) {
			c.JSON(http.StatusForbidden, webmodels.ErrorMessage{
				Code:    403,
				Message: i18ntool.Translate(c, &i18n.LocalizeConfig{MessageID: "OperationNotAllowedAfterGameStart"}),
			})
			c.Abort()
			return
		}

		c.Next()
	}
}
