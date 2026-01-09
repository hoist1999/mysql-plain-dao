#!/bin/sh
#
# Install Git hooks
#

HOOKS_DIR=".git/hooks"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Create hooks directory if it doesn't exist
mkdir -p "$HOOKS_DIR"

# Copy pre-push hook
if [ -f "$SCRIPT_DIR/pre-push" ]; then
  cp "$SCRIPT_DIR/pre-push" "$HOOKS_DIR/pre-push"
  chmod +x "$HOOKS_DIR/pre-push"
  echo "✅ Pre-push hook installed successfully"
else
  echo "❌ Error: pre-push hook not found in scripts directory"
  exit 1
fi
