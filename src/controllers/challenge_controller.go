package controllers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"a1ctf/src/db/models"
	dbtool "a1ctf/src/utils/db_tool"
)

type ListChallengePayload struct {
	Size     int64                     `json:"size" binding:"required"`
	Offset   int64                     `json:"offset" binding:"min=0"`
	Category *models.ChallengeCategory `json:"category,omitempty"`
}

type ChallengeInfoPayload struct {
	ChallengeID int64 `json:"challenge_id" binding:"required"`
}

type DeleteChallengePayload struct {
	ChallengeID int64 `json:"challenge_id" binding:"required"`
}

type ChallengeSearchPayload struct {
	Keyword string `json:"keyword" binding:"required"`
}

func ListChallenges(c *gin.Context) {
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

func GetChallenge(c *gin.Context) {
	var payload ChallengeInfoPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "Invalid request payload",
		})
		return
	}

	var challenge models.Challenge
	if err := dbtool.DB().Where("challenge_id = ?", payload.ChallengeID).First(&challenge).Error; err != nil {
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

func CreateChallenge(c *gin.Context) {
	var payload models.Challenge
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": err.Error(),
		})
		return
	}

	payload.CreateTime = time.Now()

	payload.ChallengeID = nil

	if err := dbtool.DB().Create(&payload).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "Failed to create challenge",
		})
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

func DeleteChallenge(c *gin.Context) {
	var payload DeleteChallengePayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "Invalid request payload",
		})
		return
	}

	result := dbtool.DB().Where("challenge_id = ?", payload.ChallengeID).Delete(&models.Challenge{})
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "Failed to delete challenge",
		})
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

func UpdateChallenge(c *gin.Context) {
	var payload models.Challenge
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "Invalid request payload",
		})
		return
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

	if err := dbtool.DB().Model(&models.Challenge{}).Where("challenge_id = ?", payload.ChallengeID).Updates(payload).Error; err != nil {
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

func SearchChallenges(c *gin.Context) {
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

	var data []gin.H
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
