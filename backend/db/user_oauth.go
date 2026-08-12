package db

import (
	"time"
)

type UserOAuth struct {
	Id           int32      `gorm:"column:id;primary_key;AUTO_INCREMENT;NOT NULL" json:"id"`
	UserId       int32      `gorm:"column:userId;NOT NULL;index" json:"userId"`                     // 关联系统用户ID
	Provider     string     `gorm:"column:provider;type:varchar(32);NOT NULL;index" json:"provider"` // github / google / qq / wechat / douyin / bilibili
	OpenId       string     `gorm:"column:openId;type:varchar(128);NOT NULL;index" json:"openId"`   // 平台唯一ID
	UnionId      string     `gorm:"column:unionId;type:varchar(128)" json:"unionId,omitempty"`      // 微信/QQ/抖音 UnionID
	Nickname     string     `gorm:"column:nickname;type:varchar(128)" json:"nickname,omitempty"`    // 平台昵称
	AvatarUrl    string     `gorm:"column:avatarUrl;type:varchar(512)" json:"avatarUrl,omitempty"`  // 平台头像
	AccessToken  string     `gorm:"column:accessToken;type:text" json:"-"`
	RefreshToken string     `gorm:"column:refreshToken;type:text" json:"-"`
	ExpiresAt    *time.Time `gorm:"column:expiresAt" json:"-"`
	CreatedAt    *time.Time `gorm:"column:createdAt;default:CURRENT_TIMESTAMP" json:"createdAt"`
	UpdatedAt    *time.Time `gorm:"column:updatedAt" json:"updatedAt"`
}

func (u *UserOAuth) TableName() string {
	return "UserOAuth"
}
