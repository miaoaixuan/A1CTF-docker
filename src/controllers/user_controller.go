package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func LoginTest(c *gin.Context) {

	c.JSON(http.StatusOK, gin.H{
		"message": "Hello, TEST2!",
	})
}
