package middleware

import (
	"strings"

	"github.com/golang-jwt/jwt/v5"
	model "github.com/kingwrcy/moments/db"
	"github.com/kingwrcy/moments/handler"
	"github.com/kingwrcy/moments/vo"
	"github.com/labstack/echo/v4"
	"github.com/samber/do/v2"
	"gorm.io/gorm"
)

func Auth(injector do.Injector) echo.MiddlewareFunc {
	cfg := do.MustInvoke[*vo.AppConfig](injector)
	db := do.MustInvoke[*gorm.DB](injector)
	//zlog := do.MustInvoke[zerolog.Logger](injector)
	ignores := []string{
		"/api/user/login",
		"/api/memo/list",
		"/api/user/profile",
		"/api/sysConfig/get",
		"/api/memo/like",
		"/api/comment/add",
		"/api/memo/get",
	}

	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			if !strings.HasPrefix(c.Request().URL.Path, "/api") {
				return next(c)
			}
			path := c.Request().URL.Path
			isIgnored := false
			for _, url := range ignores {
				if path == url {
					isIgnored = true
					break
				}
			}
			if !isIgnored && (strings.HasPrefix(path, "/upload") || strings.HasPrefix(path, "/api/user/profile/")) {
				isIgnored = true
			}

			tokenStr := c.Request().Header.Get("x-api-token")
			cc := handler.CustomContext{Context: c}

			if tokenStr != "" {
				token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (any, error) {
					return []byte(cfg.JwtKey), nil
				})

				if err == nil && token.Valid {
					claims := token.Claims.(jwt.MapClaims)
					var user model.User
					db.Select("username", "nickname", "slogan", "id", "avatarUrl", "coverUrl", "email").First(&user, claims["userId"])
					cc.SetUser(&user)
					return next(cc)
				}

				if isIgnored {
					return next(cc)
				}
				return handler.FailResp(c, handler.TokenInvalid)
			}

			if isIgnored {
				return next(cc)
			}
			return handler.FailResp(c, handler.TokenMissing)
		}
	}
}
