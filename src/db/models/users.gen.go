package models

const TableNameUser = "users"

// User mapped from table <users>
type User struct {
	UserID        string `gorm:"column:user_id;primaryKey" json:"user_id"`
	Username      string `gorm:"column:username;not null" json:"username"`
	Password      string `gorm:"column:password;not null" json:"password"`
	Salt          string `gorm:"column:salt;not null" json:"salt"`
	Role          int32  `gorm:"column:role;not null" json:"role"`
	CurToken      string `gorm:"column:cur_token" json:"cur_token"`
	Phone         string `gorm:"column:phone" json:"phone"`
	StudentNumber string `gorm:"column:student_number" json:"student_number"`
	Realname      string `gorm:"column:realname" json:"realname"`
	Slogan        string `gorm:"column:slogan" json:"slogan"`
	Avatar        string `gorm:"column:avatar" json:"avatar"`
	SsoData       string `gorm:"column:sso_data" json:"sso_data"`
	Email         string `gorm:"column:email" json:"email"`
	EmailVerified bool   `gorm:"column:email_verified" json:"email_verified"`
}

// TableName User's table name
func (*User) TableName() string {
	return TableNameUser
}
