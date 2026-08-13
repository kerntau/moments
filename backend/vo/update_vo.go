package vo

// UpdateCheckResult 检查更新结果
type UpdateCheckResult struct {
	HasUpdate     bool     `json:"hasUpdate"`               // 是否有新版本
	CurrentCommit string   `json:"currentCommit,omitempty"` // 当前 commit hash
	LatestCommit  string   `json:"latestCommit,omitempty"`  // 远程最新 commit hash
	CurrentBranch string   `json:"currentBranch,omitempty"` // 当前分支名
	Logs          []string `json:"logs,omitempty"`          // 待更新的 commit 日志列表
}

// UpdateStatus 更新执行状态
type UpdateStatus struct {
	Stage   string   `json:"stage"`             // 当前阶段: idle/pulling/building_frontend/building_backend/replacing/done/failed
	Message string   `json:"message,omitempty"` // 状态描述
	Logs    []string `json:"logs,omitempty"`    // 执行日志
}

// UpdateConfig 更新配置
type UpdateConfig struct {
	RepoUrl string `json:"repoUrl,omitempty"` // 远程仓库地址（留空使用 git remote 默认值）
	Branch  string `json:"branch,omitempty"`  // 分支名（留空使用当前分支）
}
