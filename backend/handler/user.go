package handler

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/golang-jwt/jwt/v5"
	"github.com/kingwrcy/moments/db"
	"github.com/kingwrcy/moments/vo"
	"github.com/labstack/echo/v4"
	"github.com/samber/do/v2"
	"golang.org/x/crypto/bcrypt"
)

type UserHandler struct {
	base BaseHandler
}

type loginSuccessDTO struct {
	Token    string `json:"token,omitempty"`    // token
	Username string `json:"username,omitempty"` //用户名
	Id       int32  `json:"id,omitempty"`       //用户ID
}

func NewUserHandler(injector do.Injector) *UserHandler {
	return &UserHandler{do.MustInvoke[BaseHandler](injector)}
}

// Login godoc
//
//	@Tags		User
//	@Summary	用户登录
//	@Accept		json
//	@Produce	json
//	@Param		object	body		vo.LoginReq	true	"用户登录"
//	@Success	200		{object}	loginSuccessDTO
//	@Router		/api/user/login [post]
func (u UserHandler) Login(c echo.Context) error {
	var req vo.LoginReq
	err := c.Bind(&req)
	if err != nil {
		return FailResp(c, ParamError)
	}

	var user db.User
	err = u.base.db.Where("username = ?", req.Username).First(&user).Error
	if err != nil {
		return FailRespWithMsg(c, Fail, "用户不存在或密码不正确")
	}
	if bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)) != nil {
		return FailRespWithMsg(c, Fail, "用户不存在或密码不正确")
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"username": user.Username,
		"userId":   user.Id,
	})

	tokenString, err := token.SignedString([]byte(u.base.cfg.JwtKey))
	if err != nil {
		u.base.log.Error().Msgf("生成jwt token异常:%s", err)
		return FailRespWithMsg(c, Fail, "登录异常")
	}
	return SuccessResp(c, loginSuccessDTO{
		Token:    tokenString,
		Username: user.Username,
		Id:       user.Id,
	})
}

// ProfileForUser godoc
//
//	@Tags		User
//	@Summary	获取指定用户信息
//	@Accept		json
//	@Produce	json
//	@param		string	path		string	true	"用户名"
//	@Success	200		{object}	db.User
//	@Router		/api/user/profile/{username} [post]
func (u UserHandler) ProfileForUser(c echo.Context) error {
	username := c.Param("username")
	var user db.User
	u.base.db.Select("username", "nickname", "slogan", "id", "avatarUrl", "coverUrl", "email").Find(&user, "username = ?", username)
	return SuccessResp(c, user)
}

// Profile godoc
//
//	@Tags			User
//	@Summary		获取用户信息
//	@Description	当前如果已经登录了,获取当前用户信息,否则获取管理员的用户信息
//	@Accept			json
//	@Produce		json
//	@Success		200	{object}	db.User
//	@Router			/user/profile [post]
func (u UserHandler) Profile(c echo.Context) error {

	context := c.(CustomContext)
	currentUser := context.CurrentUser()
	if currentUser == nil {
		u.base.db.Select("username", "nickname", "slogan", "id", "avatarUrl", "coverUrl", "email").First(&currentUser)
	}

	return SuccessResp(c, currentUser)
}

func removeOldUploadFile(uploadDir string, oldUrl string) {
	if oldUrl == "" || !strings.HasPrefix(oldUrl, "/upload/") {
		return
	}
	filename := strings.TrimPrefix(oldUrl, "/upload/")
	filePath := filepath.Join(uploadDir, filename)
	_ = os.Remove(filePath)

	// 删除可能存在的缩略图
	ext := filepath.Ext(filename)
	filenameWithoutExt := strings.TrimSuffix(filename, ext)
	thumbFilePath := filepath.Join(uploadDir, fmt.Sprintf("%s_thumb%s", filenameWithoutExt, ext))
	_ = os.Remove(thumbFilePath)
}

// SaveProfile godoc
//
//	@Tags		User
//	@Summary	保存用户信息
//	@Accept		json
//	@Produce	json
//	@Param		object		body	vo.ProfileReq	true	"保存用户信息"
//	@Param		x-api-token	header	string			true	"登录TOKEN"
//	@Success	200
//	@Router		/api/user/saveProfile [post]
func (u UserHandler) SaveProfile(c echo.Context) error {
	var (
		req  vo.ProfileReq
		user db.User
	)
	err := c.Bind(&req)
	if err != nil {
		return FailResp(c, ParamError)
	}
	context := c.(CustomContext)
	currentUser := context.CurrentUser()
	if currentUser == nil {
		return FailResp(c, TokenMissing)
	}
	u.base.db.Find(&user, currentUser.Id)
	if req.Password != "" {
		password, err := bcrypt.GenerateFromPassword([]byte(req.Password), 10)
		if err != nil {
			return FailResp(c, Fail)
		}
		user.Password = string(password)
	}

	// 当更新头像且与旧头像不同时，自动删除磁盘上的旧文件
	if user.AvatarUrl != req.AvatarUrl && user.AvatarUrl != "" {
		removeOldUploadFile(u.base.cfg.UploadDir, user.AvatarUrl)
	}
	// 当更新封面且与旧封面不同时，自动删除磁盘上的旧文件
	if user.CoverUrl != req.CoverUrl && user.CoverUrl != "" {
		removeOldUploadFile(u.base.cfg.UploadDir, user.CoverUrl)
	}

	user.Nickname = req.Nickname
	user.AvatarUrl = req.AvatarUrl
	user.Slogan = req.Slogan
	user.CoverUrl = req.CoverUrl
	user.Email = req.Email

	if err := u.base.db.Save(&user).Error; err != nil {
		return FailResp(c, Fail)
	}
	return SuccessResp(c, h{})
}
