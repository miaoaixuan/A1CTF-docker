package main

import (
	"log"
	"net/http"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	"a1ctf/src/controllers"
	"a1ctf/src/db/models"

	"github.com/gin-gonic/gin"
)

func Index(c *gin.Context) {

	dsn := "host=localhost user=postgres password=root dbname=a1ctf port=5000 sslmode=disable TimeZone=Asia/Shanghai"
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		panic(err)
	}

	result := models.Challenge{}
	if db.First(&result).Error != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"message": "Not Found",
		})
		return
	} else {
		c.JSON(http.StatusOK, gin.H{
			"message": result,
		})
	}
}

func main() {
	r := gin.Default()

	r.GET("/", Index)
	r.GET("/Login", controllers.LoginTest)

	log.Fatal(r.Run(":8080"))

	// k8stool.TestCreate()
}
