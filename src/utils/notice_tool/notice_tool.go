package noticetool

import (
	"a1ctf/src/db/models"
	dbtool "a1ctf/src/utils/db_tool"
	"log"
	"time"

	"github.com/bytedance/sonic"
	"github.com/lib/pq"
)

func InsertNotice(gameID int64, category models.NoticeCategory, values []string) {
	notice := models.Notice{
		GameID:         gameID,
		CreateTime:     time.Now(),
		NoticeCategory: category,
		Announced:      false,
		Data:           pq.StringArray(values),
	}

	if err := dbtool.DB().Create(&notice).Error; err != nil {
		log.Printf("Failed to insert notice: %v", err)
	} else {
		AnnounceNotice(notice)
	}
}

func AnnounceNotice(notice models.Notice) {
	for session, gid := range dbtool.GameSessions() {
		if gid == notice.GameID {
			msg, _ := sonic.Marshal(map[string]interface{}{
				"type": "Notice",
				"message": map[string]interface{}{
					"notice_id":       notice.NoticeID,
					"notice_category": notice.NoticeCategory,
					"data":            notice.Data,
					"create_time":     notice.CreateTime,
				},
			})
			session.Write([]byte(msg))
		}
	}
}
