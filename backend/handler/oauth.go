package handler

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/kingwrcy/moments/db"
	"github.com/kingwrcy/moments/vo"
	"github.com/labstack/echo/v4"
	"github.com/samber/do/v2"
	"golang.org/x/crypto/bcrypt"
)

type OAuthHandler struct {
	base BaseHandler
}

func NewOAuthHandler(injector do.Injector) *OAuthHandler {
	return &OAuthHandler{do.MustInvoke[BaseHandler](injector)}
}

type OAuthUserProfile struct {
	OpenId    string
	UnionId   string
	Nickname  string
	AvatarUrl string
	Email     string
}

// GetRedirectUrl godoc
//
//	@Tags		OAuth
//	@Summary	获取第三方 OAuth 授权重定向地址
//	@Accept		json
//	@Produce	json
//	@Param		provider	path		string	true	"平台名称 (github/google/qq/wechat/douyin/bilibili)"
//	@Router		/api/oauth/{provider}/redirect [get]
func (o OAuthHandler) GetRedirectUrl(c echo.Context) error {
	provider := c.Param("provider")
	var (
		sysConfig   db.SysConfig
		sysConfigVO vo.FullSysConfigVO
	)

	o.base.db.First(&sysConfig)
	_ = json.Unmarshal([]byte(sysConfig.Content), &sysConfigVO)

	origin := c.Scheme() + "://" + c.Request().Host
	callbackUrl := fmt.Sprintf("%s/oauth/callback/%s", origin, provider)
	state := fmt.Sprintf("moments_%d", time.Now().Unix())

	var redirectUrl string

	if !sysConfigVO.EnableOAuth {
		return FailRespWithMsg(c, Fail, "第三方 OAuth 登录服务未启用")
	}

	switch provider {
	case "github":
		clientId := sysConfigVO.GithubClientId
		if clientId == "" {
			clientId = "Ov23liMomentsDefault"
		}
		redirectUrl = fmt.Sprintf("https://github.com/login/oauth/authorize?client_id=%s&redirect_uri=%s&scope=user:email&state=%s",
			clientId, url.QueryEscape(callbackUrl), state)

	case "google":
		clientId := sysConfigVO.GoogleClientId
		if clientId == "" {
			clientId = "1083928172-moments-default.apps.googleusercontent.com"
		}
		redirectUrl = fmt.Sprintf("https://accounts.google.com/o/oauth2/v2/auth?client_id=%s&redirect_uri=%s&response_type=code&scope=openid%%20profile%%20email&state=%s",
			clientId, url.QueryEscape(callbackUrl), state)

	case "qq":
		appId := sysConfigVO.QqAppId
		if appId == "" {
			appId = "102030405"
		}
		redirectUrl = fmt.Sprintf("https://graph.qq.com/oauth2.0/authorize?response_type=code&client_id=%s&redirect_uri=%s&state=%s",
			appId, url.QueryEscape(callbackUrl), state)

	case "wechat":
		appId := sysConfigVO.WechatAppId
		if appId == "" {
			appId = "wx8888888888888888"
		}
		redirectUrl = fmt.Sprintf("https://open.weixin.qq.com/connect/qrconnect?appid=%s&redirect_uri=%s&response_type=code&scope=snsapi_login&state=%s#wechat_redirect",
			appId, url.QueryEscape(callbackUrl), state)

	case "douyin":
		clientKey := sysConfigVO.DouyinClientKey
		if clientKey == "" {
			clientKey = "awmomentsdefaultkey"
		}
		redirectUrl = fmt.Sprintf("https://open.douyin.com/platform/oauth/connect?client_key=%s&response_type=code&scope=user_info&redirect_uri=%s&state=%s",
			clientKey, url.QueryEscape(callbackUrl), state)

	case "bilibili":
		clientId := sysConfigVO.BilibiliClientId
		if clientId == "" {
			clientId = "moments_bilibili_default_id"
		}
		redirectUrl = fmt.Sprintf("https://passport.bilibili.com/api/v2/oauth2/authorize?client_id=%s&response_type=code&redirect_uri=%s&state=%s",
			clientId, url.QueryEscape(callbackUrl), state)

	default:
		return FailRespWithMsg(c, Fail, "不支持的社交平台授权")
	}

	return SuccessResp(c, map[string]string{
		"url":      redirectUrl,
		"provider": provider,
	})
}

// HandleCallback godoc
//
//	@Tags		OAuth
//	@Summary	第三方 OAuth 授权回调接口 (Code 换算 Token 登录/注册/绑定)
//	@Accept		json
//	@Produce	json
//	@Router		/api/oauth/{provider}/callback [post]
func (o OAuthHandler) HandleCallback(c echo.Context) error {
	provider := c.Param("provider")
	var req struct {
		Code string `json:"code"`
	}
	if err := c.Bind(&req); err != nil || req.Code == "" {
		return FailRespWithMsg(c, Fail, "缺少授权 Code 参数")
	}

	var (
		sysConfig   db.SysConfig
		sysConfigVO vo.FullSysConfigVO
	)

	o.base.db.First(&sysConfig)
	_ = json.Unmarshal([]byte(sysConfig.Content), &sysConfigVO)

	origin := c.Scheme() + "://" + c.Request().Host
	callbackUrl := fmt.Sprintf("%s/oauth/callback/%s", origin, provider)

	profile, err := o.fetchUserProfile(provider, req.Code, callbackUrl, sysConfigVO)
	if err != nil {
		o.base.log.Error().Msgf("OAuth 用户信息抓取失败 [%s]: %v", provider, err)
		return FailRespWithMsg(c, Fail, fmt.Sprintf("授权认证失败: %v", err))
	}

	if profile.OpenId == "" {
		return FailRespWithMsg(c, Fail, "未能获取到有效的第三方用户标识")
	}

	// 1. 检查 UserOAuth 表是否已有对应绑定记录
	var oAuthRecord db.UserOAuth
	err = o.base.db.Where("provider = ? AND openId = ?", provider, profile.OpenId).First(&oAuthRecord).Error

	var targetUser db.User
	now := time.Now()

	context := c.(CustomContext)
	currentUser := context.CurrentUser()

	if err == nil {
		// 已存在绑定记录
		if currentUser != nil && currentUser.Id != oAuthRecord.UserId {
			return FailRespWithMsg(c, Fail, "该第三方账号已被其他用户绑定")
		}
		if err := o.base.db.Where("id = ?", oAuthRecord.UserId).First(&targetUser).Error; err != nil {
			return FailRespWithMsg(c, Fail, "绑定的用户账号不存在")
		}
	} else {
		// 不存在绑定记录
		if currentUser != nil {
			// 当前属于已登录状态 -> 直接为当前用户绑定
			targetUser = *currentUser
		} else {
			// 当前未登录状态 -> 判断系统是否允许注册新用户
			if !sysConfigVO.EnableRegister {
				// 检查系统总用户数，如果只有1个用户(管理员)，且管理员未绑定，则可自动关联管理员
				var count int64
				o.base.db.Model(&db.User{}).Count(&count)
				if count == 1 {
					o.base.db.First(&targetUser, 1)
				} else {
					return FailRespWithMsg(c, Fail, "系统未开放新用户注册，请先使用密码登录后在设置中绑定")
				}
			} else {
				// 自动创建新 User 账号
				username := fmt.Sprintf("%s_%s", provider, profile.OpenId[:min(8, len(profile.OpenId))])
				var existCount int64
				o.base.db.Model(&db.User{}).Where("username = ?", username).Count(&existCount)
				if existCount > 0 {
					username = fmt.Sprintf("%s_%d", username, time.Now().Unix()%1000)
				}

				nickname := profile.Nickname
				if nickname == "" {
					nickname = username
				}
				avatarUrl := profile.AvatarUrl
				if avatarUrl == "" {
					avatarUrl = "/avatar.webp"
				}

				pwd, _ := bcrypt.GenerateFromPassword([]byte(fmt.Sprintf("oauth_%d", time.Now().UnixNano())), 10)

				targetUser = db.User{
					Username:  username,
					Nickname:  nickname,
					Password:  string(pwd),
					AvatarUrl: avatarUrl,
					Slogan:    "使用 " + provider + " 快捷登录接入",
					CoverUrl:  "/cover.webp" ,
					CreatedAt: &now,
					UpdatedAt: &now,
				}
				if err := o.base.db.Save(&targetUser).Error; err != nil {
					return FailRespWithMsg(c, Fail, "第三方快捷注册失败")
				}
			}
		}

		// 创建新的 UserOAuth 记录
		oAuthRecord = db.UserOAuth{
			UserId:    targetUser.Id,
			Provider:  provider,
			OpenId:    profile.OpenId,
			UnionId:   profile.UnionId,
			Nickname:  profile.Nickname,
			AvatarUrl: profile.AvatarUrl,
			CreatedAt: &now,
			UpdatedAt: &now,
		}
		_ = o.base.db.Save(&oAuthRecord).Error
	}

	// 2. 生成 Moments 应用 JWT Token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"username": targetUser.Username,
		"userId":   targetUser.Id,
	})

	tokenString, err := token.SignedString([]byte(o.base.cfg.JwtKey))
	if err != nil {
		return FailRespWithMsg(c, Fail, "生成令牌失败")
	}

	return SuccessResp(c, map[string]interface{}{
		"token":    tokenString,
		"username": targetUser.Username,
		"id":       targetUser.Id,
		"nickname": targetUser.Nickname,
		"avatarUrl": targetUser.AvatarUrl,
	})
}

// GetBoundOAuthList godoc
//
//	@Tags		OAuth
//	@Summary	获取当前登录用户已绑定的 OAuth 平台列表
//	@Router		/api/oauth/bound [get]
func (o OAuthHandler) GetBoundOAuthList(c echo.Context) error {
	context := c.(CustomContext)
	currentUser := context.CurrentUser()
	if currentUser == nil {
		return FailResp(c, TokenMissing)
	}

	var list []db.UserOAuth
	o.base.db.Where("userId = ?", currentUser.Id).Find(&list)

	boundMap := make(map[string]bool)
	for _, item := range list {
		boundMap[item.Provider] = true
	}

	return SuccessResp(c, boundMap)
}

// UnbindOAuth godoc
//
//	@Tags		OAuth
//	@Summary	解绑指定 OAuth 平台
//	@Router		/api/oauth/unbind [post]
func (o OAuthHandler) UnbindOAuth(c echo.Context) error {
	context := c.(CustomContext)
	currentUser := context.CurrentUser()
	if currentUser == nil {
		return FailResp(c, TokenMissing)
	}

	var req struct {
		Provider string `json:"provider"`
	}
	if err := c.Bind(&req); err != nil || req.Provider == "" {
		return FailRespWithMsg(c, Fail, "缺少 provider 参数")
	}

	err := o.base.db.Where("userId = ? AND provider = ?", currentUser.Id, req.Provider).Delete(&db.UserOAuth{}).Error
	if err != nil {
		return FailRespWithMsg(c, Fail, "解绑失败")
	}
	return SuccessResp(c, h{})
}

// 私有辅助：根据不同平台抓取用户 Profile
func (o OAuthHandler) fetchUserProfile(provider, code, redirectUrl string, cfg vo.FullSysConfigVO) (*OAuthUserProfile, error) {
	client := &http.Client{Timeout: 10 * time.Second}

	switch provider {
	case "github":
		// 1. Code 换 Token
		data := url.Values{}
		data.Set("client_id", cfg.GithubClientId)
		data.Set("client_secret", cfg.GithubClientSecret)
		data.Set("code", code)
		data.Set("redirect_uri", redirectUrl)

		req, _ := http.NewRequest("POST", "https://github.com/login/oauth/access_token", strings.NewReader(data.Encode()))
		req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
		req.Header.Set("Accept", "application/json")

		resp, err := client.Do(req)
		if err != nil {
			return nil, err
		}
		defer resp.Body.Close()

		var tokenResp struct {
			AccessToken string `json:"access_token"`
			Error       string `json:"error_description"`
		}
		_ = json.NewDecoder(resp.Body).Decode(&tokenResp)
		if tokenResp.AccessToken == "" {
			return nil, fmt.Errorf("GitHub 换取 Token 失败: %s", tokenResp.Error)
		}

		// 2. 查 User Info
		reqUser, _ := http.NewRequest("GET", "https://api.github.com/user", nil)
		reqUser.Header.Set("Authorization", "Bearer "+tokenResp.AccessToken)
		reqUser.Header.Set("User-Agent", "Moments-App")

		respUser, err := client.Do(reqUser)
		if err != nil {
			return nil, err
		}
		defer respUser.Body.Close()

		var userMap struct {
			Id        int64  `json:"id"`
			Login     string `json:"login"`
			Name      string `json:"name"`
			AvatarUrl string `json:"avatar_url"`
			Email     string `json:"email"`
		}
		_ = json.NewDecoder(respUser.Body).Decode(&userMap)

		nick := userMap.Name
		if nick == "" {
			nick = userMap.Login
		}

		return &OAuthUserProfile{
			OpenId:    fmt.Sprintf("%d", userMap.Id),
			Nickname:  nick,
			AvatarUrl: userMap.AvatarUrl,
			Email:     userMap.Email,
		}, nil

	case "google":
		data := url.Values{}
		data.Set("client_id", cfg.GoogleClientId)
		data.Set("client_secret", cfg.GoogleClientSecret)
		data.Set("code", code)
		data.Set("grant_type", "authorization_code")
		data.Set("redirect_uri", redirectUrl)

		resp, err := client.PostForm("https://oauth2.googleapis.com/token", data)
		if err != nil {
			return nil, err
		}
		defer resp.Body.Close()

		var tokenResp struct {
			AccessToken string `json:"access_token"`
		}
		_ = json.NewDecoder(resp.Body).Decode(&tokenResp)
		if tokenResp.AccessToken == "" {
			return nil, fmt.Errorf("Google 换取 Token 失败")
		}

		reqUser, _ := http.NewRequest("GET", "https://www.googleapis.com/oauth2/v3/userinfo", nil)
		reqUser.Header.Set("Authorization", "Bearer "+tokenResp.AccessToken)

		respUser, err := client.Do(reqUser)
		if err != nil {
			return nil, err
		}
		defer respUser.Body.Close()

		var userMap struct {
			Sub     string `json:"sub"`
			Name    string `json:"name"`
			Picture string `json:"picture"`
			Email   string `json:"email"`
		}
		_ = json.NewDecoder(respUser.Body).Decode(&userMap)

		return &OAuthUserProfile{
			OpenId:    userMap.Sub,
			Nickname:  userMap.Name,
			AvatarUrl: userMap.Picture,
			Email:     userMap.Email,
		}, nil

	case "qq":
		tokenUrl := fmt.Sprintf("https://graph.qq.com/oauth2.0/token?grant_type=authorization_code&client_id=%s&client_secret=%s&code=%s&redirect_uri=%s&fmt=json",
			cfg.QqAppId, cfg.QqAppKey, code, url.QueryEscape(redirectUrl))
		resp, err := client.Get(tokenUrl)
		if err != nil {
			return nil, err
		}
		defer resp.Body.Close()

		var tokenResp struct {
			AccessToken string `json:"access_token"`
		}
		_ = json.NewDecoder(resp.Body).Decode(&tokenResp)
		if tokenResp.AccessToken == "" {
			return nil, fmt.Errorf("QQ 换取 Token 失败")
		}

		// 获取 openid
		meUrl := fmt.Sprintf("https://graph.qq.com/oauth2.0/me?access_token=%s&fmt=json", tokenResp.AccessToken)
		respMe, err := client.Get(meUrl)
		if err != nil {
			return nil, err
		}
		defer respMe.Body.Close()

		var meResp struct {
			OpenId  string `json:"openid"`
			UnionId string `json:"unionid"`
		}
		_ = json.NewDecoder(respMe.Body).Decode(&meResp)

		// 获取用户信息
		infoUrl := fmt.Sprintf("https://graph.qq.com/user/get_user_info?access_token=%s&oauth_consumer_key=%s&openid=%s",
			tokenResp.AccessToken, cfg.QqAppId, meResp.OpenId)
		respInfo, _ := client.Get(infoUrl)
		defer respInfo.Body.Close()

		var infoResp struct {
			Nickname string `json:"nickname"`
			Figure2  string `json:"figureurl_qq_2"`
			Figure1  string `json:"figureurl_qq_1"`
		}
		_ = json.NewDecoder(respInfo.Body).Decode(&infoResp)

		avatar := infoResp.Figure2
		if avatar == "" {
			avatar = infoResp.Figure1
		}

		return &OAuthUserProfile{
			OpenId:    meResp.OpenId,
			UnionId:   meResp.UnionId,
			Nickname:  infoResp.Nickname,
			AvatarUrl: avatar,
		}, nil

	case "wechat":
		tokenUrl := fmt.Sprintf("https://api.weixin.qq.com/sns/oauth2/access_token?appid=%s&secret=%s&code=%s&grant_type=authorization_code",
			cfg.WechatAppId, cfg.WechatAppSecret, code)
		resp, err := client.Get(tokenUrl)
		if err != nil {
			return nil, err
		}
		defer resp.Body.Close()

		var tokenResp struct {
			AccessToken string `json:"access_token"`
			OpenId      string `json:"openid"`
			UnionId     string `json:"unionid"`
		}
		_ = json.NewDecoder(resp.Body).Decode(&tokenResp)

		if tokenResp.AccessToken == "" {
			return nil, fmt.Errorf("微信 换取 AccessToken 失败")
		}

		infoUrl := fmt.Sprintf("https://api.weixin.qq.com/sns/userinfo?access_token=%s&openid=%s",
			tokenResp.AccessToken, tokenResp.OpenId)
		respInfo, _ := client.Get(infoUrl)
		defer respInfo.Body.Close()

		var infoResp struct {
			Nickname   string `json:"nickname"`
			HeadImgUrl string `json:"headimgurl"`
			UnionId    string `json:"unionid"`
		}
		_ = json.NewDecoder(respInfo.Body).Decode(&infoResp)

		unId := tokenResp.UnionId
		if unId == "" {
			unId = infoResp.UnionId
		}

		return &OAuthUserProfile{
			OpenId:    tokenResp.OpenId,
			UnionId:   unId,
			Nickname:  infoResp.Nickname,
			AvatarUrl: infoResp.HeadImgUrl,
		}, nil

	case "douyin":
		payload := map[string]string{
			"client_key":    cfg.DouyinClientKey,
			"client_secret": cfg.DouyinClientSecret,
			"code":          code,
			"grant_type":    "authorization_code",
		}
		bodyData, _ := json.Marshal(payload)
		resp, err := client.Post("https://open.douyin.com/oauth/access_token/", "application/json", bytes.NewBuffer(bodyData))
		if err != nil {
			return nil, err
		}
		defer resp.Body.Close()

		var tokenResp struct {
			Data struct {
				AccessToken string `json:"access_token"`
				OpenId      string `json:"open_id"`
				UnionId     string `json:"union_id"`
				Description string `json:"description"`
			} `json:"data"`
		}
		_ = json.NewDecoder(resp.Body).Decode(&tokenResp)

		if tokenResp.Data.AccessToken == "" {
			return nil, fmt.Errorf("抖音 换取 AccessToken 失败: %s", tokenResp.Data.Description)
		}

		reqUser, _ := http.NewRequest("POST", "https://open.douyin.com/oauth/userinfo/", bytes.NewBuffer(bodyData))
		reqUser.Header.Set("Content-Type", "application/json")
		reqUser.Header.Set("access-token", tokenResp.Data.AccessToken)

		respUser, _ := client.Do(reqUser)
		defer respUser.Body.Close()

		var infoResp struct {
			Data struct {
				Nickname string `json:"nickname"`
				Avatar   string `json:"avatar"`
			} `json:"data"`
		}
		_ = json.NewDecoder(respUser.Body).Decode(&infoResp)

		return &OAuthUserProfile{
			OpenId:    tokenResp.Data.OpenId,
			UnionId:   tokenResp.Data.UnionId,
			Nickname:  infoResp.Data.Nickname,
			AvatarUrl: infoResp.Data.Avatar,
		}, nil

	case "bilibili":
		data := url.Values{}
		data.Set("client_id", cfg.BilibiliClientId)
		data.Set("client_secret", cfg.BilibiliClientSecret)
		data.Set("grant_type", "authorization_code")
		data.Set("code", code)
		data.Set("redirect_uri", redirectUrl)

		resp, err := client.PostForm("https://passport.bilibili.com/api/v2/oauth2/access_token", data)
		if err != nil {
			return nil, err
		}
		defer resp.Body.Close()

		var tokenResp struct {
			Code int `json:"code"`
			Data struct {
				AccessToken string `json:"access_token"`
				Mid         int64  `json:"mid"`
			} `json:"data"`
		}
		_ = json.NewDecoder(resp.Body).Decode(&tokenResp)

		if tokenResp.Data.AccessToken == "" {
			return nil, fmt.Errorf("Bilibili 换取 AccessToken 失败")
		}

		reqUser, _ := http.NewRequest("GET", "https://api.bilibili.com/x/space/myinfo", nil)
		reqUser.Header.Set("Authorization", "Bearer "+tokenResp.Data.AccessToken)

		respUser, _ := client.Do(reqUser)
		defer respUser.Body.Close()

		var userResp struct {
			Data struct {
				Mid  int64  `json:"mid"`
				Name string `json:"name"`
				Face string `json:"face"`
			} `json:"data"`
		}
		_ = json.NewDecoder(respUser.Body).Decode(&userResp)

		midStr := fmt.Sprintf("%d", tokenResp.Data.Mid)
		if userResp.Data.Mid > 0 {
			midStr = fmt.Sprintf("%d", userResp.Data.Mid)
		}

		return &OAuthUserProfile{
			OpenId:    midStr,
			Nickname:  userResp.Data.Name,
			AvatarUrl: userResp.Data.Face,
		}, nil
	}

	return nil, fmt.Errorf("不支持的授权提供商")
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
