package vo

type S3VO struct {
	Domain          string `json:"domain,omitempty"`          //S3 域名
	Bucket          string `json:"bucket,omitempty"`          //桶名称
	Region          string `json:"region,omitempty"`          //地区
	AccessKey       string `json:"accessKey,omitempty"`       //AK
	SecretKey       string `json:"secretKey,omitempty"`       //SK
	Endpoint        string `json:"endpoint,omitempty"`        //S3接口地址
	ThumbnailSuffix string `json:"thumbnailSuffix,omitempty"` //图片后缀
}

type SysConfigVO struct {
	EnableS3               bool   `json:"enableS3"`                   //是否启用S3
	EnableAutoLoadNextPage bool   `json:"enableAutoLoadNextPage"`     //是否启用自动加载下一页
	Favicon                string `json:"favicon,omitempty"`          //favicon
	Title                  string `json:"title,omitempty"`            //标题
	BeiAnNo                string `json:"beiAnNo,omitempty"`          //备案号码
	Css                    string `json:"css,omitempty"`              //自定义css
	Js                     string `json:"js,omitempty"`               //自定义js
	Rss                    string `json:"rss,omitempty"`              //自定义rss
	EnableGoogleRecaptcha  bool   `json:"enableGoogleRecaptcha"`      //是否启用google recaptcha
	GoogleSiteKey          string `json:"googleSiteKey,omitempty"`    //google recaptcha siteKey
	EnableComment          bool   `json:"enableComment"`              //是否启用评论
	MaxCommentLength       int    `json:"maxCommentLength,omitempty"` //发言最大长度
	MemoMaxHeight          int    `json:"memoMaxHeight,omitempty"`    //单个memo的最大高度,单位px
	CommentOrder           string `json:"commentOrder,omitempty"`     //评论展示的顺序,asc:顺序,desc:逆序
	TimeFormat             string `json:"timeFormat,omitempty"`       //时间格式
	EnableRegister         bool   `json:"enableRegister"`             //是否开启注册用户
	EnableAmap             bool   `json:"enableAmap"`                 //是否启用高德地图
	AmapKey                string `json:"amapKey,omitempty"`          //高德地图Key
	AmapSecurityJsCode     string `json:"amapSecurityJsCode,omitempty"`//高德地图安全密钥
	AmapStyle              string `json:"amapStyle,omitempty"`         //高德地图样式主题
	EnableOAuth            bool   `json:"enableOAuth"`               //是否启用第三方OAuth登录
	EnableGithubOAuth      bool   `json:"enableGithubOAuth"`          //是否启用GitHub登录
	EnableGoogleOAuth      bool   `json:"enableGoogleOAuth"`          //是否启用Google登录
	EnableQqOAuth          bool   `json:"enableQqOAuth"`              //是否启用QQ登录
	EnableWechatOAuth      bool   `json:"enableWechatOAuth"`          //是否启用微信登录
	EnableDouyinOAuth      bool   `json:"enableDouyinOAuth"`          //是否启用抖音登录
	EnableBilibiliOAuth    bool   `json:"enableBilibiliOAuth"`        //是否启用Bilibili登录
	OAuthServerUrl         string `json:"oauthServerUrl,omitempty"`   //自定义 OAuth 回调基准域名
	Version                string `json:"version,omitempty"`
	CommitId               string `json:"commitId,omitempty"`
	S3                     S3VO   `json:"s3"` //S3相关信息
}

type FullSysConfigVO struct {
	AdminUserName          string `json:"adminUserName,omitempty"`    //管理员名称
	EnableS3               bool   `json:"enableS3"`                   //是否启用S3
	EnableAutoLoadNextPage bool   `json:"enableAutoLoadNextPage"`     //是否启用自动加载下一页
	Favicon                string `json:"favicon,omitempty"`          //favicon
	Title                  string `json:"title,omitempty"`            //标题
	BeiAnNo                string `json:"beiAnNo,omitempty"`          //备案号码
	Css                    string `json:"css,omitempty"`              //自定义css
	Js                     string `json:"js,omitempty"`               //自定义js
	Rss                    string `json:"rss,omitempty"`              //自定义rss
	S3                     S3VO   `json:"s3"`                         //S3相关信息
	EnableGoogleRecaptcha  bool   `json:"enableGoogleRecaptcha"`      //是否启用google recaptcha
	GoogleSiteKey          string `json:"googleSiteKey,omitempty"`    //google recaptcha siteKey
	GoogleSecretKey        string `json:"googleSecretKey,omitempty"`  //google recaptcha secretKey
	EnableAmap             bool   `json:"enableAmap"`                 //是否启用高德地图
	AmapKey                string `json:"amapKey,omitempty"`          //高德地图Key
	AmapSecurityJsCode     string `json:"amapSecurityJsCode,omitempty"`//高德地图安全密钥
	AmapStyle              string `json:"amapStyle,omitempty"`         //高德地图样式主题
	EnableComment          bool   `json:"enableComment"`              //是否启用评论
	MaxCommentLength       int    `json:"maxCommentLength,omitempty"` //发言最大长度
	MemoMaxHeight          int    `json:"memoMaxHeight,omitempty"`    //单个memo的最大高度,单位px
	CommentOrder           string `json:"commentOrder,omitempty"`     //评论展示的顺序,asc:顺序,desc:逆序
	TimeFormat             string `json:"timeFormat,omitempty"`       //时间格式
	EnableRegister         bool   `json:"enableRegister"`             //是否开启注册用户
	EnableEmail            bool   `json:"enableEmail,omitempty"`      //是否启用邮箱
	SmtpHost               string `json:"smtpHost,omitempty"`         //smtp host
	SmtpPort               string `json:"smtpPort,omitempty"`         //smtp port
	SmtpUsername           string `json:"smtpUsername,omitempty"`     //smtp username
	SmtpPassword           string `json:"smtpPassword,omitempty"`     //smtp password
	// 第三方 OAuth 配置
	EnableOAuth            bool   `json:"enableOAuth"`
	OAuthServerUrl         string `json:"oauthServerUrl,omitempty"`   //自定义 OAuth 回调基准域名
	EnableGithubOAuth      bool   `json:"enableGithubOAuth"`
	GithubClientId         string `json:"githubClientId,omitempty"`
	GithubClientSecret     string `json:"githubClientSecret,omitempty"`
	EnableGoogleOAuth      bool   `json:"enableGoogleOAuth"`
	GoogleClientId         string `json:"googleClientId,omitempty"`
	GoogleClientSecret     string `json:"googleClientSecret,omitempty"`
	EnableQqOAuth          bool   `json:"enableQqOAuth"`
	QqAppId                string `json:"qqAppId,omitempty"`
	QqAppKey               string `json:"qqAppKey,omitempty"`
	EnableWechatOAuth      bool   `json:"enableWechatOAuth"`
	WechatAppId            string `json:"wechatAppId,omitempty"`
	WechatAppSecret        string `json:"wechatAppSecret,omitempty"`
	EnableDouyinOAuth      bool   `json:"enableDouyinOAuth"`
	DouyinClientKey        string `json:"douyinClientKey,omitempty"`
	DouyinClientSecret     string `json:"douyinClientSecret,omitempty"`
	EnableBilibiliOAuth    bool   `json:"enableBilibiliOAuth"`
	BilibiliClientId       string `json:"bilibiliClientId,omitempty"`
	BilibiliClientSecret   string `json:"bilibiliClientSecret,omitempty"`
	Version                string `json:"version,omitempty"`
	CommitId               string `json:"commitId,omitempty"`
}
