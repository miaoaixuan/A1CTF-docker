package controllers

import (
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgconn"
	"gorm.io/gorm"

	"a1ctf/src/db/models"
	dbtool "a1ctf/src/utils/db_tool"
	k8stool "a1ctf/src/utils/k8s_tool"
)

type ListChallengePayload struct {
	Size     int64                     `json:"size" binding:"required"`
	Offset   int64                     `json:"offset" binding:"min=0"`
	Category *models.ChallengeCategory `json:"category,omitempty"`
}

type DeleteChallengePayload struct {
	ChallengeID int64 `json:"challenge_id" binding:"required"`
}

type ChallengeSearchPayload struct {
	Keyword string `json:"keyword"`
}

func AdminListChallenges(c *gin.Context) {
	var payload ListChallengePayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": err.Error(),
		})
		return
	}

	var challenges []models.Challenge
	query := dbtool.DB().Offset(int(payload.Offset)).Limit(int(payload.Size))

	if payload.Category != nil {
		query = query.Where("category = ?", payload.Category)
	}

	if err := query.Find(&challenges).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "Failed to load challenges",
		})
		return
	}

	data := make([]gin.H, 0)
	for _, challenge := range challenges {
		data = append(data, gin.H{
			"challenge_id": challenge.ChallengeID,
			"name":         challenge.Name,
			"description":  challenge.Description,
			"category":     challenge.Category,
			"create_time":  challenge.CreateTime,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": data,
	})
}

func AdminGetChallenge(c *gin.Context) {
	challengeIDStr := c.Param("challenge_id")
	challengeID, err := strconv.ParseInt(challengeIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "Invalid challenge ID",
		})
		return
	}

	var challenge models.Challenge
	if err := dbtool.DB().Where("challenge_id = ?", challengeID).First(&challenge).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"code":    404,
				"message": "Challenge not found",
			})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{
				"code":    500,
				"message": "Failed to load challenge",
			})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": challenge,
	})
}

func AdminCreateChallenge(c *gin.Context) {
	var payload models.Challenge
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": err.Error(),
		})
		return
	}

	if err := k8stool.ValidContainerConfig(*payload.ContainerConfig); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": err.Error(),
		})
		return
	}

	payload.CreateTime = time.Now().UTC()
	payload.ChallengeID = nil

	if err := dbtool.DB().Create(&payload).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "Failed to create challenge",
		})
		log.Panicf("%+v %v\n", payload, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": gin.H{
			"challenge_id": payload.ChallengeID,
			"create_at":    payload.CreateTime,
		},
	})
}

func AdminDeleteChallenge(c *gin.Context) {
	challengeIDStr := c.Param("challenge_id")
	challengeID, err := strconv.ParseInt(challengeIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "Invalid challenge ID",
		})
		return
	}

	result := dbtool.DB().Where("challenge_id = ?", challengeID).Delete(&models.Challenge{})
	if result.Error != nil {
		// 外键关联
		if result.Error.(*pgconn.PgError).Code == "23503" {
			c.JSON(http.StatusInternalServerError, gin.H{
				"code":    400,
				"message": "This challenge is used in game",
			})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{
				"code":    500,
				"message": "Failed to delete challenge",
			})
		}
		return
	}

	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"code":    404,
			"message": "Challenge not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "Challenge deleted",
	})
}

func AdminUpdateChallenge(c *gin.Context) {
	challengeIDStr := c.Param("challenge_id")
	challengeID, err := strconv.ParseInt(challengeIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "Invalid challenge ID",
		})
		return
	}

	var payload models.Challenge
	if err := c.ShouldBindJSON(&payload); err != nil || challengeID != *payload.ChallengeID {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "Invalid request payload",
		})
		return
	}

	if payload.ContainerConfig != nil {
		if err := k8stool.ValidContainerConfig(*payload.ContainerConfig); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"code":    400,
				"message": err.Error(),
			})
			return
		}
	}

	var existingChallenge models.Challenge
	if err := dbtool.DB().Where("challenge_id = ?", payload.ChallengeID).First(&existingChallenge).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{
				"code":    404,
				"message": "Challenge not found",
			})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{
				"code":    500,
				"message": "Failed to update challenge",
			})
		}
		return
	}

	if err := dbtool.DB().Model(&models.Challenge{}).Where("challenge_id = ?", payload.ChallengeID).Select("*").Updates(payload).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "Failed to update challenge",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "Updated",
	})
}

func AdminSearchChallenges(c *gin.Context) {
	var payload ChallengeSearchPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "Invalid request payload",
		})
		return
	}

	var challenges []models.Challenge
	if err := dbtool.DB().Where("name LIKE ?", "%"+payload.Keyword+"%").Find(&challenges).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "Failed to load challenges",
		})
		return
	}

	var data []gin.H = make([]gin.H, 0)
	for _, challenge := range challenges {
		data = append(data, gin.H{
			"challenge_id": challenge.ChallengeID,
			"name":         challenge.Name,
			"category":     challenge.Category,
			"create_time":  challenge.CreateTime,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": data,
	})
}
