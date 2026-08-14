package handler

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"sync"

	"github.com/kingwrcy/moments/vo"
	"github.com/labstack/echo/v4"
	"github.com/samber/do/v2"
)

type UpdateHandler struct {
	base BaseHandler

	mu     sync.Mutex
	status vo.UpdateStatus
}

func NewUpdateHandler(injector do.Injector) *UpdateHandler {
	return &UpdateHandler{
		base: do.MustInvoke[BaseHandler](injector),
		status: vo.UpdateStatus{
			Stage: "idle",
		},
	}
}

// getProjectRoot 获取项目根目录（后端目录的上级目录）
func (u *UpdateHandler) getProjectRoot() (string, error) {
	execPath, err := os.Executable()
	if err != nil {
		return "", fmt.Errorf("获取可执行文件路径失败: %w", err)
	}
	backendDir := filepath.Dir(execPath)

	// 检查当前工作目录是否在 git 仓库中
	cwd, err := os.Getwd()
	if err != nil {
		return "", fmt.Errorf("获取工作目录失败: %w", err)
	}

	// 优先使用 git rev-parse 获取仓库根目录
	cmd := exec.Command("git", "rev-parse", "--show-toplevel")
	cmd.Dir = cwd
	out, err := cmd.Output()
	if err == nil {
		return strings.TrimSpace(string(out)), nil
	}

	// 回退：尝试从 backendDir 的上级目录查找
	parentDir := filepath.Dir(backendDir)
	cmd = exec.Command("git", "rev-parse", "--show-toplevel")
	cmd.Dir = parentDir
	out, err = cmd.Output()
	if err == nil {
		return strings.TrimSpace(string(out)), nil
	}

	return "", fmt.Errorf("未找到 Git 仓库根目录")
}

// getCurrentBranch 获取当前分支名
func (u *UpdateHandler) getCurrentBranch(projectRoot string) (string, error) {
	cmd := exec.Command("git", "rev-parse", "--abbrev-ref", "HEAD")
	cmd.Dir = projectRoot
	out, err := cmd.Output()
	if err != nil {
		return "", fmt.Errorf("获取当前分支失败: %w", err)
	}
	return strings.TrimSpace(string(out)), nil
}

// getRemoteUrl 获取远程仓库地址
func (u *UpdateHandler) getRemoteUrl(projectRoot string) (string, error) {
	cmd := exec.Command("git", "remote", "get-url", "origin")
	cmd.Dir = projectRoot
	out, err := cmd.Output()
	if err != nil {
		return "", fmt.Errorf("获取远程仓库地址失败: %w", err)
	}
	return strings.TrimSpace(string(out)), nil
}

// findExecutable 智能查找系统二进制文件路径，解决服务器 PATH 环境变量不全导致的命令缺失问题
func findExecutable(name string) string {
	if path, err := exec.LookPath(name); err == nil && path != "" {
		return path
	}
	var candidates []string
	switch name {
	case "go":
		candidates = []string{
			"/usr/local/go/bin/go",
			"/usr/bin/go",
			"/usr/local/bin/go",
		}
		if goroot := os.Getenv("GOROOT"); goroot != "" {
			candidates = append(candidates, filepath.Join(goroot, "bin", "go"))
		}
		if home, err := os.UserHomeDir(); err == nil && home != "" {
			candidates = append(candidates, filepath.Join(home, "go", "bin", "go"))
		}
	case "pnpm":
		candidates = []string{
			"/usr/local/bin/pnpm",
			"/usr/bin/pnpm",
		}
		if home, err := os.UserHomeDir(); err == nil && home != "" {
			candidates = append(candidates, filepath.Join(home, ".local/share/pnpm/pnpm"), filepath.Join(home, ".nvm/versions/node", "bin", "pnpm"))
		}
	case "git":
		candidates = []string{
			"/usr/bin/git",
			"/usr/local/bin/git",
		}
	}
	for _, c := range candidates {
		if _, err := os.Stat(c); err == nil {
			return c
		}
	}
	return name
}

// runCommand 执行命令并收集输出
func (u *UpdateHandler) runCommand(dir string, name string, args ...string) (string, error) {
	binPath := findExecutable(name)
	cmd := exec.Command(binPath, args...)
	cmd.Dir = dir

	// 设置 Go 编译与模块缓存路径，防止 systemd 安全模式下写入 /root/.cache 报错
	env := os.Environ()
	gocachePath := filepath.Join(dir, ".gocache")
	gomodcachePath := filepath.Join(dir, ".gomodcache")
	env = append(env, "GOCACHE="+gocachePath, "GOMODCACHE="+gomodcachePath)
	cmd.Env = env

	out, err := cmd.CombinedOutput()
	output := strings.TrimSpace(string(out))
	if err != nil {
		return output, fmt.Errorf("执行命令 [%s %s] 失败: %s, 输出: %s", name, strings.Join(args, " "), err, output)
	}
	return output, nil
}

// appendLog 追加执行日志
func (u *UpdateHandler) appendLog(msg string) {
	u.base.log.Info().Msgf("[系统更新] %s", msg)
	u.status.Logs = append(u.status.Logs, msg)
}

// setStage 设置更新阶段
func (u *UpdateHandler) setStage(stage string, message string) {
	u.status.Stage = stage
	u.status.Message = message
	u.appendLog(fmt.Sprintf("[%s] %s", stage, message))
}

// CheckUpdate 检查是否有可用更新
func (u *UpdateHandler) CheckUpdate(c echo.Context) error {
	context := c.(CustomContext)
	currentUser := context.CurrentUser()
	if currentUser == nil || currentUser.Id != 1 {
		return FailRespWithMsg(c, Fail, "仅管理员可执行此操作")
	}

	projectRoot, err := u.getProjectRoot()
	if err != nil {
		return FailRespWithMsg(c, Fail, err.Error())
	}

	branch, err := u.getCurrentBranch(projectRoot)
	if err != nil {
		return FailRespWithMsg(c, Fail, err.Error())
	}

	// fetch 远程最新信息
	_, err = u.runCommand(projectRoot, "git", "fetch", "origin")
	if err != nil {
		return FailRespWithMsg(c, Fail, fmt.Sprintf("拉取远程信息失败: %s", err))
	}

	// 获取本地 HEAD commit
	localCommit, err := u.runCommand(projectRoot, "git", "rev-parse", "HEAD")
	if err != nil {
		return FailRespWithMsg(c, Fail, fmt.Sprintf("获取本地 commit 失败: %s", err))
	}

	// 获取远程 HEAD commit
	remoteRef := fmt.Sprintf("origin/%s", branch)
	remoteCommit, err := u.runCommand(projectRoot, "git", "rev-parse", remoteRef)
	if err != nil {
		return FailRespWithMsg(c, Fail, fmt.Sprintf("获取远程 commit 失败: %s", err))
	}

	result := vo.UpdateCheckResult{
		HasUpdate:     localCommit != remoteCommit,
		CurrentCommit: localCommit,
		LatestCommit:  remoteCommit,
		CurrentBranch: branch,
	}

	// 如果有更新，获取 commit 日志
	if result.HasUpdate {
		logRange := fmt.Sprintf("HEAD..%s", remoteRef)
		logOutput, err := u.runCommand(projectRoot, "git", "log", logRange, "--oneline", "--no-decorate")
		if err == nil && logOutput != "" {
			result.Logs = strings.Split(logOutput, "\n")
		}
	}

	return SuccessResp(c, result)
}

// DoUpdate 执行系统更新（异步）
func (u *UpdateHandler) DoUpdate(c echo.Context) error {
	context := c.(CustomContext)
	currentUser := context.CurrentUser()
	if currentUser == nil || currentUser.Id != 1 {
		return FailRespWithMsg(c, Fail, "仅管理员可执行此操作")
	}

	// 互斥锁防止并发更新
	if !u.mu.TryLock() {
		return FailRespWithMsg(c, Fail, "更新正在进行中，请勿重复操作")
	}

	// 检查是否正在更新中
	if u.status.Stage != "idle" && u.status.Stage != "done" && u.status.Stage != "failed" {
		u.mu.Unlock()
		return FailRespWithMsg(c, Fail, "更新正在进行中，请勿重复操作")
	}

	projectRoot, err := u.getProjectRoot()
	if err != nil {
		u.mu.Unlock()
		return FailRespWithMsg(c, Fail, err.Error())
	}

	branch, err := u.getCurrentBranch(projectRoot)
	if err != nil {
		u.mu.Unlock()
		return FailRespWithMsg(c, Fail, err.Error())
	}

	// 重置状态
	u.status = vo.UpdateStatus{
		Stage: "starting",
		Logs:  make([]string, 0),
	}

	// 异步执行更新
	go u.executeUpdate(projectRoot, branch)

	return SuccessResp(c, h{"message": "更新已开始"})
}

// executeUpdate 执行实际的更新流程
func (u *UpdateHandler) executeUpdate(projectRoot string, branch string) {
	defer u.mu.Unlock()

	frontendDir := filepath.Join(projectRoot, "front-react")
	backendDir := filepath.Join(projectRoot, "backend")

	// 1. Git Pull
	u.setStage("pulling", "正在拉取远程代码...")
	output, err := u.runCommand(projectRoot, "git", "pull", "origin", branch)
	if err != nil {
		u.setStage("failed", fmt.Sprintf("拉取代码失败: %s", err))
		return
	}
	u.appendLog(output)

	// 2. 前端构建：安装依赖
	u.setStage("building_frontend", "正在安装前端依赖...")
	output, err = u.runCommand(frontendDir, "pnpm", "install")
	if err != nil {
		u.setStage("failed", fmt.Sprintf("前端依赖安装失败: %s", err))
		return
	}
	u.appendLog(output)

	// 3. 前端构建：编译
	u.appendLog("正在编译前端...")
	output, err = u.runCommand(frontendDir, "pnpm", "run", "build")
	if err != nil {
		u.setStage("failed", fmt.Sprintf("前端编译失败: %s", err))
		return
	}
	u.appendLog(output)

	// 4. 后端构建
	u.setStage("building_backend", "正在编译后端...")
	execPath, err := os.Executable()
	if err != nil {
		u.setStage("failed", fmt.Sprintf("获取可执行文件路径失败: %s", err))
		return
	}

	// 确定输出文件名
	newBinaryName := "moments_new"
	if runtime.GOOS == "windows" {
		newBinaryName = "moments_new.exe"
	}
	newBinaryPath := filepath.Join(backendDir, newBinaryName)

	// 使用 prod tags 编译
	buildArgs := []string{
		"build",
		"-tags", "prod",
		"-ldflags", "-s -w",
		"-o", newBinaryPath,
	}
	output, err = u.runCommand(backendDir, "go", buildArgs...)
	if err != nil {
		u.setStage("failed", fmt.Sprintf("后端编译失败: %s", err))
		return
	}
	u.appendLog(output)
	u.appendLog(fmt.Sprintf("后端编译成功: %s", newBinaryPath))

	// 5. 替换二进制文件
	u.setStage("replacing", "正在替换可执行文件...")

	// 备份当前可执行文件
	backupPath := execPath + ".bak"
	if err := copyFile(execPath, backupPath); err != nil {
		u.appendLog(fmt.Sprintf("备份当前文件失败（非致命）: %s", err))
	} else {
		u.appendLog(fmt.Sprintf("已备份当前文件到: %s", backupPath))
	}

	// 替换可执行文件
	if err := moveFile(newBinaryPath, execPath); err != nil {
		u.setStage("failed", fmt.Sprintf("替换可执行文件失败: %s（在 Windows 上可能需要先停止服务）", err))
		return
	}

	u.setStage("done", "更新完成！请手动重启服务以使新版本生效。")
}

// GetUpdateStatus 获取更新状态
func (u *UpdateHandler) GetUpdateStatus(c echo.Context) error {
	context := c.(CustomContext)
	currentUser := context.CurrentUser()
	if currentUser == nil || currentUser.Id != 1 {
		return FailRespWithMsg(c, Fail, "仅管理员可执行此操作")
	}

	return SuccessResp(c, u.status)
}

// GetUpdateConfig 获取更新配置
func (u *UpdateHandler) GetUpdateConfig(c echo.Context) error {
	context := c.(CustomContext)
	currentUser := context.CurrentUser()
	if currentUser == nil || currentUser.Id != 1 {
		return FailRespWithMsg(c, Fail, "仅管理员可执行此操作")
	}

	projectRoot, err := u.getProjectRoot()
	if err != nil {
		return FailRespWithMsg(c, Fail, err.Error())
	}

	repoUrl, _ := u.getRemoteUrl(projectRoot)
	branch, _ := u.getCurrentBranch(projectRoot)

	config := vo.UpdateConfig{
		RepoUrl: repoUrl,
		Branch:  branch,
	}

	return SuccessResp(c, config)
}

// SaveUpdateConfig 保存更新配置（修改 git remote）
func (u *UpdateHandler) SaveUpdateConfig(c echo.Context) error {
	context := c.(CustomContext)
	currentUser := context.CurrentUser()
	if currentUser == nil || currentUser.Id != 1 {
		return FailRespWithMsg(c, Fail, "仅管理员可执行此操作")
	}

	var config vo.UpdateConfig
	if err := c.Bind(&config); err != nil {
		return FailResp(c, ParamError)
	}

	projectRoot, err := u.getProjectRoot()
	if err != nil {
		return FailRespWithMsg(c, Fail, err.Error())
	}

	// 修改远程仓库地址
	if config.RepoUrl != "" {
		_, err := u.runCommand(projectRoot, "git", "remote", "set-url", "origin", config.RepoUrl)
		if err != nil {
			return FailRespWithMsg(c, Fail, fmt.Sprintf("修改远程仓库地址失败: %s", err))
		}
	}

	// 切换分支
	if config.Branch != "" {
		currentBranch, _ := u.getCurrentBranch(projectRoot)
		if currentBranch != config.Branch {
			_, err := u.runCommand(projectRoot, "git", "checkout", config.Branch)
			if err != nil {
				return FailRespWithMsg(c, Fail, fmt.Sprintf("切换分支失败: %s", err))
			}
		}
	}

	return SuccessResp(c, h{"message": "配置已保存"})
}

// copyFile 复制文件
func copyFile(src, dst string) error {
	data, err := os.ReadFile(src)
	if err != nil {
		return err
	}
	return os.WriteFile(dst, data, 0755)
}

// moveFile 移动文件（先尝试 rename，失败则 copy + delete）
func moveFile(src, dst string) error {
	err := os.Rename(src, dst)
	if err == nil {
		return nil
	}

	// rename 失败时（如跨文件系统），使用 copy + delete
	if copyErr := copyFile(src, dst); copyErr != nil {
		return fmt.Errorf("rename 失败: %s, copy 也失败: %s", err, copyErr)
	}
	os.Remove(src)
	return nil
}
