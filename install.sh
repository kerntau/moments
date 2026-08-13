#!/usr/bin/env bash
set -Eeuo pipefail

# 上传此文件到服务器并执行：bash install.sh
REPOSITORY_URL="${REPOSITORY_URL:-https://gitee.com/kerntau/moments.git}"
BRANCH="${BRANCH:-main}"
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
CURRENT_DIR="$(pwd -P)"
TARGET_DIR="${TARGET_DIR:-$SCRIPT_DIR}"
GIT_CLONE_DEPTH="${GIT_CLONE_DEPTH:-1}"
GIT_CLONE_FILTER="${GIT_CLONE_FILTER:-blob:none}"
GIT_HTTP_VERSION="${GIT_HTTP_VERSION:-HTTP/1.1}"
GIT_HTTP_LOW_SPEED_TIME="${GIT_HTTP_LOW_SPEED_TIME:-300}"
CLEAN_PROJECT_FILES="${CLEAN_PROJECT_FILES:-false}"
INTERACTIVE_MODE="${INTERACTIVE_MODE:-auto}"
AUTO_OPEN_PORTS="${AUTO_OPEN_PORTS:-ask}"
LOG_LEVEL="${LOG_LEVEL:-INFO}"
AUTO_APPROVE=0
GO_VERSION_FALLBACK="${GO_VERSION_FALLBACK:-go1.23.3}"
SERVICE_NAME="${MOMENTS_SERVICE_NAME:-moments}"
SERVICE_PORT="${MOMENTS_PORT:-37892}"
SERVICE_HOST="${MOMENTS_HOST:-0.0.0.0}"
JWT_KEY="${MOMENTS_JWT_KEY:-}"
DB_PATH="${MOMENTS_DB:-}"
UPLOAD_DIR="${MOMENTS_UPLOAD_DIR:-}"
CORS_ORIGIN="${MOMENTS_CORS_ORIGIN:-}"

# 智能识别真实运行用户（兼容 sudo）
if [ -n "${SUDO_USER:-}" ] && [ "$SUDO_USER" != "root" ]; then
  APP_UID="$(id -u "$SUDO_USER")"
  APP_GID="$(id -g "$SUDO_USER")"
  APP_USER="$SUDO_USER"
  APP_GROUP="$(id -gn "$SUDO_USER")"
else
  APP_UID="$(id -u)"
  APP_GID="$(id -g)"
  APP_USER="$(id -un)"
  APP_GROUP="$(id -gn)"
fi

STEP_INDEX=0
STEP_TOTAL=12
STEP_LABEL=""
STEP_STARTED_AT=0
SERVER_IP=""
SERVER_IP_SOURCE=""
SITE_URL=""
INSTALL_LOG="${TMPDIR:-/tmp}/moments-install-${BASHPID:-$$}.log"
ENV_BACKUP_DIR=""
LOG_LEVEL_NUMBER=2
FIREWALL_BACKEND=""
PORT_STATUS="未检测"
PUBLIC_PORT_COUNT=0

# ─────────────────────────────────────────────────────────────
# 终端颜色
# ─────────────────────────────────────────────────────────────
if [ -t 1 ] && [ "${NO_COLOR:-}" != "1" ]; then
  C_RESET=$'\033[0m'
  C_BOLD=$'\033[1m'
  C_DIM=$'\033[2m'
  C_BLUE=$'\033[38;5;75m'
  C_CYAN=$'\033[38;5;80m'
  C_GREEN=$'\033[38;5;114m'
  C_YELLOW=$'\033[38;5;221m'
  C_RED=$'\033[38;5;203m'
  C_CLEAR_LINE=$'\033[2K'
else
  C_RESET=''
  C_BOLD=''
  C_DIM=''
  C_BLUE=''
  C_CYAN=''
  C_GREEN=''
  C_YELLOW=''
  C_RED=''
  C_CLEAR_LINE=''
fi

# ─────────────────────────────────────────────────────────────
# 日志系统
# ─────────────────────────────────────────────────────────────
log_level_number() {
  case "${1^^}" in
    ERROR) printf '0\n' ;;
    WARN|WARNING) printf '1\n' ;;
    INFO) printf '2\n' ;;
    DEBUG) printf '3\n' ;;
    *) return 1 ;;
  esac
}

configure_log_level() {
  LOG_LEVEL="${LOG_LEVEL^^}"
  case "$LOG_LEVEL" in
    WARNING) LOG_LEVEL="WARN" ;;
  esac
  LOG_LEVEL_NUMBER="$(log_level_number "$LOG_LEVEL")" || {
    printf '无效的 LOG_LEVEL：%s（可选 ERROR、WARN、INFO、DEBUG）\n' "$LOG_LEVEL" >&2
    exit 2
  }
}

should_log() {
  local level_number
  level_number="$(log_level_number "$1")" || return 1
  [ "$level_number" -le "$LOG_LEVEL_NUMBER" ]
}

log_message() {
  local level="$1" color="$2" symbol="$3"
  shift 3
  should_log "$level" || return 0
  printf '%s[%s] [%s] %s %s %s%s\n' "$C_DIM" "$(date '+%H:%M:%S')" "$level" "$color" "$symbol" "$*" "$C_RESET"
}

format_duration() {
  local seconds="${1:-0}" hours minutes
  hours=$((seconds / 3600))
  minutes=$(((seconds % 3600) / 60))
  seconds=$((seconds % 60))
  printf '%02d:%02d:%02d' "$hours" "$minutes" "$seconds"
}

print_banner() {
  printf '\n%s%s============================================================%s\n' "$C_CLEAR_LINE" "$C_BLUE" "$C_RESET"
  printf '%s%s  MOMENTS | 首次部署向导%s\n' "$C_CLEAR_LINE" "$C_BOLD" "$C_RESET"
  printf '%s%s  自动安装环境 · 拉取代码 · 构建前端 · 编译后端 · 启动服务%s\n' "$C_CLEAR_LINE" "$C_DIM" "$C_RESET"
  printf '%s%s============================================================%s\n\n' "$C_CLEAR_LINE" "$C_BLUE" "$C_RESET"
}

step_begin() {
  STEP_INDEX=$((STEP_INDEX + 1))
  STEP_LABEL="$1"
  STEP_STARTED_AT="$(date +%s)"
  printf '%s[%s] [STEP %02d/%02d]%s %s%s%s\n' "$C_DIM" "$(date '+%H:%M:%S')" "$STEP_INDEX" "$STEP_TOTAL" "$C_RESET" "$C_BOLD" "$STEP_LABEL" "$C_RESET"
}

step_success() {
  local elapsed=$(( $(date +%s) - STEP_STARTED_AT ))
  printf '%s[%s] [OK]%s  ✔ 完成（耗时 %s）%s\n' "$C_DIM" "$(date '+%H:%M:%S')" "$C_GREEN" "$(format_duration "$elapsed")" "$C_RESET"
}

log() { log_message "INFO" "$C_DIM" "•" "$*"; }
log_debug() { log_message "DEBUG" "$C_BLUE" "·" "$*"; }
log_warn() { log_message "WARN" "$C_YELLOW" "⚠" "$*"; }
log_error() { log_message "ERROR" "$C_RED" "✖" "$*" >&2; }

# ─────────────────────────────────────────────────────────────
# 交互辅助
# ─────────────────────────────────────────────────────────────
interactive_enabled() {
  case "$INTERACTIVE_MODE" in
    true|yes|1) return 0 ;;
    false|no|0) return 1 ;;
    auto) [ -t 0 ] ;;
    *) fail "INTERACTIVE_MODE 只能是 auto、true 或 false" ;;
  esac
}

ask_text() {
  local label="$1" default_value="$2" answer
  if ! interactive_enabled; then
    printf '%s\n' "$default_value"
    return 0
  fi
  if [ -n "$default_value" ]; then
    printf '%s[INPUT]%s %s [%s]：' "$C_CYAN" "$C_RESET" "$label" "$default_value" >&2
  else
    printf '%s[INPUT]%s %s：' "$C_CYAN" "$C_RESET" "$label" >&2
  fi
  if ! IFS= read -r answer; then answer=""; fi
  printf '%s\n' "${answer:-$default_value}"
}

ask_yes_no() {
  local question="$1" default_answer="${2:-yes}" answer hint
  if ! interactive_enabled; then
    [ "$AUTO_APPROVE" -eq 1 ] && return 0
    [ "$default_answer" = "yes" ]
    return
  fi
  if [ "$default_answer" = "yes" ]; then hint="Y/n"; else hint="y/N"; fi
  printf '%s[INPUT]%s %s [%s]：' "$C_CYAN" "$C_RESET" "$question" "$hint" >&2
  if ! IFS= read -r answer; then answer=""; fi
  answer="${answer:-$default_answer}"
  case "${answer,,}" in
    y|yes|是) return 0 ;;
    n|no|否) return 1 ;;
    *) log_warn "无法识别输入，请按 y 或 n 选择"; ask_yes_no "$question" "$default_answer" ;;
  esac
}

is_valid_port() {
  [[ "$1" =~ ^[0-9]+$ ]] && [ "$1" -ge 1 ] && [ "$1" -le 65535 ]
}

is_valid_ipv4() {
  [[ "$1" =~ ^([0-9]{1,3}\.){3}[0-9]{1,3}$ ]]
}

normalize_auto_open_ports() {
  case "${AUTO_OPEN_PORTS,,}" in
    ask) AUTO_OPEN_PORTS="ask" ;;
    true|yes|1|on) AUTO_OPEN_PORTS="true" ;;
    false|no|0|off) AUTO_OPEN_PORTS="false" ;;
    *) fail "AUTO_OPEN_PORTS 只能是 ask、true 或 false" ;;
  esac
}

# ─────────────────────────────────────────────────────────────
# 参数解析
# ─────────────────────────────────────────────────────────────
parse_args() {
  while [ "$#" -gt 0 ]; do
    case "$1" in
      -h|--help)
        printf '首次部署：bash install.sh [--yes|--non-interactive] [--log-level LEVEL]\n'
        printf '可覆盖参数：--repo URL、--branch NAME、--target-dir PATH、--host HOST、--port PORT、--service-name NAME、--auto-open-ports ask|true|false\n'
        exit 0
        ;;
      -y|--yes) INTERACTIVE_MODE="false"; AUTO_APPROVE=1 ;;
      --non-interactive) INTERACTIVE_MODE="false" ;;
      --interactive) INTERACTIVE_MODE="true" ;;
      --debug) LOG_LEVEL="DEBUG" ;;
      --log-level)
        shift; [ "$#" -gt 0 ] || { printf '%s\n' '--log-level 缺少值' >&2; exit 2; }; LOG_LEVEL="$1" ;;
      --log-level=*) LOG_LEVEL="${1#*=}" ;;
      --repo)
        shift; [ "$#" -gt 0 ] || { printf '%s\n' '--repo 缺少值' >&2; exit 2; }; REPOSITORY_URL="$1" ;;
      --repo=*) REPOSITORY_URL="${1#*=}" ;;
      --branch)
        shift; [ "$#" -gt 0 ] || { printf '%s\n' '--branch 缺少值' >&2; exit 2; }; BRANCH="$1" ;;
      --branch=*) BRANCH="${1#*=}" ;;
      --target-dir)
        shift; [ "$#" -gt 0 ] || { printf '%s\n' '--target-dir 缺少值' >&2; exit 2; }; TARGET_DIR="$1" ;;
      --target-dir=*) TARGET_DIR="${1#*=}" ;;
      --port)
        shift; [ "$#" -gt 0 ] || { printf '%s\n' '--port 缺少值' >&2; exit 2; }; SERVICE_PORT="$1" ;;
      --port=*) SERVICE_PORT="${1#*=}" ;;
      --host)
        shift; [ "$#" -gt 0 ] || { printf '%s\n' '--host 缺少值' >&2; exit 2; }; SERVICE_HOST="$1" ;;
      --host=*) SERVICE_HOST="${1#*=}" ;;
      --service-name)
        shift; [ "$#" -gt 0 ] || { printf '%s\n' '--service-name 缺少值' >&2; exit 2; }; SERVICE_NAME="$1" ;;
      --service-name=*) SERVICE_NAME="${1#*=}" ;;
      --auto-open-ports)
        shift; [ "$#" -gt 0 ] || { printf '%s\n' '--auto-open-ports 缺少值' >&2; exit 2; }; AUTO_OPEN_PORTS="$1" ;;
      --auto-open-ports=*) AUTO_OPEN_PORTS="${1#*=}" ;;
      --no-clean) CLEAN_PROJECT_FILES="false" ;;
      --clean) CLEAN_PROJECT_FILES="true" ;;
      *) printf '未知参数：%s（使用 --help 查看用法）\n' "$1" >&2; exit 2 ;;
    esac
    shift
  done
}

# ─────────────────────────────────────────────────────────────
# 核心工具函数
# ─────────────────────────────────────────────────────────────
fail() {
  log_error "部署失败"
  log_error "$*"
  log_message "INFO" "$C_DIM" "•" "当前阶段：${STEP_LABEL:-未开始}" >&2
  log_message "INFO" "$C_DIM" "•" "完整命令日志：$INSTALL_LOG" >&2
  exit 1
}

run_root() {
  if [ "$(id -u)" -eq 0 ]; then
    "$@"
  elif command -v sudo >/dev/null 2>&1; then
    sudo "$@"
  else
    fail "需要 root 权限或 sudo：$*"
  fi
}

prepare_privilege() {
  if [ "$(id -u)" -eq 0 ]; then
    log "当前以 root 身份运行"
    return
  fi
  command -v sudo >/dev/null 2>&1 || fail "需要 root 权限或 sudo：请使用 sudo bash install.sh"
  log "请求 sudo 权限（后续步骤将不再重复询问）"
  sudo -v || fail "sudo 授权失败"
}

run_quiet() {
  local label="$1"
  shift
  local allow_failure=0 pid status frame_index=0 frame frames='|/-\\' started_at elapsed

  if [ "$label" = "--allow-failure" ]; then
    allow_failure=1
    label="$1"
    shift
  fi

  : > "$INSTALL_LOG"
  started_at="$(date +%s)"
  "$@" >"$INSTALL_LOG" 2>&1 &
  pid=$!

  if [ -t 1 ]; then
    while kill -0 "$pid" 2>/dev/null; do
      frame="${frames:$frame_index:1}"
      elapsed=$(( $(date +%s) - started_at ))
      printf '\r\033[2K%s[%s] [RUN] %s %s %s%s' "$C_CYAN" "$(date '+%H:%M:%S')" "$frame" "$label" "| 已运行 $(format_duration "$elapsed")" "$C_RESET"
      frame_index=$(( (frame_index + 1) % 4 ))
      sleep 0.5
    done
  fi

  if wait "$pid"; then
    if [ -t 1 ]; then
      elapsed=$(( $(date +%s) - started_at ))
      printf '\r\033[2K%s[%s] [OK]%s  ✔ %s（耗时 %s）%s\n' "$C_GREEN" "$(date '+%H:%M:%S')" "$C_RESET" "$label" "$(format_duration "$elapsed")" "$C_RESET"
    else
      elapsed=$(( $(date +%s) - started_at ))
      printf '%s[%s] [OK]%s  ✔ %s（耗时 %s）%s\n' "$C_GREEN" "$(date '+%H:%M:%S')" "$C_RESET" "$label" "$(format_duration "$elapsed")" "$C_RESET"
    fi
    return 0
  else
    status=$?
  fi

  elapsed=$(( $(date +%s) - started_at ))
  printf '\n%s[%s] [ERROR]%s  ✖ %s 失败（退出码 %s，耗时 %s）%s\n' "$C_RED" "$(date '+%H:%M:%S')" "$C_RESET" "$label" "$status" "$(format_duration "$elapsed")" "$C_RESET" >&2
  if [ -s "$INSTALL_LOG" ]; then
    printf '%s[%s] [WARN]%s  最近 40 行错误日志：%s\n' "$C_YELLOW" "$(date '+%H:%M:%S')" "$C_RESET" "$C_RESET" >&2
    tail -n 40 "$INSTALL_LOG" >&2 || true
  fi
  if [ "$allow_failure" -eq 1 ]; then
    return "$status"
  fi
  fail "$label 失败，完整日志：$INSTALL_LOG"
}

version_major() {
  printf '%s\n' "$1" | sed -E 's/^v?([0-9]+).*/\1/'
}

# ─────────────────────────────────────────────────────────────
# 环境检测
# ─────────────────────────────────────────────────────────────
node_ready() {
  command -v node >/dev/null 2>&1 && [ "$(version_major "$(node --version 2>/dev/null)")" -ge 20 ] 2>/dev/null
}

go_ready() {
  export PATH="/usr/local/go/bin:$PATH"
  if ! command -v go >/dev/null 2>&1; then return 1; fi
  local version minor
  version="$(go version 2>/dev/null)"
  minor="$(printf '%s\n' "$version" | sed -nE 's/.*go1\.([0-9]+).*/\1/p')"
  [ -n "$minor" ] && [ "$minor" -ge 23 ]
}

pnpm_ready() {
  command -v pnpm >/dev/null 2>&1
}

# ─────────────────────────────────────────────────────────────
# .env 文件操作
# ─────────────────────────────────────────────────────────────
read_env_value() {
  local file="$1" key="$2"
  [ -f "$file" ] || return 0
  awk -F= -v key="$key" '
    $1 ~ "^[[:space:]]*" key "[[:space:]]*$" {
      value = $0
      sub(/^[^=]*=/, "", value)
      sub(/^[[:space:]]+/, "", value)
      sub(/[[:space:]]+$/, "", value)
      print value
      exit
    }
  ' "$file" | sed -E 's/^"(.*)"$/\1/; s/^'"'"'(.*)'"'"'$/\1/'
}

env_key_present() {
  local file="$1" key="$2"
  [ -f "$file" ] || return 1
  awk -F= -v key="$key" '$1 ~ "^[[:space:]]*" key "[[:space:]]*$" { found = 1; exit } END { exit !found }' "$file"
}

append_env_value() {
  local file="$1" key="$2" value="$3"
  printf '\n%s=%s\n' "$key" "$value" | run_root tee -a "$file" >/dev/null
}

replace_env_value() {
  local file="$1" key="$2" value="$3" temporary_file
  temporary_file="$(mktemp)"
  awk -F= -v key="$key" -v value="$value" '
    $1 ~ "^[[:space:]]*" key "[[:space:]]*$" {
      print key "=" value
      replaced = 1
      next
    }
    { print }
  ' "$file" > "$temporary_file"
  run_root mv "$temporary_file" "$file"
}

ensure_env_value() {
  local file="$1" key="$2" value="$3" current
  if ! env_key_present "$file" "$key"; then
    append_env_value "$file" "$key" "$value"
    return
  fi
  current="$(read_env_value "$file" "$key")"
  if [ -z "$current" ]; then
    replace_env_value "$file" "$key" "$value"
  fi
}

sync_env_value() {
  local file="$1" key="$2" value="$3"
  if env_key_present "$file" "$key"; then
    replace_env_value "$file" "$key" "$value"
  else
    append_env_value "$file" "$key" "$value"
  fi
}

# ─────────────────────────────────────────────────────────────
# 环境文件备份与恢复
# ─────────────────────────────────────────────────────────────
backup_runtime_env() {
  local source backup
  ENV_BACKUP_DIR="$(mktemp -d)"
  for source in "$TARGET_DIR/.env" "$TARGET_DIR/backend/.env"; do
    [ -f "$source" ] || continue
    backup="$ENV_BACKUP_DIR/${source//\//__}"
    run_root cp -p "$source" "$backup"
  done
}

restore_runtime_env() {
  [ -n "$ENV_BACKUP_DIR" ] && [ -d "$ENV_BACKUP_DIR" ] || return 0
  local source backup target
  for source in "$TARGET_DIR/.env" "$TARGET_DIR/backend/.env"; do
    backup="$ENV_BACKUP_DIR/${source//\//__}"
    [ -f "$backup" ] || continue
    target="$source"
    run_root mkdir -p "$(dirname "$target")"
    run_root cp -p "$backup" "$target"
  done
  rm -rf -- "$ENV_BACKUP_DIR"
  ENV_BACKUP_DIR=""
}

# ─────────────────────────────────────────────────────────────
# 目录清理
# ─────────────────────────────────────────────────────────────
validate_cleanup_target() {
  if command -v realpath >/dev/null 2>&1; then
    TARGET_DIR="$(realpath -m -- "$TARGET_DIR")"
  fi
  case "$TARGET_DIR" in
    ""|"/"|"/bin"|"/etc"|"/home"|"/opt"|"/root"|"/srv"|"/usr"|"/var"|"/www"|"/www/wwwroot")
      fail "拒绝清理过于宽泛的目标目录：$TARGET_DIR"
      ;;
  esac
}

is_cleanup_enabled() {
  case "${CLEAN_PROJECT_FILES,,}" in
    true|1|yes) return 0 ;;
    *) return 1 ;;
  esac
}

cleanup_existing_repository() {
  is_cleanup_enabled || {
    log "已关闭项目遗留文件清理：CLEAN_PROJECT_FILES=$CLEAN_PROJECT_FILES"
    return
  }
  validate_cleanup_target
  backup_runtime_env
  log "清理旧代码改动（环境文件、数据库和上传文件会保留）"
  if ! run_quiet --allow-failure "恢复仓库干净状态" git -C "$TARGET_DIR" reset --hard; then
    restore_runtime_env
    fail "无法恢复仓库干净状态"
  fi
  if ! run_quiet --allow-failure "删除项目遗留文件和构建缓存" git -C "$TARGET_DIR" clean -fdx \
    -e .env -e backend/.env -e backend/db.sqlite -e backend/db.sqlite* -e backend/upload/ -e backend/upload/* -e upload/ -e install.sh; then
    restore_runtime_env
    fail "无法清理项目遗留文件"
  fi
  restore_runtime_env
  log "环境文件和运行数据已恢复"
}

cleanup_non_repository_directory() {
  local item
  validate_cleanup_target
  backup_runtime_env
  log "清理非 Git 目标目录中的旧文件"
  for item in "$TARGET_DIR"/* "$TARGET_DIR"/.[!.]* "$TARGET_DIR"/..?*; do
    [ -e "$item" ] || continue
    case "$item" in
      "$TARGET_DIR/.env"|"$TARGET_DIR/backend/.env"|"$TARGET_DIR/backend/db.sqlite"*|"$TARGET_DIR/backend/upload"*|"$TARGET_DIR/install.sh") continue ;;
    esac
    if ! run_root rm -rf -- "$item"; then
      restore_runtime_env
      fail "无法清理遗留文件：$item"
    fi
  done
  restore_runtime_env
  log "环境文件和运行数据已恢复"
}

# ─────────────────────────────────────────────────────────────
# 网络与下载
# ─────────────────────────────────────────────────────────────
download_file() {
  local output="$1"
  shift
  local url
  for url in "$@"; do
    log "尝试下载：$url"
    if curl -fsSL \
      --retry 5 \
      --retry-delay 2 \
      --retry-connrefused \
      --connect-timeout 15 \
      --max-time 300 \
      "$url" -o "$output"; then
      return 0
    fi
    rm -f -- "$output"
    log "下载失败，准备切换备用源"
  done
  fail "所有下载源均不可用，请检查服务器网络后重新执行脚本"
}

detect_server_ip() {
  local candidate
  candidate="$(curl -4fsS --max-time 5 https://api.ipify.org 2>/dev/null || true)"
  if [[ "$candidate" =~ ^([0-9]{1,3}\.){3}[0-9]{1,3}$ ]]; then
    SERVER_IP="$candidate"
    SERVER_IP_SOURCE="public"
    printf '%s\n' "$candidate"
    return
  fi
  candidate="$(hostname -I 2>/dev/null | tr ' ' '\n' | awk '$0 ~ /^[0-9]+\./ { print; exit }' || true)"
  SERVER_IP="${candidate:-127.0.0.1}"
  SERVER_IP_SOURCE="local"
  printf '%s\n' "$SERVER_IP"
}

# ─────────────────────────────────────────────────────────────
# 配置校验与交互
# ─────────────────────────────────────────────────────────────
configuration_is_valid() {
  [ -n "$REPOSITORY_URL" ] || { log_warn "仓库地址不能为空"; return 1; }
  [ -n "$BRANCH" ] || { log_warn "分支名称不能为空"; return 1; }
  [[ "$TARGET_DIR" = /* ]] || { log_warn "目标目录必须是绝对路径：$TARGET_DIR"; return 1; }
  is_valid_port "$SERVICE_PORT" || { log_warn "端口无效：$SERVICE_PORT"; return 1; }
  case "$AUTO_OPEN_PORTS" in
    ask|true|false) ;;
    *) log_warn "AUTO_OPEN_PORTS 只能是 ask、true 或 false：$AUTO_OPEN_PORTS"; return 1 ;;
  esac
  [[ "$SERVICE_HOST" =~ ^[a-zA-Z0-9:._-]+$ ]] || { log_warn "监听地址无效：$SERVICE_HOST"; return 1; }
}

print_configuration() {
  local cleanup_label="保留运行数据，清理旧代码"
  if ! is_cleanup_enabled; then cleanup_label="不清理旧代码"; fi
  printf '\n%s------------------------------------------------------------%s\n' "$C_BLUE" "$C_RESET"
  printf '%s  部署配置确认%s\n' "$C_BOLD" "$C_RESET"
  printf '%s------------------------------------------------------------%s\n' "$C_BLUE" "$C_RESET"
  printf '  %-10s %s\n' '仓库' "$REPOSITORY_URL"
  printf '  %-10s %s\n' '分支' "$BRANCH"
  printf '  %-10s %s\n' '目录' "$TARGET_DIR"
  printf '  %-10s %s:%s\n' '监听地址' "$SERVICE_HOST" "$SERVICE_PORT"
  printf '  %-10s %s（本机防火墙）\n' '端口放行' "$AUTO_OPEN_PORTS"
  printf '  %-10s %s（来源：%s）\n' '公网 IP' "$SERVER_IP" "$SERVER_IP_SOURCE"
  printf '  %-10s %s\n' '清理策略' "$cleanup_label"
  printf '  %-10s %s\n' '服务名称' "$SERVICE_NAME"
  printf '  %-10s %s:%s\n' '运行用户' "$APP_USER" "$APP_GROUP"
  printf '%s------------------------------------------------------------%s\n' "$C_BLUE" "$C_RESET"
}

edit_configuration() {
  local choice value
  while true; do
    print_configuration
    if ask_yes_no "以上配置确认无误，开始部署" yes; then return 0; fi
    if ! interactive_enabled; then fail "部署配置未确认"; fi
    printf '\n%s[INPUT]%s 输入要修改的项目：\n' "$C_CYAN" "$C_RESET" >&2
    printf '  1) 仓库地址   2) 分支   3) 项目目录   4) 监听地址\n' >&2
    printf '  5) 监听端口   6) 端口放行   7) 清理策略   8) 服务名称\n' >&2
    printf '  9) 重新确认\n' >&2
    printf '%s[INPUT]%s 请选择 [1-9]：' "$C_CYAN" "$C_RESET" >&2
    if ! IFS= read -r choice; then choice="9"; fi
    case "$choice" in
      1) REPOSITORY_URL="$(ask_text '仓库地址' "$REPOSITORY_URL")" ;;
      2) BRANCH="$(ask_text '分支名称' "$BRANCH")" ;;
      3)
        value="$(ask_text '安装目录（绝对路径）' "$TARGET_DIR")"
        [ -n "$value" ] && TARGET_DIR="$value"
        ;;
      4) SERVICE_HOST="$(ask_text '监听地址（公网使用 0.0.0.0）' "$SERVICE_HOST")" ;;
      5)
        value="$(ask_text '监听端口' "$SERVICE_PORT")"
        is_valid_port "$value" && SERVICE_PORT="$value" || log_warn "端口无效，保留原值：$SERVICE_PORT"
        ;;
      6)
        value="$(ask_text '本机防火墙自动放行策略（ask/true/false）' "$AUTO_OPEN_PORTS")"
        case "${value,,}" in
          ask) AUTO_OPEN_PORTS="ask" ;;
          true|yes|1|on) AUTO_OPEN_PORTS="true" ;;
          false|no|0|off) AUTO_OPEN_PORTS="false" ;;
          *) log_warn "策略无效，保留原值：$AUTO_OPEN_PORTS" ;;
        esac
        ;;
      7)
        if is_cleanup_enabled; then CLEAN_PROJECT_FILES="false"; else CLEAN_PROJECT_FILES="true"; fi
        log "清理策略已切换为：$CLEAN_PROJECT_FILES"
        ;;
      8) SERVICE_NAME="$(ask_text 'systemd 服务名称' "$SERVICE_NAME")" ;;
      9) configuration_is_valid && continue ;;
      *) log_warn "请输入 1 到 9" ;;
    esac
    configuration_is_valid || true
  done
}

confirm_existing_target() {
  local has_files=0
  [ -e "$TARGET_DIR" ] || return 0
  [ "$(find "$TARGET_DIR" -mindepth 1 -maxdepth 1 -print -quit 2>/dev/null)" ] && has_files=1
  [ "$has_files" -eq 1 ] || return 0
  if [ -d "$TARGET_DIR/.git" ] && ! is_cleanup_enabled; then
    log "将在当前 Git 项目中就地部署，不清理源码：$TARGET_DIR"
    return 0
  fi
  if is_cleanup_enabled; then
    log_warn "目标目录已存在内容：部署时会清理旧代码和构建缓存，但保留 .env、db.sqlite、upload/ 和 install.sh"
    ask_yes_no "确认清理目标目录中的旧代码并继续" no || fail "用户取消部署，未修改目标目录"
  else
    log_warn "目标目录已存在内容，当前清理策略关闭；如存在旧代码，部署可能失败"
  fi
}

prepare_interactive_configuration() {
  detect_server_ip >/dev/null || true
  if [ "$SERVER_IP_SOURCE" = "local" ] && interactive_enabled; then
    log_warn "暂时无法可靠获取公网 IP，当前使用本机地址：$SERVER_IP"
    printf '%s[INPUT]%s 如果你知道公网 IPv4，可直接输入；留空继续使用 %s：' "$C_CYAN" "$C_RESET" "$SERVER_IP" >&2
    local entered_ip
    if ! IFS= read -r entered_ip; then entered_ip=""; fi
    if [ -n "$entered_ip" ] && is_valid_ipv4 "$entered_ip"; then
      SERVER_IP="$entered_ip"
      SERVER_IP_SOURCE="user"
      log "已使用手动确认的公网 IP：$SERVER_IP"
    elif [ -n "$entered_ip" ]; then
      log_warn "输入不是有效 IPv4，继续使用自动检测地址：$SERVER_IP"
    fi
  fi
  configuration_is_valid || fail "默认部署配置不完整，请使用参数修正后重试"
  edit_configuration
  confirm_existing_target
}

# ─────────────────────────────────────────────────────────────
# 环境文件继承
# ─────────────────────────────────────────────────────────────
adopt_env_files() {
  local target source source_file
  target="$TARGET_DIR/backend/.env"
  [ -f "$target" ] && return
  source_file=""
  for source in "$CURRENT_DIR/.env" "$CURRENT_DIR/backend/.env" "$SCRIPT_DIR/.env" "$SCRIPT_DIR/backend/.env"; do
    if [ -f "$source" ] && [ "$source" != "$target" ]; then
      source_file="$source"
      break
    fi
  done
  [ -n "$source_file" ] || return 0
  log "复制当前目录中的环境文件到后端目录"
  run_root mkdir -p "$(dirname "$target")"
  run_root cp "$source_file" "$target"
}

ensure_app_ownership() {
  if [ "$APP_UID" -ne 0 ] && [ -d "$TARGET_DIR" ]; then
    run_root chown -R "$APP_UID:$APP_GID" "$TARGET_DIR"
  fi
}

# ─────────────────────────────────────────────────────────────
# 系统依赖安装
# ─────────────────────────────────────────────────────────────
install_base_packages() {
  if command -v apt-get >/dev/null 2>&1; then
    log "检测到包管理器：apt"
    run_quiet "更新 apt 软件源" run_root apt-get update
    run_quiet "安装系统编译依赖" run_root apt-get install -y ca-certificates curl git tar gzip xz-utils iproute2 build-essential
  elif command -v dnf >/dev/null 2>&1; then
    log "检测到包管理器：dnf"
    run_quiet "安装系统编译依赖" run_root dnf install -y ca-certificates curl git tar gzip xz iproute gcc gcc-c++ make
  elif command -v yum >/dev/null 2>&1; then
    log "检测到包管理器：yum"
    run_quiet "安装系统编译依赖" run_root yum install -y ca-certificates curl git tar gzip xz iproute gcc gcc-c++ make
  elif command -v apk >/dev/null 2>&1; then
    log "检测到包管理器：apk"
    run_quiet "安装系统编译依赖" run_root apk add --no-cache ca-certificates curl git tar gzip xz iproute2 build-base
  elif command -v pacman >/dev/null 2>&1; then
    log "检测到包管理器：pacman"
    run_quiet "安装系统编译依赖" run_root pacman -Sy --noconfirm ca-certificates curl git tar gzip xz iproute2 base-devel
  else
    fail "无法识别 Linux 包管理器，请先安装 Git、curl、tar 和编译工具"
  fi
}

install_node() {
  if node_ready; then
    log "Node.js 已满足要求：$(node --version)"
    return
  fi
  log "安装 Node.js 20+"
  if command -v apt-get >/dev/null 2>&1; then
    local node_setup_script
    node_setup_script="$(mktemp)"
    download_file "$node_setup_script" "https://deb.nodesource.com/setup_20.x"
    run_quiet "配置 Node.js 软件源" run_root bash "$node_setup_script"
    rm -f -- "$node_setup_script"
    run_quiet "安装 Node.js" run_root apt-get install -y nodejs
  elif command -v dnf >/dev/null 2>&1; then
    run_quiet "重置 Node.js 软件模块" run_root dnf module reset -y nodejs || true
    run_quiet "启用 Node.js 20 软件模块" run_root dnf module enable -y nodejs:20 || true
    run_quiet "安装 Node.js" run_root dnf install -y nodejs
  elif command -v yum >/dev/null 2>&1; then
    local node_setup_script
    node_setup_script="$(mktemp)"
    download_file "$node_setup_script" "https://rpm.nodesource.com/setup_20.x"
    run_quiet "配置 Node.js 软件源" run_root bash "$node_setup_script"
    rm -f -- "$node_setup_script"
    run_quiet "安装 Node.js" run_root yum install -y nodejs
  elif command -v apk >/dev/null 2>&1; then
    run_quiet "安装 Node.js" run_root apk add --no-cache nodejs npm
  elif command -v pacman >/dev/null 2>&1; then
    run_quiet "安装 Node.js" run_root pacman -S --noconfirm nodejs npm
  fi
  node_ready || fail "Node.js 20+ 安装失败，请手动安装后重新运行此脚本"
}

install_go() {
  if go_ready; then
    log "Go 已满足要求：$(go version | awk '{print $3}')"
    return
  fi
  log "安装 Go 1.23+"
  local go_version go_arch go_archive download_dir version_url
  case "$(uname -m)" in
    x86_64) go_arch="amd64" ;;
    aarch64|arm64) go_arch="arm64" ;;
    armv7l) go_arch="armv6l" ;;
    *) fail "不支持的 CPU 架构：$(uname -m)" ;;
  esac
  go_version="${GO_VERSION:-}"
  if [ -z "$go_version" ]; then
    for version_url in \
      'https://go.dev/VERSION?m=text' \
      'https://golang.google.cn/VERSION?m=text' \
      'https://dl.google.com/go/VERSION?m=text'; do
      log_debug "获取 Go 版本清单：$version_url"
      go_version="$(curl -fsSL \
        --retry 3 \
        --retry-delay 2 \
        --retry-connrefused \
        --connect-timeout 15 \
        --max-time 60 \
        "$version_url" 2>/dev/null | sed -n '1p' | tr -d '\r' || true)"
      if [[ "$go_version" =~ ^go1\.[0-9]+([.][0-9]+)?$ ]]; then
        break
      fi
      go_version=""
    done
  fi
  if ! [[ "$go_version" =~ ^go1\.[0-9]+([.][0-9]+)?$ ]]; then
    go_version="$GO_VERSION_FALLBACK"
    log_warn "无法获取 Go 在线版本清单，使用兜底版本：$go_version"
  fi
  [[ "$go_version" =~ ^go1\.[0-9]+([.][0-9]+)?$ ]] || fail "GO_VERSION 无效：$go_version"
  download_dir="$(mktemp -d)"
  go_archive="${go_version}.linux-${go_arch}.tar.gz"
  download_file "$download_dir/go.tgz" \
    "https://golang.google.cn/dl/${go_archive}" \
    "https://dl.google.com/go/${go_archive}" \
    "https://go.dev/dl/${go_archive}"
  run_root rm -rf /usr/local/go
  run_quiet "解压 Go 到 /usr/local/go" run_root tar -C /usr/local -xzf "$download_dir/go.tgz"
  rm -rf -- "$download_dir"
  export PATH="/usr/local/go/bin:$PATH"
  run_root ln -sf /usr/local/go/bin/go /usr/bin/go
  run_root ln -sf /usr/local/go/bin/gofmt /usr/bin/gofmt
  go_ready || fail "Go 1.23+ 安装失败，请手动安装后重新运行此脚本"
}

install_pnpm() {
  log "准备 pnpm"
  if command -v corepack >/dev/null 2>&1; then
    run_quiet "启用 Corepack" run_root corepack enable || true
    run_quiet "准备 pnpm" corepack prepare pnpm@latest --activate || true
  fi
  if ! pnpm_ready; then
    run_quiet "安装 pnpm" run_root npm install --global pnpm
  fi
  pnpm_ready || fail "pnpm 安装失败"
  log "pnpm：$(pnpm --version)"
}

# ─────────────────────────────────────────────────────────────
# 仓库管理
# ─────────────────────────────────────────────────────────────
clone_repository() {
  local destination="$1" clone_attempt clone_args base_clone_args
  base_clone_args="--branch $BRANCH --single-branch --no-tags"
  if ! [[ "$GIT_CLONE_DEPTH" =~ ^[0-9]+$ ]]; then
    fail "GIT_CLONE_DEPTH 必须是数字，使用 0 表示完整历史"
  fi
  if [ "$GIT_CLONE_DEPTH" -gt 0 ]; then
    base_clone_args="$base_clone_args --depth $GIT_CLONE_DEPTH"
    log "使用浅克隆：仅拉取最近 ${GIT_CLONE_DEPTH} 次提交"
  else
    log "使用完整 Git 历史"
  fi
  clone_args="$base_clone_args"
  if [ -n "$GIT_CLONE_FILTER" ]; then
    clone_args="$clone_args --filter=$GIT_CLONE_FILTER"
    log "启用 Git 部分克隆：$GIT_CLONE_FILTER（减少首次传输量）"
  fi

  for clone_attempt in 1 2 3; do
    if [ "$clone_attempt" -eq 3 ] && [ -n "$GIT_CLONE_FILTER" ]; then
      clone_args="$base_clone_args"
      log "部分克隆重试失败，切换为普通浅克隆"
    fi
    log "拉取仓库（第 ${clone_attempt}/3 次）：$REPOSITORY_URL"
    if run_quiet --allow-failure "拉取仓库（第 ${clone_attempt}/3 次）" run_root git \
      -c "http.version=$GIT_HTTP_VERSION" \
      -c "http.lowSpeedLimit=1" \
      -c "http.lowSpeedTime=$GIT_HTTP_LOW_SPEED_TIME" \
      clone $clone_args "$REPOSITORY_URL" "$destination"; then
      return 0
    fi
    run_root rm -rf -- "$destination"
    [ "$clone_attempt" -lt 3 ] && log "Git 网络连接失败，5 秒后重试"
    [ "$clone_attempt" -lt 3 ] && sleep 5
  done
  fail "Git 仓库拉取失败，请检查服务器到 Gitee 的网络，或设置 REPOSITORY_URL 使用可访问的镜像地址"
}

prepare_repository() {
  if [ -d "$TARGET_DIR/.git" ]; then
    log "在当前项目中就地部署：$TARGET_DIR"
    ensure_app_ownership
    cleanup_existing_repository
    run_quiet "同步远程分支" git -C "$TARGET_DIR" fetch origin "$BRANCH"
    run_quiet "切换到部署分支" git -C "$TARGET_DIR" checkout "$BRANCH"
    run_quiet "快进更新项目代码" git -C "$TARGET_DIR" pull --ff-only origin "$BRANCH"
    return
  fi
  if [ -f "$TARGET_DIR/backend/go.mod" ] && [ -d "$TARGET_DIR/front-react" ]; then
    log "使用当前项目文件（未检测到 Git 仓库）：$TARGET_DIR"
    ensure_app_ownership
    return
  fi
  if [ -e "$TARGET_DIR" ] && [ "$(find "$TARGET_DIR" -mindepth 1 -maxdepth 1 -print -quit 2>/dev/null)" ]; then
    if [ "$TARGET_DIR" = "$SCRIPT_DIR" ] && [ -f "$SCRIPT_DIR/install.sh" ]; then
      local clone_dir
      clone_dir="$(mktemp -d)"
      log "当前目录包含安装脚本，先克隆到临时目录再合并：$TARGET_DIR"
      clone_repository "$clone_dir"
      if is_cleanup_enabled; then
        cleanup_non_repository_directory
      fi
      run_root cp -a "$clone_dir/." "$TARGET_DIR/"
      run_root rm -rf -- "$clone_dir"
      ensure_app_ownership
      return
    fi
    fail "目标目录非空但不是 Git 仓库：$TARGET_DIR"
  fi
  run_root mkdir -p "$(dirname "$TARGET_DIR")"
  clone_repository "$TARGET_DIR"
  ensure_app_ownership
}

# ─────────────────────────────────────────────────────────────
# 运行环境配置
# ─────────────────────────────────────────────────────────────
random_value() {
  local length="${1:-32}"
  if command -v node >/dev/null 2>&1; then
    node -e "console.log(require('crypto').randomBytes(${length}).toString('hex').slice(0, ${length}))" 2>/dev/null && return
  fi
  tr -dc 'a-zA-Z0-9' < /dev/urandom | head -c "$length" 2>/dev/null || true
}

ensure_runtime_env() {
  local backend_env="$TARGET_DIR/backend/.env"
  local server_ip jwt_key db_path upload_dir

  if [ -z "$SERVER_IP" ] || [ "$SERVER_IP_SOURCE" = "local" ]; then
    detect_server_ip >/dev/null || true
  fi
  server_ip="$SERVER_IP"
  SITE_URL="http://${server_ip}:${SERVICE_PORT}"
  SERVER_IP="$server_ip"

  jwt_key="$JWT_KEY"
  [ -n "$jwt_key" ] || jwt_key="$(read_env_value "$backend_env" JWT_KEY 2>/dev/null || true)"
  [ -n "$jwt_key" ] || jwt_key="$(random_value 32)"

  db_path="$DB_PATH"
  [ -n "$db_path" ] || db_path="$(read_env_value "$backend_env" DB 2>/dev/null || true)"

  upload_dir="$UPLOAD_DIR"
  [ -n "$upload_dir" ] || upload_dir="$(read_env_value "$backend_env" UPLOAD_DIR 2>/dev/null || true)"

  log "服务器 IP：$server_ip（来源：$SERVER_IP_SOURCE）"
  log "访问地址：$SITE_URL"

  if [ ! -f "$backend_env" ]; then
    log "未找到 $backend_env，按当前配置自动生成"
    run_root mkdir -p "$(dirname "$backend_env")"
    run_root tee "$backend_env" >/dev/null <<EOF
# 由 install.sh 自动生成
PORT=${SERVICE_PORT}
JWT_KEY=${jwt_key}
LOG_LEVEL=INFO
ENABLE_SWAGGER=false
ENABLE_SQL_OUTPUT=false
EOF
    if [ -n "$db_path" ]; then
      append_env_value "$backend_env" "DB" "$db_path"
    fi
    if [ -n "$upload_dir" ]; then
      append_env_value "$backend_env" "UPLOAD_DIR" "$upload_dir"
    fi
    if [ -n "$CORS_ORIGIN" ]; then
      append_env_value "$backend_env" "CORS_ORIGIN" "$CORS_ORIGIN"
    fi
  else
    sync_env_value "$backend_env" PORT "$SERVICE_PORT"
    ensure_env_value "$backend_env" JWT_KEY "$jwt_key"
    if [ -n "$db_path" ]; then
      sync_env_value "$backend_env" DB "$db_path"
    fi
    if [ -n "$upload_dir" ]; then
      sync_env_value "$backend_env" UPLOAD_DIR "$upload_dir"
    fi
    if [ -n "$CORS_ORIGIN" ]; then
      sync_env_value "$backend_env" CORS_ORIGIN "$CORS_ORIGIN"
    fi
  fi
}

load_runtime_port() {
  if [ -z "${MOMENTS_PORT+x}" ]; then
    local configured_port
    configured_port="$(read_env_value "$TARGET_DIR/backend/.env" PORT)"
    [ -n "$configured_port" ] && SERVICE_PORT="$configured_port"
  fi
}

# ─────────────────────────────────────────────────────────────
# 构建
# ─────────────────────────────────────────────────────────────
build_frontend() {
  log "安装项目依赖（pnpm install）"
  run_quiet "安装前端与工作区依赖" pnpm --dir "$TARGET_DIR" install --frozen-lockfile || run_quiet "安装依赖（无 freeze 模式）" pnpm --dir "$TARGET_DIR" install
  log "构建前端（输出到 backend/public/）"
  run_quiet "构建前端" pnpm --dir "$TARGET_DIR" --filter front-react run build
}

build_backend() {
  local go_arch go_arm="" binary_name binary_path
  case "$(uname -m)" in
    x86_64) go_arch="amd64" ;;
    aarch64|arm64) go_arch="arm64" ;;
    armv7l) go_arch="arm"; go_arm="7" ;;
    *) go_arch="amd64" ;;
  esac
  binary_name="moments"
  binary_path="$TARGET_DIR/backend/dist/$binary_name"
  log "编译 Go 后端（prod 模式，嵌入前端静态文件）"
  run_root mkdir -p "$TARGET_DIR/backend/dist"
  export PATH="/usr/local/go/bin:$PATH"
  run_quiet "下载 Go 依赖" bash -c "export PATH='/usr/local/go/bin:\$PATH'; cd '$TARGET_DIR/backend' && go mod download"
  run_quiet "编译 Go 后端" bash -c "export PATH='/usr/local/go/bin:\$PATH'; cd '$TARGET_DIR/backend' && GOOS=linux GOARCH=$go_arch ${go_arm:+GOARM=$go_arm} CGO_ENABLED=0 go build -tags prod -ldflags='-s -w' -o '$binary_path' ."
  run_root chmod +x "$binary_path"
  [ -f "$binary_path" ] || fail "Go 后端编译失败：构建产物不存在"
  log "构建产物：$binary_path"
}

# ─────────────────────────────────────────────────────────────
# systemd 服务管理
# ─────────────────────────────────────────────────────────────
create_systemd_service() {
  local binary_path="$TARGET_DIR/backend/dist/moments"
  local working_dir="$TARGET_DIR/backend"
  local service_file="/etc/systemd/system/${SERVICE_NAME}.service"

  log "创建 systemd 服务：$SERVICE_NAME"
  run_root tee "$service_file" >/dev/null <<EOF
[Unit]
Description=Moments - 极简朋友圈
After=network.target

[Service]
Type=simple
User=${APP_USER}
Group=${APP_GROUP}
WorkingDirectory=${working_dir}
ExecStart=${binary_path}
Restart=on-failure
RestartSec=5
EnvironmentFile=${working_dir}/.env
StandardOutput=journal
StandardError=journal
SyslogIdentifier=${SERVICE_NAME}

# 安全加固
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=read-only
ReadWritePaths=${working_dir}
PrivateTmp=true

[Install]
WantedBy=multi-user.target
EOF

  run_quiet "重载 systemd 配置" run_root systemctl daemon-reload
  run_quiet "设置开机自启" run_root systemctl enable "$SERVICE_NAME"
}

start_service() {
  local binary_path="$TARGET_DIR/backend/dist/moments"
  [ -x "$binary_path" ] || [ -f "$binary_path" ] || fail "Go 后端构建产物不存在：$binary_path"

  if systemctl is-active --quiet "$SERVICE_NAME" 2>/dev/null; then
    log "检测到旧服务正在运行，重启"
    run_quiet "重启服务" run_root systemctl restart "$SERVICE_NAME"
  else
    run_quiet "启动服务" run_root systemctl start "$SERVICE_NAME"
  fi
}

# ─────────────────────────────────────────────────────────────
# 健康检查
# ─────────────────────────────────────────────────────────────
health_check() {
  local url="$1" attempts=30
  log "等待服务响应：$url"
  while [ "$attempts" -gt 0 ]; do
    if curl -fsS --max-time 3 "$url" >/dev/null 2>&1; then
      log "健康检查通过"
      return
    fi
    attempts=$((attempts - 1))
    if [ $((attempts % 5)) -eq 0 ]; then
      log "服务仍在启动，剩余等待：${attempts}s"
    fi
    sleep 1
  done
  printf '\n%s[%s] [ERROR]%s  服务诊断：\n' "$C_RED" "$(date '+%H:%M:%S')" "$C_RESET" >&2
  run_root systemctl status "$SERVICE_NAME" --no-pager -l >&2 || true
  printf '%s[%s] [ERROR]%s  最近 40 行日志：\n' "$C_RED" "$(date '+%H:%M:%S')" "$C_RESET" >&2
  run_root journalctl -u "$SERVICE_NAME" -n 40 --no-pager >&2 || true
  fail "健康检查失败：$url"
}

# ─────────────────────────────────────────────────────────────
# 防火墙检测与放行
# ─────────────────────────────────────────────────────────────
is_public_bind_host() {
  case "$1" in
    127.*|localhost|::1) return 1 ;;
    *) return 0 ;;
  esac
}

port_is_listening() {
  command -v ss >/dev/null 2>&1 || return 2
  ss -H -ltn "sport = :$1" 2>/dev/null | awk 'NF > 0 { found = 1 } END { exit !found }'
}

detect_firewall_backend() {
  local ufw_output firewalld_state nft_rules iptables_rules
  FIREWALL_BACKEND="none"

  if command -v ufw >/dev/null 2>&1; then
    ufw_output="$(run_root ufw status 2>/dev/null || true)"
    if printf '%s\n' "$ufw_output" | grep -Eqi '^Status:[[:space:]]+active'; then
      FIREWALL_BACKEND="ufw"
      return 0
    fi
  fi

  if command -v firewall-cmd >/dev/null 2>&1; then
    firewalld_state="$(run_root firewall-cmd --state 2>/dev/null || true)"
    if [ "$firewalld_state" = "running" ]; then
      FIREWALL_BACKEND="firewalld"
      return 0
    fi
  fi

  if command -v nft >/dev/null 2>&1; then
    nft_rules="$(run_root nft list ruleset 2>/dev/null || true)"
    if [ -n "$nft_rules" ]; then
      FIREWALL_BACKEND="nftables"
      return 0
    fi
  fi

  if command -v iptables >/dev/null 2>&1; then
    iptables_rules="$(run_root iptables -S 2>/dev/null || true)"
    if printf '%s\n' "$iptables_rules" | grep -Eq -- '^-P (INPUT|FORWARD) (DROP|REJECT)|--dport'; then
      FIREWALL_BACKEND="iptables"
      return 0
    fi
  fi
}

firewall_port_allowed() {
  local port="$1" ufw_output
  case "$FIREWALL_BACKEND" in
    ufw)
      ufw_output="$(run_root ufw status verbose 2>/dev/null || true)"
      printf '%s\n' "$ufw_output" | grep -Eqi "(^|[[:space:]])${port}/tcp([[:space:]]|$).*ALLOW" && return 0
      printf '%s\n' "$ufw_output" | grep -Eqi 'Default:[[:space:]]+allow[[:space:]]+\(incoming\)' && return 0
      return 1
      ;;
    firewalld)
      run_root firewall-cmd --quiet --query-port="${port}/tcp" >/dev/null 2>&1
      ;;
    *) return 1 ;;
  esac
}

should_auto_open_port() {
  local port="$1"
  case "$AUTO_OPEN_PORTS" in
    true) return 0 ;;
    false) return 1 ;;
  esac
  [ "$AUTO_APPROVE" -eq 1 ] && return 0
  interactive_enabled || return 1
  ask_yes_no "检测到 TCP ${port} 未在本机防火墙中明确放行，自动添加放行规则" no
}

open_firewall_port() {
  local port="$1"
  case "$FIREWALL_BACKEND" in
    ufw)
      run_quiet --allow-failure "UFW 放行 TCP ${port}" run_root ufw allow "${port}/tcp"
      ;;
    firewalld)
      run_quiet --allow-failure "firewalld 永久放行 TCP ${port}" run_root firewall-cmd --permanent --add-port="${port}/tcp" || return 1
      run_quiet --allow-failure "重新加载 firewalld 规则" run_root firewall-cmd --reload
      ;;
    *) return 1 ;;
  esac
}

check_port_and_firewall() {
  detect_firewall_backend
  log "本机防火墙检测结果：${FIREWALL_BACKEND}"

  local host="$SERVICE_HOST" port="$SERVICE_PORT" status=""

  if ! command -v ss >/dev/null 2>&1; then
    status="无法检测监听状态（缺少 ss）"
    log_warn "端口 ${host}:${port} 无法检测监听状态；请手动执行 ss -ltn 检查"
    PORT_STATUS="$status"
    return 0
  fi

  if ! port_is_listening "$port"; then
    status="未监听"
    log_warn "${host}:${port} 未检测到服务监听，端口不会对外可用"
    PORT_STATUS="$status"
    return 0
  fi

  if ! is_public_bind_host "$host"; then
    status="已监听（仅本机）"
    log "${host}:${port} 已监听；该地址不需要公网防火墙放行"
    PORT_STATUS="$status"
    return 0
  fi

  PUBLIC_PORT_COUNT=$((PUBLIC_PORT_COUNT + 1))
  case "$FIREWALL_BACKEND" in
    ufw|firewalld)
      if firewall_port_allowed "$port"; then
        status="已监听，${FIREWALL_BACKEND} 已放行"
      else
        log_warn "${host}:${port} 已监听，但本机 ${FIREWALL_BACKEND} 未找到明确的 TCP 放行规则"
        if should_auto_open_port "$port"; then
          if open_firewall_port "$port" && firewall_port_allowed "$port"; then
            status="已监听，${FIREWALL_BACKEND} 已自动放行"
            log "TCP ${port} 已由 ${FIREWALL_BACKEND} 自动放行"
          else
            status="已监听，自动放行失败"
            log_warn "TCP ${port} 自动放行失败；请查看安装日志：$INSTALL_LOG"
          fi
        else
          status="已监听，${FIREWALL_BACKEND} 未放行"
          log_warn "请在宝塔面板或本机 ${FIREWALL_BACKEND} 放行 TCP ${port}"
        fi
      fi
      ;;
    nftables|iptables)
      status="已监听，检测到 ${FIREWALL_BACKEND}（未自动修改）"
      log_warn "检测到 ${FIREWALL_BACKEND} 规则，脚本不会自动修改复杂规则；请手动放行 TCP ${port}"
      ;;
    *)
      status="已监听，未检测到启用的本机防火墙"
      log "未检测到启用的 UFW/firewalld，暂不修改本机防火墙"
      ;;
  esac
  log_warn "云厂商安全组/宝塔面板防火墙无法由脚本确认；如外网仍无法访问，请放行 TCP ${port}"
  PORT_STATUS="$status"
}

# ─────────────────────────────────────────────────────────────
# 部署完成输出
# ─────────────────────────────────────────────────────────────
print_summary() {
  printf '\n%s============================================================%s\n' "$C_GREEN" "$C_RESET"
  printf '%s  首次部署完成%s\n' "$C_BOLD" "$C_RESET"
  printf '%s============================================================%s\n' "$C_GREEN" "$C_RESET"
  printf '  %-14s %s\n' '项目目录' "$TARGET_DIR"
  printf '  %-14s %s\n' '服务器 IP' "$SERVER_IP"
  printf '  %-14s %s\n' '访问地址' "$SITE_URL"
  printf '  %-14s %s:%s\n' '监听地址' "$SERVICE_HOST" "$SERVICE_PORT"
  printf '  %-14s %s\n' '端口状态' "$PORT_STATUS"
  if [ "$PUBLIC_PORT_COUNT" -gt 0 ]; then
    printf '  %-14s 请在云平台/宝塔安全组确认 TCP %s 已放行（脚本无法远程确认）\n' '云安全组' "$SERVICE_PORT"
  fi
  printf '  %-14s Go 单二进制（embed 前端静态文件）\n' '运行模式'
  printf '  %-14s %s（systemd）\n' '服务名称' "$SERVICE_NAME"
  printf '  %-14s %s:%s\n' '运行用户' "$APP_USER" "$APP_GROUP"
  printf '\n%s  常用命令：%s\n' "$C_BOLD" "$C_RESET"
  printf '    查看状态：systemctl status %s\n' "$SERVICE_NAME"
  printf '    查看日志：journalctl -u %s -f\n' "$SERVICE_NAME"
  printf '    重启服务：systemctl restart %s\n' "$SERVICE_NAME"
  printf '    停止服务：systemctl stop %s\n' "$SERVICE_NAME"
  printf '\n%s  反向代理（Nginx/Caddy）未由本脚本配置。%s\n\n' "$C_DIM" "$C_RESET"
}

# ─────────────────────────────────────────────────────────────
# 主流程
# ─────────────────────────────────────────────────────────────
main() {
  parse_args "$@"
  normalize_auto_open_ports
  configure_log_level
  print_banner

  step_begin "检查操作系统与运行权限"
  [ "$(uname -s)" = "Linux" ] || fail "此单文件首次部署脚本面向 Linux 服务器"
  prepare_privilege
  log "CPU 架构：$(uname -m)"
  log "目标目录：$TARGET_DIR"
  log_debug "当前时间：$(date '+%Y-%m-%d %H:%M:%S %Z')"
  prepare_interactive_configuration
  step_success

  step_begin "安装系统基础依赖"
  install_base_packages
  step_success

  step_begin "准备 Node.js 20+"
  install_node
  step_success

  step_begin "准备 Go 1.23+"
  install_go
  step_success

  step_begin "准备 pnpm"
  install_pnpm
  step_success

  step_begin "拉取或同步项目仓库"
  prepare_repository
  step_success

  step_begin "生成并同步运行环境配置"
  adopt_env_files
  ensure_runtime_env
  load_runtime_port
  step_success

  step_begin "构建前端"
  build_frontend
  step_success

  step_begin "编译 Go 后端"
  build_backend
  step_success

  step_begin "配置并启动 systemd 服务"
  create_systemd_service
  start_service
  step_success

  step_begin "健康检查"
  health_check "http://127.0.0.1:${SERVICE_PORT}/"
  step_success

  step_begin "检查端口与本机防火墙"
  check_port_and_firewall
  step_success

  print_summary
}

main "$@"
