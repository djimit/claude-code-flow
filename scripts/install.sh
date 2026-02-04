#!/bin/bash
# Claude Flow Installation Script
# Usage: curl -fsSL https://cdn.jsdelivr.net/gh/ruvnet/claude-flow@main/scripts/install.sh | bash
# Version: 2.5.0

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logging functions
info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Banner
echo -e "${CYAN}"
cat << "EOF"
   _____ _                 _        ______ _
  / ____| |               | |      |  ____| |
 | |    | | __ _ _   _  __| | ___  | |__  | | _____      __
 | |    | |/ _` | | | |/ _` |/ _ \ |  __| | |/ _ \ \ /\ / /
 | |____| | (_| | |_| | (_| |  __/ | |    | | (_) \ V  V /
  \_____|_|\__,_|\__,_|\__,_|\___| |_|    |_|\___/ \_/\_/

  Enterprise AI Agent Orchestration Framework v2.5.0
EOF
echo -e "${NC}"

# Detect OS and architecture
OS="$(uname -s)"
ARCH="$(uname -m)"

info "Detected OS: $OS, Architecture: $ARCH"

# Check prerequisites
info "Checking prerequisites..."

# Check for Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        warning "Node.js version should be >= 18.0.0 for best compatibility"
        echo "  Current version: $(node -v)"
    else
        success "Node.js $(node -v) detected"
    fi
else
    error "Node.js is required but not found."
    echo ""
    echo "  Please install Node.js 18+ from: https://nodejs.org/"
    echo "  Or use a version manager like nvm:"
    echo "    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
    echo "    nvm install 20"
    echo ""
    exit 1
fi

# Check for npm
if command -v npm &> /dev/null; then
    success "npm $(npm -v) detected"
else
    error "npm is required but not found."
    exit 1
fi

# Check for Git (optional)
if command -v git &> /dev/null; then
    success "Git $(git --version | cut -d' ' -f3) detected"
else
    warning "Git not found (optional, needed for GitHub integration features)"
fi

# Check for Claude Code CLI (optional)
if command -v claude &> /dev/null; then
    success "Claude Code CLI detected"
    CLAUDE_AVAILABLE=true
else
    warning "Claude Code CLI not found (optional, for plugin features)"
    CLAUDE_AVAILABLE=false
fi

echo ""
info "Installation Options:"
echo ""
echo "  1. Quick install (npm package only)"
echo "  2. Global install (npm global + add to PATH)"
echo "  3. Full install (npm + MCP servers + Claude plugin)"
echo "  4. Development install (clone repo + build from source)"
echo ""

# Auto-detect if running in non-interactive mode
if [ -t 0 ]; then
    read -p "Select installation type (1-4) [1]: " INSTALL_TYPE
    INSTALL_TYPE=${INSTALL_TYPE:-1}
else
    # Non-interactive mode: default to quick install
    info "Non-interactive mode detected, using quick install..."
    INSTALL_TYPE=1
fi

case $INSTALL_TYPE in
    1)
        info "Quick installation..."
        echo ""

        # Install via npx (no global install needed)
        info "Installing claude-flow via npm..."
        npm install -g claude-flow@alpha

        success "Claude Flow installed!"
        echo ""
        echo "  You can now use:"
        echo "    npx claude-flow --help"
        echo "    npx claude-flow --version"
        echo ""
        ;;

    2)
        info "Global installation..."
        echo ""

        # Install globally
        info "Installing claude-flow globally..."
        npm install -g claude-flow@alpha

        # Verify installation
        if command -v claude-flow &> /dev/null; then
            success "Claude Flow installed globally!"
            echo ""
            echo "  Commands available:"
            echo "    claude-flow --help"
            echo "    claude-flow --version"
            echo "    claude-flow sparc modes"
            echo ""
        else
            warning "Global install completed but claude-flow not in PATH"
            echo "  You may need to add npm global bin to your PATH:"
            echo "    export PATH=\"\$(npm prefix -g)/bin:\$PATH\""
            echo ""
        fi
        ;;

    3)
        info "Full installation with MCP servers..."
        echo ""

        # Install main package
        info "Installing claude-flow..."
        npm install -g claude-flow@alpha
        success "claude-flow installed"

        # Setup MCP servers
        if [ "$CLAUDE_AVAILABLE" = true ]; then
            info "Configuring MCP servers for Claude Code..."

            CLAUDE_DIR="${HOME}/.claude"
            SETTINGS_FILE="${CLAUDE_DIR}/settings.json"

            mkdir -p "$CLAUDE_DIR"

            if [ ! -f "$SETTINGS_FILE" ]; then
                cat > "$SETTINGS_FILE" << 'SETTINGS_EOF'
{
  "mcpServers": {
    "claude-flow": {
      "command": "npx",
      "args": ["claude-flow@alpha", "mcp", "start"],
      "description": "Claude Flow MCP server with 40+ orchestration tools"
    }
  }
}
SETTINGS_EOF
                success "Created MCP configuration at $SETTINGS_FILE"
            else
                warning "Settings file already exists at $SETTINGS_FILE"
                echo ""
                echo "  To add claude-flow MCP, add this to your mcpServers:"
                echo ""
                echo '    "claude-flow": {'
                echo '      "command": "npx",'
                echo '      "args": ["claude-flow@alpha", "mcp", "start"]'
                echo '    }'
                echo ""
            fi

            # Optional additional MCP servers
            if [ -t 0 ]; then
                echo ""
                read -p "Install optional ruv-swarm MCP? (y/n) [n]: " INSTALL_RUV
                if [ "$INSTALL_RUV" = "y" ]; then
                    info "Installing ruv-swarm..."
                    npm install -g ruv-swarm || warning "Failed to install ruv-swarm"
                fi

                read -p "Install optional flow-nexus MCP? (y/n) [n]: " INSTALL_NEXUS
                if [ "$INSTALL_NEXUS" = "y" ]; then
                    info "Installing flow-nexus..."
                    npm install -g flow-nexus@latest || warning "Failed to install flow-nexus"
                fi
            fi
        else
            warning "Claude Code CLI not found, skipping MCP configuration"
            echo "  Install Claude Code first, then run:"
            echo "    claude mcp add claude-flow npx claude-flow@alpha mcp start"
            echo ""
        fi

        success "Full installation complete!"
        echo ""
        ;;

    4)
        info "Development installation from source..."
        echo ""

        # Clone repository
        INSTALL_DIR="${HOME}/.claude-flow"

        if [ -d "$INSTALL_DIR" ]; then
            warning "Directory $INSTALL_DIR already exists"
            if [ -t 0 ]; then
                read -p "Remove and reinstall? (y/n) [n]: " REINSTALL
                if [ "$REINSTALL" = "y" ]; then
                    rm -rf "$INSTALL_DIR"
                else
                    error "Installation cancelled"
                    exit 1
                fi
            else
                error "Cannot reinstall in non-interactive mode"
                exit 1
            fi
        fi

        info "Cloning claude-flow repository..."
        git clone https://github.com/ruvnet/claude-flow.git "$INSTALL_DIR"

        cd "$INSTALL_DIR"

        info "Installing dependencies..."
        npm install

        info "Building from source..."
        npm run build

        info "Linking globally..."
        npm link

        success "Development installation complete!"
        echo ""
        echo "  Repository location: $INSTALL_DIR"
        echo "  To update: cd $INSTALL_DIR && git pull && npm run build"
        echo ""
        ;;

    *)
        error "Invalid option: $INSTALL_TYPE"
        exit 1
        ;;
esac

# Final verification
echo ""
info "Verifying installation..."

if command -v claude-flow &> /dev/null; then
    VERSION=$(claude-flow --version 2>/dev/null || echo "unknown")
    success "claude-flow is available (version: $VERSION)"
else
    # Try with npx
    VERSION=$(npx claude-flow@alpha --version 2>/dev/null || echo "unknown")
    if [ "$VERSION" != "unknown" ]; then
        success "claude-flow available via npx (version: $VERSION)"
    else
        warning "Installation may need PATH configuration"
    fi
fi

# Print next steps
echo ""
echo -e "${GREEN}Installation Complete!${NC}"
echo ""
echo "Next steps:"
echo ""
echo "  1. Verify installation:"
echo "     npx claude-flow --version"
echo ""
echo "  2. View available commands:"
echo "     npx claude-flow --help"
echo ""
echo "  3. List SPARC development modes:"
echo "     npx claude-flow sparc modes"
echo ""
echo "  4. Initialize a swarm:"
echo "     npx claude-flow swarm init --topology mesh"
echo ""
echo "  5. Start MCP server:"
echo "     npx claude-flow mcp start"
echo ""
echo "Documentation: https://github.com/ruvnet/claude-flow"
echo ""

success "Claude Flow is ready to use!"
