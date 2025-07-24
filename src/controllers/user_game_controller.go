package controllers

import (
	"a1ctf/src/db/models"
	jwtauth "a1ctf/src/modules/jwt_auth"
	dbtool "a1ctf/src/utils/db_tool"
	"a1ctf/src/utils/ristretto_tool"
	"a1ctf/src/webmodels"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

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
	var teamFounded bool = false

	if err != nil {
		logined = false
	} else {
		logined = true
	}

	// 先获取所有队伍的信息
	teamDataMap, err := ristretto_tool.CachedMemberSearchTeamMap(game.GameID)
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
		curTeam, teamFounded = teamDataMap[user_id]
	}

	var team_status models.ParticipationStatus = models.ParticipateUnRegistered

	if logined {
		if teamFounded {
			team_status = curTeam.TeamStatus
		}
	} else {
		team_status = models.ParticipateUnLogin
	}

	// 基本游戏信息
	gameInfo := gin.H{
		"game_id":                game.GameID,
		"name":                   game.Name,
		"summary":                game.Summary,
		"description":            game.Description,
		"game_icon_light":        game.GameIconLight,
		"game_icon_dark":         game.GameIconDark,
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
			userMap, err := ristretto_tool.CachedMemberMap()
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
			"group_name":       nil,
			"rank":             0,
			"penalty":          0,
		}

		if curTeam.TeamStatus == models.ParticipateApproved {
			cachedData, err := ristretto_tool.CachedGameScoreBoard(game.GameID)
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

				if curTeam.Group != nil {
					teamInfo["group_name"] = curTeam.Group.GroupName
				}
			}

		}

		gameInfo["team_info"] = teamInfo
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": gameInfo,
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
	if err != nil || size < 1 {
		size = 20
	}

	// 获取当前用户的队伍信息（如果已登录）
	claims, _ := jwtauth.GetJwtMiddleWare().GetClaimsFromJWT(c)

	var user_id string
	var logined bool = false
	var curTeamScoreItem *webmodels.TeamScoreItem = nil
	var curTeam models.Team

	// 先获取所有队伍的信息
	teamDataMap, err := ristretto_tool.CachedMemberSearchTeamMap(game.GameID)
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
	simpleGameChallenges, err := ristretto_tool.CachedGameSimpleChallenges(game.GameID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
			Code:    500,
			Message: "failed to load game challenges",
		})
		return
	}

	// 获取排行榜数据（用于获取 Top10 时间线和当前用户队伍信息）
	scoreBoard, err := ristretto_tool.CachedGameScoreBoard(game.GameID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, webmodels.ErrorMessage{
			Code:    500,
			Message: "failed to load game scoreboard",
		})
		return
	}

	// 获取带队伍数量的分组信息（已缓存）
	simpleGameGroups, err := ristretto_tool.CachedGameGroupsWithTeamCount(game.GameID)
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
	filteredData, err := ristretto_tool.CachedFilteredGameScoreBoard(game.GameID, groupID)
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
		pageTimeLines = filteredData.FilteredTimeLines[curStartIdx:min(curEndIdx, int64(len(filteredData.FilteredTimeLines)))]

		// 补全 timelines 不足 teamscores 的部分, 出现这种情况的原因是因为积分榜只有在队伍有得分的情况下才会生成一条记录
		if len(pageTimeLines) < len(pageTeamScores) {
			pageTimeLines = append(pageTimeLines, webmodels.TimeLineItem{
				TeamID:   pageTeamScores[len(pageTimeLines)].TeamID,
				TeamName: pageTeamScores[len(pageTimeLines)].TeamName,
				Scores:   make([]webmodels.TimeLineScoreItem, 0),
			})
		}
	} else {
		pageTeamScores = make([]webmodels.TeamScoreItem, 0)
		pageTimeLines = make([]webmodels.TimeLineItem, 0)
	}

	// 过滤一遍 Top10，过滤掉没得分的
	filteredTop10TimeLines := make([]webmodels.TimeLineItem, 0)

	for _, top10TimeLine := range scoreBoard.Top10TimeLines {
		if len(top10TimeLine.Scores) > 0 {
			filteredTop10TimeLines = append(filteredTop10TimeLines, top10TimeLine)
		}
	}

	result := webmodels.GameScoreboardData{
		GameID:               game.GameID,
		Name:                 game.Name,
		Top10TimeLines:       filteredTop10TimeLines,
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
