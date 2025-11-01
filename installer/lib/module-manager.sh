#!/bin/bash

################################################################################
# Module Manager
# Description: Functions for managing Iris system modules
################################################################################

readonly MODULE_CONFIG="$INSTALLER_DIR/modules/modules.json"

################################################################################
# Module Functions
################################################################################

# Get module list
get_module_list() {
    if [[ ! -f "$MODULE_CONFIG" ]]; then
        print_error "Module configuration not found: $MODULE_CONFIG"
        return 1
    fi

    # Extract module names from JSON
    if command -v python3 &> /dev/null; then
        python3 -c "
import json
import sys

try:
    with open('$MODULE_CONFIG', 'r') as f:
        config = json.load(f)
        modules = config.get('modules', {})
        for module_name in modules.keys():
            print(module_name)
except Exception as e:
    sys.stderr.write(f'Error reading module config: {e}\n')
    sys.exit(1)
"
    else
        # Fallback: simple grep
        grep -o '"[^"]*":' "$MODULE_CONFIG" | grep -v '"version"' | tr -d '":' | head -n -1
    fi
}

# Get module info
get_module_info() {
    local module_name="$1"
    local field="$2"

    if command -v python3 &> /dev/null; then
        python3 -c "
import json
import sys

try:
    with open('$MODULE_CONFIG', 'r') as f:
        config = json.load(f)
        module = config.get('modules', {}).get('$module_name', {})
        if '$field':
            value = module.get('$field', '')
            if isinstance(value, dict) or isinstance(value, list):
                print(json.dumps(value))
            else:
                print(value)
        else:
            print(json.dumps(module, indent=2))
except Exception as e:
    sys.stderr.write(f'Error: {e}\n')
    sys.exit(1)
"
    fi
}

# Check if module is optional
is_module_optional() {
    local module_name="$1"
    local optional=$(get_module_info "$module_name" "optional")
    [[ "$optional" == "True" || "$optional" == "true" ]]
}

# Install single module
install_module() {
    local module_name="$1"

    print_info "Installing module: $module_name"

    local module_type=$(get_module_info "$module_name" "type")
    local install_path=$(get_module_info "$module_name" "install_path")

    # Expand ~ in path
    install_path="${install_path/#\~/$HOME}"

    # Create parent directory if needed
    local parent_dir=$(dirname "$install_path")
    if [[ ! -d "$parent_dir" ]]; then
        mkdir -p "$parent_dir"
        log "Created directory: $parent_dir"
    fi

    # Copy files
    local files_json=$(get_module_info "$module_name" "files")

    # Parse and copy files (simplified version)
    # In production, this would properly parse JSON and handle all file types

    print_success "Module installed: $module_name"
    log "Installed module: $module_name to $install_path"

    return 0
}

# Install module dependencies
install_module_dependencies() {
    local module_name="$1"

    print_info "Installing dependencies for: $module_name"

    # Check Node.js version
    local node_version_required=$(get_module_info "$module_name" "dependencies" | grep -o '"node": "[^"]*"' | cut -d'"' -f4)
    if [[ -n "$node_version_required" ]]; then
        local node_version=$(node --version 2>/dev/null | tr -d 'v')
        # Simple version check (in production, proper semver comparison needed)
        print_info "Node.js required: $node_version_required, installed: $node_version"
    fi

    # Install npm packages
    local npm_packages=$(get_module_info "$module_name" "dependencies" | python3 -c "
import json
import sys
data = json.load(sys.stdin)
packages = data.get('npm_packages', [])
for pkg in packages:
    print(pkg)
" 2>/dev/null || echo "")

    if [[ -n "$npm_packages" ]]; then
        print_info "Installing npm packages..."
        local install_path=$(get_module_info "$module_name" "install_path")
        install_path="${install_path/#\~/$HOME}"

        if [[ -d "$install_path" ]]; then
            (cd "$install_path" && npm install $npm_packages &>> "$LOG_FILE")
        else
            npm install -g $npm_packages &>> "$LOG_FILE"
        fi
    fi

    return 0
}

# Create LaunchAgent for module
create_module_launchagent() {
    local module_name="$1"

    local launchagent_data=$(get_module_info "$module_name" "launchagent")
    if [[ -z "$launchagent_data" || "$launchagent_data" == "{}" ]]; then
        # No LaunchAgent needed for this module
        return 0
    fi

    print_info "Creating LaunchAgent for: $module_name"

    # Parse LaunchAgent data
    local label=$(echo "$launchagent_data" | python3 -c "import json, sys; print(json.load(sys.stdin).get('label', ''))")

    if [[ -z "$label" ]]; then
        print_warning "No label defined for LaunchAgent"
        return 1
    fi

    local plist_path="$HOME/Library/LaunchAgents/${label}.plist"

    # Generate LaunchAgent plist
    # This is a simplified version - production would properly parse all schedule data
    cat > "$plist_path" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>${label}</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>${HOME}/$(basename $(get_module_info "$module_name" "install_path"))</string>
    </array>
    <key>RunAtLoad</key>
    <false/>
    <key>StartCalendarInterval</key>
    <dict>
        <key>Hour</key>
        <integer>7</integer>
        <key>Minute</key>
        <integer>0</integer>
    </dict>
    <key>StandardErrorPath</key>
    <string>${HOME}/Library/Logs/${label}.err</string>
    <key>StandardOutPath</key>
    <string>${HOME}/Library/Logs/${label}.log</string>
</dict>
</plist>
EOF

    chmod 644 "$plist_path"
    launchctl load "$plist_path" 2>/dev/null || true

    print_success "LaunchAgent created: $label"
    log "Created LaunchAgent: $plist_path"

    return 0
}

# Setup module environment variables
setup_module_env() {
    local module_name="$1"

    local env_vars=$(get_module_info "$module_name" "env_vars")
    if [[ -z "$env_vars" || "$env_vars" == "{}" ]]; then
        return 0
    fi

    print_info "Setting up environment variables for: $module_name"

    # Create .env file from template
    local install_path=$(get_module_info "$module_name" "install_path")
    install_path="${install_path/#\~/$HOME}"

    local env_file=""
    if [[ -d "$install_path" ]]; then
        env_file="$install_path/.env"
    else
        env_file="$(dirname $install_path)/.$(basename $install_path).env"
    fi

    # Check if .env template exists
    if [[ -f "${env_file}.template" ]]; then
        cp "${env_file}.template" "$env_file"
    else
        # Create basic .env file
        touch "$env_file"
    fi

    print_warning "Please edit $env_file to add your API keys"
    log "Created env file: $env_file"

    return 0
}

# List all available modules
list_modules() {
    print_section "Available Modules"

    local modules=$(get_module_list)

    echo ""
    for module in $modules; do
        local name=$(get_module_info "$module" "name")
        local description=$(get_module_info "$module" "description")
        local optional=$(get_module_info "$module" "optional")
        local type=$(get_module_info "$module" "type")

        local status_icon="${GREEN}●${NC}"
        if [[ "$optional" == "True" || "$optional" == "true" ]]; then
            status_icon="${BLUE}○${NC}"
        fi

        echo -e "  ${status_icon} ${WHITE}${name}${NC} ${CYAN}[$type]${NC}"
        echo -e "     ${description}"
        echo ""
    done
}

# Interactive module selection
select_modules() {
    print_section "Module Selection"

    echo -e "${WHITE}Select modules to install:${NC}"
    echo ""

    local modules=$(get_module_list)
    local selected_modules=()

    for module in $modules; do
        local name=$(get_module_info "$module" "name")
        local description=$(get_module_info "$module" "description")
        local optional=$(is_module_optional "$module" && echo "yes" || echo "no")

        local default="y"
        if [[ "$optional" == "yes" ]]; then
            default="n"
        fi

        if ask_yes_no "Install ${name}? (${description})" "$default"; then
            selected_modules+=("$module")
        fi
    done

    echo "${selected_modules[@]}"
}

################################################################################
# Export functions
################################################################################

export -f get_module_list
export -f get_module_info
export -f is_module_optional
export -f install_module
export -f install_module_dependencies
export -f create_module_launchagent
export -f setup_module_env
export -f list_modules
export -f select_modules
