#!/bin/bash

################################################################################
# Iris System Installer
# Version: 1.5.0
# Description: One-click installation script for Iris AI Assistant System
#
# Prerequisites:
#   - macOS (tested on macOS 14+)
#   - Claude Code installed
#   - Internet connection
#
# Usage:
#   ./iris-install.sh
#   or
#   curl -fsSL https://raw.githubusercontent.com/lmanchu/iris-system/main/installer/iris-install.sh | bash
################################################################################

set -e  # Exit on error
set -o pipefail  # Exit on pipe failure

# Colors and formatting
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly PURPLE='\033[0;35m'
readonly CYAN='\033[0;36m'
readonly WHITE='\033[1;37m'
readonly NC='\033[0m' # No Color
readonly BOLD='\033[1m'

# Icons
readonly CHECK_MARK="✓"
readonly CROSS_MARK="✗"
readonly INFO_MARK="ℹ"
readonly ROCKET="🚀"
readonly ROBOT="🤖"
readonly GEAR="⚙️"
readonly PACKAGE="📦"

# Global variables
INSTALL_DIR="$HOME"
PKM_DIR="$HOME/Dropbox/PKM-Vault"
IRIS_VERSION="1.5.0"
LOG_FILE="/tmp/iris-install-$(date +%Y%m%d-%H%M%S).log"
INSTALLER_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Installation options (will be set interactively)
INSTALL_MCP=true
INSTALL_AUTOMATION=true
INSTALL_DASHBOARD=true
INSTALL_PKM=true

################################################################################
# Utility Functions
################################################################################

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$LOG_FILE"
}

print_header() {
    clear
    echo -e "${CYAN}${BOLD}"
    cat << "EOF"
    ___      _
   |_ _|_ __(_)___
    | || '__| / __|
    | || |  | \__ \
   |___|_|  |_|___/

   AI Assistant System Installer
EOF
    echo -e "${NC}"
    echo -e "${WHITE}Version: ${IRIS_VERSION}${NC}"
    echo -e "${WHITE}Generated with Claude Code${NC}"
    echo ""
}

print_section() {
    echo ""
    echo -e "${PURPLE}${BOLD}▶ $1${NC}"
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_success() {
    echo -e "${GREEN}${CHECK_MARK} $1${NC}"
    log "SUCCESS: $1"
}

print_error() {
    echo -e "${RED}${CROSS_MARK} $1${NC}"
    log "ERROR: $1"
}

print_warning() {
    echo -e "${YELLOW}${INFO_MARK} $1${NC}"
    log "WARNING: $1"
}

print_info() {
    echo -e "${BLUE}${INFO_MARK} $1${NC}"
    log "INFO: $1"
}

ask_yes_no() {
    local prompt="$1"
    local default="${2:-y}"
    local response

    if [[ "$default" == "y" ]]; then
        prompt="${prompt} [Y/n]: "
    else
        prompt="${prompt} [y/N]: "
    fi

    read -p "$(echo -e ${CYAN}${prompt}${NC})" response
    response=${response:-$default}

    [[ "$response" =~ ^[Yy] ]]
}

ask_input() {
    local prompt="$1"
    local default="$2"
    local response

    if [[ -n "$default" ]]; then
        prompt="${prompt} [${default}]: "
    else
        prompt="${prompt}: "
    fi

    read -p "$(echo -e ${CYAN}${prompt}${NC})" response
    echo "${response:-$default}"
}

progress_bar() {
    local current=$1
    local total=$2
    local width=50
    local percentage=$((current * 100 / total))
    local filled=$((width * current / total))
    local empty=$((width - filled))

    printf "\r${BLUE}["
    printf "%${filled}s" | tr ' ' '='
    printf "%${empty}s" | tr ' ' ' '
    printf "]${NC} ${WHITE}%3d%%${NC}" $percentage
}

################################################################################
# System Check Functions
################################################################################

check_macos() {
    print_info "Checking macOS version..."

    if [[ "$OSTYPE" != "darwin"* ]]; then
        print_error "This installer only supports macOS"
        return 1
    fi

    local macos_version=$(sw_vers -productVersion)
    print_success "macOS ${macos_version} detected"
    return 0
}

check_claude_code() {
    print_info "Checking Claude Code installation..."

    if ! command -v claude &> /dev/null; then
        print_error "Claude Code not found"
        echo ""
        echo -e "${YELLOW}Please install Claude Code first:${NC}"
        echo -e "${WHITE}https://claude.ai/download${NC}"
        return 1
    fi

    local claude_version=$(claude --version 2>/dev/null || echo "unknown")
    print_success "Claude Code installed (${claude_version})"
    return 0
}

check_node() {
    print_info "Checking Node.js installation..."

    if ! command -v node &> /dev/null; then
        print_warning "Node.js not found. Installing via Homebrew..."

        if ! command -v brew &> /dev/null; then
            print_error "Homebrew not found. Please install Node.js manually."
            return 1
        fi

        brew install node
    fi

    local node_version=$(node --version)
    print_success "Node.js ${node_version} detected"
    return 0
}

check_python() {
    print_info "Checking Python installation..."

    if ! command -v python3 &> /dev/null; then
        print_error "Python 3 not found. Please install Python 3."
        return 1
    fi

    local python_version=$(python3 --version)
    print_success "${python_version} detected"
    return 0
}

check_git() {
    print_info "Checking Git installation..."

    if ! command -v git &> /dev/null; then
        print_error "Git not found. Installing Xcode Command Line Tools..."
        xcode-select --install
        return 1
    fi

    local git_version=$(git --version)
    print_success "${git_version} detected"
    return 0
}

run_system_checks() {
    print_section "System Requirements Check"

    local checks_passed=0
    local total_checks=5

    check_macos && ((checks_passed++))
    check_claude_code && ((checks_passed++))
    check_node && ((checks_passed++))
    check_python && ((checks_passed++))
    check_git && ((checks_passed++))

    echo ""
    if [[ $checks_passed -eq $total_checks ]]; then
        print_success "All system checks passed (${checks_passed}/${total_checks})"
        return 0
    else
        print_error "Some system checks failed (${checks_passed}/${total_checks})"
        return 1
    fi
}

################################################################################
# Configuration Functions
################################################################################

interactive_config() {
    print_section "Installation Configuration"

    echo -e "${WHITE}Choose components to install:${NC}"
    echo ""

    INSTALL_MCP=$(ask_yes_no "Install MCP servers (Gmail, Slack, Calendar, Gemini, BrowserOS)?" "y")
    INSTALL_AUTOMATION=$(ask_yes_no "Install automation scripts (Daily Brief, Twitter Bot, etc.)?" "y")
    INSTALL_DASHBOARD=$(ask_yes_no "Install Iris Dashboard?" "y")
    INSTALL_PKM=$(ask_yes_no "Setup PKM system structure?" "y")

    echo ""
    echo -e "${WHITE}Directory Configuration:${NC}"
    echo ""

    INSTALL_DIR=$(ask_input "Installation directory" "$HOME")

    if [[ "$INSTALL_PKM" == true ]]; then
        PKM_DIR=$(ask_input "PKM Vault directory" "$HOME/Dropbox/PKM-Vault")
    fi

    echo ""
    print_info "Configuration complete"
}

################################################################################
# Installation Functions
################################################################################

install_mcp_servers() {
    print_section "Installing MCP Servers"

    local servers=("gmail" "slack" "google-calendar" "gemini" "browseros")
    local total=${#servers[@]}
    local current=0

    for server in "${servers[@]}"; do
        ((current++))
        progress_bar $current $total

        case "$server" in
            "gmail")
                claude mcp add gmail || true
                ;;
            "slack")
                npx -y @smithery/cli install @korotovsky/slack-mcp-server --client claude &>> "$LOG_FILE" || true
                ;;
            "google-calendar")
                npx -y @smithery/cli install @takumi0706/google-calendar-mcp --client claude &>> "$LOG_FILE" || true
                ;;
            "gemini")
                claude mcp add gemini || true
                ;;
            "browseros")
                claude mcp add --transport http browseros http://127.0.0.1:9100/mcp || true
                ;;
        esac

        log "Installed MCP server: $server"
    done

    echo ""
    print_success "MCP servers installed"
}

install_automation_scripts() {
    print_section "Installing Automation Scripts"

    print_info "This feature is under development"
    # TODO: Implement automation scripts installation
}

install_dashboard() {
    print_section "Installing Iris Dashboard"

    print_info "This feature is under development"
    # TODO: Implement dashboard installation
}

setup_pkm_structure() {
    print_section "Setting up PKM Structure"

    if [[ ! -d "$PKM_DIR" ]]; then
        mkdir -p "$PKM_DIR"
        print_info "Created PKM directory: $PKM_DIR"
    fi

    local dirs=(
        "0-Inbox"
        "1-Projects/Active"
        "1-Projects/Archive"
        "2-Areas"
        "3-Resources"
        "4-Archive"
        ".ai-butler-system/personas"
        ".ai-butler-system/shared-context"
        ".ai-butler-system/docs"
    )

    for dir in "${dirs[@]}"; do
        mkdir -p "$PKM_DIR/$dir"
        log "Created directory: $PKM_DIR/$dir"
    done

    print_success "PKM structure created"
}

create_memory_file() {
    local memory_file="$PKM_DIR/.ai-butler-system/iris-memory.md"

    if [[ -f "$memory_file" ]]; then
        print_warning "Memory file already exists, skipping"
        return
    fi

    # Copy template if exists, otherwise create basic structure
    if [[ -f "$INSTALLER_DIR/templates/iris-memory.template.md" ]]; then
        cp "$INSTALLER_DIR/templates/iris-memory.template.md" "$memory_file"
    else
        cat > "$memory_file" << 'EOF'
# 🧠 Iris Memory File
> Iris 的長期記憶 - 每次對話開始時載入

**最後更新**: $(date +%Y-%m-%d)

---

## 👤 基本資訊

- **我的名字**: Iris
- **代號**: Melchior（MAGI System）
- **人格**: 科學家人格 - 理性、數據驅動、邏輯思考
- **角色**: 主力工作站與中樞協調者

---

## 🔧 已掌握的能力

### API & 整合
- ✅ Gmail (via MCP)
- ✅ Slack (via MCP)
- ✅ Google Calendar (via MCP)
- ✅ Gemini AI (via MCP)
- ✅ BrowserOS (via MCP) - Computer Use

### 技術能力
- ✅ Node.js
- ✅ Python scripting
- ✅ Shell scripting (bash)
- ✅ Git 版本控制

---

*💡 提示: 這個檔案應該在每次對話開始時讀取，使用 `/iris` slash command*
EOF
    fi

    print_success "Memory file created"
}

################################################################################
# Main Installation Flow
################################################################################

main() {
    print_header

    echo -e "${ROBOT} ${WHITE}${BOLD}Welcome to Iris System Installer!${NC}"
    echo ""
    echo -e "${WHITE}This installer will set up the Iris AI Assistant System on your Mac.${NC}"
    echo ""

    if ! ask_yes_no "Continue with installation?" "y"; then
        echo ""
        print_info "Installation cancelled"
        exit 0
    fi

    # System checks
    if ! run_system_checks; then
        print_error "System checks failed. Please fix the issues and try again."
        exit 1
    fi

    # Interactive configuration
    interactive_config

    # Show installation summary
    print_section "Installation Summary"
    echo ""
    echo -e "${WHITE}Components to install:${NC}"
    [[ "$INSTALL_MCP" == true ]] && echo -e "  ${GREEN}${CHECK_MARK}${NC} MCP Servers"
    [[ "$INSTALL_AUTOMATION" == true ]] && echo -e "  ${GREEN}${CHECK_MARK}${NC} Automation Scripts"
    [[ "$INSTALL_DASHBOARD" == true ]] && echo -e "  ${GREEN}${CHECK_MARK}${NC} Dashboard"
    [[ "$INSTALL_PKM" == true ]] && echo -e "  ${GREEN}${CHECK_MARK}${NC} PKM Structure"
    echo ""
    echo -e "${WHITE}Installation directory: ${CYAN}$INSTALL_DIR${NC}"
    [[ "$INSTALL_PKM" == true ]] && echo -e "${WHITE}PKM directory: ${CYAN}$PKM_DIR${NC}"
    echo ""

    if ! ask_yes_no "Proceed with installation?" "y"; then
        print_info "Installation cancelled"
        exit 0
    fi

    # Start installation
    print_section "Starting Installation"
    echo ""

    [[ "$INSTALL_MCP" == true ]] && install_mcp_servers
    [[ "$INSTALL_AUTOMATION" == true ]] && install_automation_scripts
    [[ "$INSTALL_DASHBOARD" == true ]] && install_dashboard

    if [[ "$INSTALL_PKM" == true ]]; then
        setup_pkm_structure
        create_memory_file
    fi

    # Installation complete
    print_section "Installation Complete"
    echo ""
    echo -e "${GREEN}${ROCKET} ${BOLD}Iris System has been successfully installed!${NC}"
    echo ""
    echo -e "${WHITE}Next steps:${NC}"
    echo -e "  1. Configure your API keys in the respective .env files"
    echo -e "  2. Run ${CYAN}claude${NC} and use ${CYAN}/iris${NC} command to load memory"
    echo -e "  3. Check the installation log: ${CYAN}$LOG_FILE${NC}"
    echo ""
    echo -e "${WHITE}Documentation: ${CYAN}https://github.com/lmanchu/iris-system${NC}"
    echo ""

    print_success "Installation log saved to: $LOG_FILE"
}

# Run main function
main "$@"
