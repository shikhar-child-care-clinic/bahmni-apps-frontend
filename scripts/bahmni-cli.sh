#!/bin/bash

# =============================================================================
# Bahmni Apps Frontend - Developer CLI
# =============================================================================

# ---------------------------------------------------------------------------
# CONFIGURABLE PATHS - overridden by .bahmni-cli.conf if present
# ---------------------------------------------------------------------------
STANDARD_CONFIG_PATH="<ADD PATH HERE>"  # e.g. "../standard-config"
BAHMNI_DOCKER_PATH="<ADD PATH HERE>"    # e.g. "../bahmni-docker"

# Load user-specific path overrides (auto-created on first custom path entry)
CLI_CONF_FILE=".bahmni-cli.conf"
if [ -f "$CLI_CONF_FILE" ]; then
  source "$CLI_CONF_FILE"
fi

# ---------------------------------------------------------------------------
# ANSI Color codes
# ---------------------------------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
RESET='\033[0m'

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
info()    { echo -e "${CYAN}[INFO]${RESET}  $*"; }
success() { echo -e "${GREEN}[OK]${RESET}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${RESET}  $*"; }
error()   { echo -e "${RED}[ERROR]${RESET} $*"; }

elapsed() {
  local seconds=$1
  local mins=$(( seconds / 60 ))
  local secs=$(( seconds % 60 ))
  if [ "$mins" -gt 0 ]; then
    echo "${mins}m ${secs}s"
  else
    echo "${secs}s"
  fi
}

run_timed() {
  # Usage: run_timed "description" command [args...]
  local desc="$1"; shift
  info "Starting: ${desc}"
  local start
  start=$(date +%s)
  "$@"
  local status=$?
  local end
  end=$(date +%s)
  local took
  took=$(elapsed $(( end - start )))
  if [ $status -eq 0 ]; then
    success "Done: ${desc} (took ${took})"
  else
    error "Failed: ${desc} (took ${took})"
  fi
  return $status
}

pause() {
  echo ""
  echo -e "${YELLOW}Press Enter to return to the menu...${RESET}"
  read -r
}

# ---------------------------------------------------------------------------
# ASCII art header
# ---------------------------------------------------------------------------
print_header() {
  clear
  echo -e "${CYAN}${BOLD}"
  echo "  ██████╗  █████╗ ██╗  ██╗███╗   ███╗███╗   ██╗██╗"
  echo "  ██╔══██╗██╔══██╗██║  ██║████╗ ████║████╗  ██║██║"
  echo "  ██████╔╝███████║███████║██╔████╔██║██╔██╗ ██║██║"
  echo "  ██╔══██╗██╔══██║██╔══██║██║╚██╔╝██║██║╚██╗██║██║"
  echo "  ██████╔╝██║  ██║██║  ██║██║ ╚═╝ ██║██║ ╚████║██║"
  echo "  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝  ╚═══╝╚═╝"
  echo -e "${RESET}"
  echo -e "${MAGENTA}${BOLD}  ╔══════════════════════════════════════════╗${RESET}"
  echo -e "${MAGENTA}${BOLD}  ║      Apps Frontend Developer CLI         ║${RESET}"
  echo -e "${MAGENTA}${BOLD}  ╚══════════════════════════════════════════╝${RESET}"
  echo ""
}

# ---------------------------------------------------------------------------
# Validate that a configurable path exists; prompt with retry if not found
# ---------------------------------------------------------------------------
save_path_to_conf() {
  local var_name="$1"
  local value="$2"
  # Update or add the variable in .bahmni-cli.conf
  if [ -f "$CLI_CONF_FILE" ] && grep -q "^${var_name}=" "$CLI_CONF_FILE"; then
    # Update existing entry
    sed -i '' "s|^${var_name}=.*|${var_name}=\"${value}\"|" "$CLI_CONF_FILE"
  else
    echo "${var_name}=\"${value}\"" >> "$CLI_CONF_FILE"
  fi
}

validate_path() {
  local label="$1"
  local var_name="$2"  # variable name: STANDARD_CONFIG_PATH or BAHMNI_DOCKER_PATH
  local path="${!var_name}"

  if [ -d "$path" ]; then
    return 0
  fi

  warn "Path not found for ${label}: '${path}'"

  while true; do
    read -rp "Enter the correct path for ${label} (or 'q' to cancel): " new_path

    if [ "$new_path" = "q" ] || [ "$new_path" = "Q" ]; then
      error "Cancelled. Cannot proceed without a valid path."
      return 1
    fi

    if [ -z "$new_path" ]; then
      warn "Path cannot be empty. Try again or enter 'q' to cancel."
      continue
    fi

    if [ ! -d "$new_path" ]; then
      warn "Path does not exist: '${new_path}'. Try again or enter 'q' to cancel."
      continue
    fi

    # Valid path found - update variable and save permanently
    eval "$var_name=\"$new_path\""
    save_path_to_conf "$var_name" "$new_path"
    success "Path saved: ${var_name}=${new_path}"
    info "Saved to ${CLI_CONF_FILE} (will persist across sessions)."
    return 0
  done
}

# ---------------------------------------------------------------------------
# 1. Build and Serve
# ---------------------------------------------------------------------------
cmd_build_and_serve() {
  echo -e "\n${BOLD}=== Build and Serve ===${RESET}\n"
  (
    set -e
    run_timed "yarn install" yarn install
    run_timed "yarn build"   yarn build
    info "Starting dev server (Ctrl+C to stop)..."
    yarn dev
  )
  local status=$?
  [ $status -ne 0 ] && error "Build and Serve encountered an error (exit code ${status})."
  pause
}

# ---------------------------------------------------------------------------
# 2. Run Tests
# ---------------------------------------------------------------------------
cmd_test() {
  echo -e "\n${BOLD}=== Run Tests ===${RESET}\n"
  echo -e "  ${CYAN}1)${RESET} All"
  echo -e "  ${CYAN}2)${RESET} Clinical"
  echo -e "  ${CYAN}3)${RESET} Registration"
  echo -e "  ${CYAN}0)${RESET} Back"
  echo ""
  read -rp "Choose an option: " sub
  case "$sub" in
    1)
      run_timed "All tests" yarn test
      ;;
    2)
      run_timed "Clinical tests" npx nx test @bahmni/clinical-app
      ;;
    3)
      run_timed "Registration tests" npx nx test @bahmni/registration-app
      ;;
    0)
      return
      ;;
    *)
      warn "Invalid option: ${sub}"
      ;;
  esac
  pause
}

# ---------------------------------------------------------------------------
# 3. Clean Build and Serve
# ---------------------------------------------------------------------------
cmd_clean_build() {
  echo -e "\n${BOLD}=== Clean Build and Serve ===${RESET}\n"
  warn "This will delete node_modules and dist directories."
  read -rp "Are you sure? (y/N): " confirm
  if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
    info "Cancelled."
    pause
    return
  fi
  (
    set -e
    run_timed "Remove node_modules and dist" rm -rf node_modules dist
    run_timed "Reset Nx cache"               npx nx reset
    run_timed "Clean yarn cache"             yarn cache clean
    run_timed "yarn install"                 yarn install
    run_timed "yarn build"                   yarn build
    info "Starting dev server (Ctrl+C to stop)..."
    yarn dev
  )
  local status=$?
  if [ $status -ne 0 ]; then
    error "Clean build and serve failed (exit code ${status})."
  fi
  pause
}

# ---------------------------------------------------------------------------
# 4. Update Standard Config
# ---------------------------------------------------------------------------
_do_update_standard_config() {
  echo -e "\n${BOLD}=== Update Standard Config ===${RESET}\n"

  validate_path "Standard Config" "STANDARD_CONFIG_PATH" || return 1

  (
    set -e
    cd "$STANDARD_CONFIG_PATH"

    local current_branch
    current_branch=$(git rev-parse --abbrev-ref HEAD)
    info "Current branch in standard-config: ${current_branch}"

    # Stash local changes (if any)
    local stash_output
    stash_output=$(git stash 2>&1)
    local stashed=false
    if echo "$stash_output" | grep -q "No local changes to save"; then
      info "No local changes to stash."
    else
      info "Stashed local changes."
      stashed=true
    fi

    # Detect default branch (master or main)
    local default_branch
    default_branch=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@')
    if [ -z "$default_branch" ]; then
      # Fallback: check if master or main exists
      if git show-ref --verify --quiet refs/heads/master; then
        default_branch="master"
      else
        default_branch="main"
      fi
    fi
    info "Default branch: ${default_branch}"

    # Switch to default branch if not already on it
    if [ "$current_branch" != "$default_branch" ]; then
      info "Switching to ${default_branch}..."
      git checkout "$default_branch"
    else
      info "Already on ${default_branch}."
    fi

    # Pull latest
    run_timed "git pull (standard-config ${default_branch})" git pull

    # Switch back to original branch
    if [ "$current_branch" != "$default_branch" ]; then
      info "Switching back to ${current_branch}..."
      git checkout "$current_branch"
    fi

    # Restore stashed changes
    if [ "$stashed" = true ]; then
      local pop_output
      pop_output=$(git stash pop 2>&1)
      if echo "$pop_output" | grep -qi "conflict\|error"; then
        warn "git stash pop reported issues - please review manually:"
        echo "$pop_output"
      else
        info "Stash restored successfully."
      fi
    fi
  )
  local status=$?
  if [ $status -eq 0 ]; then
    success "Standard config updated."
  else
    error "Standard config update failed (exit code ${status})."
  fi
  return $status
}

cmd_update_standard_config() {
  _do_update_standard_config
  pause
}

# ---------------------------------------------------------------------------
# 5. Update Docker Images
# ---------------------------------------------------------------------------
_do_update_docker_images() {
  echo -e "\n${BOLD}=== Update Docker Images ===${RESET}\n"

  if ! command -v docker &>/dev/null; then
    error "Docker is not installed or not in PATH."
    return 1
  fi

  validate_path "Bahmni Docker" "BAHMNI_DOCKER_PATH" || return 1
  local compose_dir="${BAHMNI_DOCKER_PATH}/bahmni-standard"
  if [ ! -d "$compose_dir" ]; then
    error "bahmni-standard directory not found inside ${BAHMNI_DOCKER_PATH}"
    return 1
  fi

  (
    set -e
    cd "$compose_dir"
    run_timed "docker compose pull" docker compose --env-file .env.dev pull
    run_timed "docker compose up"   docker compose --env-file .env.dev up -d
  )
  local status=$?
  if [ $status -eq 0 ]; then
    success "Docker images pulled and services started."
  else
    error "Docker update failed (exit code ${status})."
  fi
  return $status
}

cmd_update_docker_images() {
  _do_update_docker_images
  pause
}

# ---------------------------------------------------------------------------
# 6. Update All
# ---------------------------------------------------------------------------
cmd_update_all() {
  echo -e "\n${BOLD}=== Update All (Standard Config + Docker Images) ===${RESET}\n"
  _do_update_standard_config
  _do_update_docker_images
  echo ""
  success "Update All complete."
  pause
}

# ---------------------------------------------------------------------------
# 7. Coverage Reports
# ---------------------------------------------------------------------------
cmd_coverage() {
  echo -e "\n${BOLD}=== Coverage Reports ===${RESET}\n"
  echo -e "  ${CYAN}1)${RESET} All"
  echo -e "  ${CYAN}2)${RESET} Clinical"
  echo -e "  ${CYAN}3)${RESET} Registration"
  echo -e "  ${CYAN}0)${RESET} Back"
  echo ""
  read -rp "Choose an option: " sub
  case "$sub" in
    1)
      run_timed "All coverage" yarn test:coverage
      ;;
    2)
      run_timed "Clinical coverage" npx nx test @bahmni/clinical-app --coverage
      ;;
    3)
      run_timed "Registration coverage" npx nx test @bahmni/registration-app --coverage
      ;;
    0)
      return
      ;;
    *)
      warn "Invalid option: ${sub}"
      ;;
  esac
  pause
}

# ---------------------------------------------------------------------------
# 8. Lint Check
# ---------------------------------------------------------------------------
cmd_lint() {
  echo -e "\n${BOLD}=== Lint Check ===${RESET}\n"
  echo -e "  ${CYAN}1)${RESET} All"
  echo -e "  ${CYAN}2)${RESET} Clinical"
  echo -e "  ${CYAN}3)${RESET} Registration"
  echo -e "  ${CYAN}0)${RESET} Back"
  echo ""
  read -rp "Choose an option: " sub
  case "$sub" in
    1)
      run_timed "All lint" yarn lint
      ;;
    2)
      run_timed "Clinical lint" npx nx lint @bahmni/clinical-app
      ;;
    3)
      run_timed "Registration lint" npx nx lint @bahmni/registration-app
      ;;
    0)
      return
      ;;
    *)
      warn "Invalid option: ${sub}"
      ;;
  esac
  pause
}

# ---------------------------------------------------------------------------
# Main menu loop
# ---------------------------------------------------------------------------
main_menu() {
  while true; do
    print_header
    echo -e "  ${BOLD}Main Menu${RESET}"
    echo ""
    echo -e "  ${CYAN}1)${RESET} Build and Serve"
    echo -e "  ${CYAN}2)${RESET} Clean Build and Serve"
    echo -e "  ${CYAN}3)${RESET} Update Standard Config"
    echo -e "  ${CYAN}4)${RESET} Update Docker Images"
    echo -e "  ${CYAN}5)${RESET} Update All (Standard Config + Docker)"
    echo -e "  ${CYAN}6)${RESET} Run Tests"
    echo -e "  ${CYAN}7)${RESET} Coverage Reports"
    echo -e "  ${CYAN}8)${RESET} Lint Check"
    echo -e "  ${CYAN}0)${RESET} Exit"
    echo ""
    read -rp "Choose an option: " choice
    case "$choice" in
      1) cmd_build_and_serve    ;;
      2) cmd_clean_build        ;;
      3) cmd_update_standard_config ;;
      4) cmd_update_docker_images   ;;
      5) cmd_update_all         ;;
      6) cmd_test               ;;
      7) cmd_coverage           ;;
      8) cmd_lint               ;;
      0)
        echo -e "\n${GREEN}Goodbye!${RESET}\n"
        exit 0
        ;;
      *)
        warn "Invalid option: '${choice}'. Please choose a number from the menu."
        sleep 1
        ;;
    esac
  done
}

# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
main_menu
