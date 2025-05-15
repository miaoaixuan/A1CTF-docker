package controllers

import (
	"a1ctf/src/db/models"
	dbtool "a1ctf/src/utils/db_tool"
	"net/http"

	"github.com/gin-gonic/gin"
)

func AdminGetUsers(c *gin.Context) {

	var payload AdminListUsersPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
		return
	}

	var users []models.User
	if err := dbtool.DB().Find(&users).Offset(payload.Offset).Limit(payload.Size).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch users"})
		return
	}

}
