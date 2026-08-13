package handler

import (
	"encoding/json"
	"errors"
	"io"
	"os"
	"path/filepath"
	"strings"

	"github.com/kingwrcy/moments/db"
	"github.com/kingwrcy/moments/vo"
	"github.com/labstack/echo/v4"
	"github.com/samber/do/v2"
	"gorm.io/gorm"
)

type SysConfigHandler struct {
	base BaseHandler
}

func NewSysConfigHandler(injector do.Injector) *SysConfigHandler {
	return &SysConfigHandler{do.MustInvoke[BaseHandler](injector)}
}

// GetConfig godoc
//
//	@Tags			SysConfig
//	@Summary		获取系统设置(部分不敏感的)
//	@Description	敏感信息不返回,包括各种key密钥
//	@Accept			json
//	@Produce		json
//	@Success		200	{object}	vo.SysConfigVO
//	@Router			/sysConfig/get [post]
func (s SysConfigHandler) GetConfig(c echo.Context) error {
	var (
		config db.SysConfig
		result vo.SysConfigVO
	)

	if err := s.base.db.First(&config).Error; errors.Is(err, gorm.ErrRecordNotFound) {
		return SuccessResp(c, h{})
	}
	err := json.Unmarshal([]byte(config.Content), &result)
	if err != nil {
		return FailRespWithMsg(c, Fail, "读取系统配置异常")
	}
	result.Version = s.base.cfg.Version
	result.CommitId = s.base.cfg.CommitId

	suffix := result.S3.ThumbnailSuffix
	result.S3 = vo.S3VO{
		ThumbnailSuffix: suffix,
	}
	return SuccessResp(c, result)
}

// GetFullConfig godoc
//
//	@Tags		SysConfig
//	@Summary	获取系统设置(完整的)
//	@Accept		json
//	@Produce	json
//	@Param		x-api-token	header		string	true	"登录TOKEN"
//	@Success	200			{object}	vo.FullSysConfigVO
//	@Success	200
//	@Router		/api/sysConfig/get [post]
func (s SysConfigHandler) GetFullConfig(c echo.Context) error {
	var (
		config db.SysConfig
		result vo.FullSysConfigVO
	)

	context := c.(CustomContext)
	currentUser := context.CurrentUser()
	if currentUser == nil || currentUser.Id != 1 {
		return FailRespWithMsg(c, Fail, "需要先登录")
	}
	if err := s.base.db.First(&config).Error; errors.Is(err, gorm.ErrRecordNotFound) {
		return SuccessResp(c, h{})
	}
	err := json.Unmarshal([]byte(config.Content), &result)
	if err != nil {
		return FailRespWithMsg(c, Fail, "读取系统配置异常")
	}
	result.Version = s.base.cfg.Version
	result.CommitId = s.base.cfg.CommitId
	return SuccessResp(c, result)
}

// SaveConfig godoc
//
//	@Tags		SysConfig
//	@Summary	保存系统设置
//	@Accept		json
//	@Produce	json
//	@Param		object		body	vo.FullSysConfigVO	true	"保存系统设置"
//	@Param		x-api-token	header	string				true	"登录TOKEN"
//	@Success	200
//	@Router		/api/sysConfig/save [post]
func (s SysConfigHandler) SaveConfig(c echo.Context) error {
	var (
		config db.SysConfig
		result vo.FullSysConfigVO
	)
	context := c.(CustomContext)
	currentUser := context.CurrentUser()
	if currentUser == nil || currentUser.Id != 1 {
		return FailRespWithMsg(c, Fail, "需要先登录")
	}

	if err := c.Bind(&result); err != nil {
		s.base.log.Info().Msgf("保存配置错误,%s", err)
		return FailResp(c, ParamError)
	}

	data, err := json.Marshal(result)
	if err != nil {
		return FailRespWithMsg(c, Fail, "读取系统配置异常")
	}

	if err := s.base.db.First(&config).Error; errors.Is(err, gorm.ErrRecordNotFound) {
		config.Content = string(data)
		if err = s.base.db.Save(&config).Error; err != nil {
			return FailRespWithMsg(c, Fail, "保存系统配置异常")
		}
	} else {
		// 自动清理被替换的旧 Favicon 文件
		var oldConfigVo vo.FullSysConfigVO
		if config.Content != "" {
			if err := json.Unmarshal([]byte(config.Content), &oldConfigVo); err == nil {
				if oldConfigVo.Favicon != "" && oldConfigVo.Favicon != result.Favicon && strings.HasPrefix(oldConfigVo.Favicon, "/upload/") {
					filename := strings.TrimPrefix(oldConfigVo.Favicon, "/upload/")
					_ = os.Remove(filepath.Join(s.base.cfg.UploadDir, filename))
				}
			}
		}
		config.Content = string(data)
		if err = s.base.db.Updates(&config).Error; err != nil {
			return FailRespWithMsg(c, Fail, "保存系统配置异常")
		}
	}
	if result.AdminUserName != "" {
		s.base.db.Table("User").Where("id=?", 1).Update("username", result.AdminUserName)
	} else {
		s.base.db.Table("User").Where("id=? AND (username IS NULL OR username = '')", 1).Update("username", "admin")
	}

	// 将上传的 Favicon 物理文件尝试覆盖物理目录
	if result.Favicon != "" && strings.HasPrefix(result.Favicon, "/upload/") {
		filename := strings.TrimPrefix(result.Favicon, "/upload/")
		srcPath := filepath.Join(s.base.cfg.UploadDir, filename)
		if _, err := os.Stat(srcPath); err == nil {
			_ = copyFileHelper(srcPath, filepath.Join("public", "favicon.png"))
			_ = copyFileHelper(srcPath, filepath.Join("public", "favicon.ico"))
		}
	}

	return SuccessResp(c, h{})
}

// ServeFavicon 拦截并响应全站图标请求
func (s SysConfigHandler) ServeFavicon(c echo.Context) error {
	var (
		config db.SysConfig
		result vo.SysConfigVO
	)
	if err := s.base.db.First(&config).Error; err == nil && config.Content != "" {
		if err := json.Unmarshal([]byte(config.Content), &result); err == nil && result.Favicon != "" {
			faviconUrl := result.Favicon
			if strings.HasPrefix(faviconUrl, "/upload/") {
				filename := strings.TrimPrefix(faviconUrl, "/upload/")
				filePath := filepath.Join(s.base.cfg.UploadDir, filename)
				if _, err := os.Stat(filePath); err == nil {
					return c.File(filePath)
				}
			} else if strings.HasPrefix(faviconUrl, "http://") || strings.HasPrefix(faviconUrl, "https://") {
				return c.Redirect(302, faviconUrl)
			}
		}
	}
	return c.NoContent(404)
}

func copyFileHelper(src, dst string) error {
	in, err := os.Open(src)
	if err != nil {
		return err
	}
	defer in.Close()
	_ = os.MkdirAll(filepath.Dir(dst), 0755)
	out, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer out.Close()
	_, err = io.Copy(out, in)
	return err
}
