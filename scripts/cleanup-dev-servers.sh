#!/bin/bash
# Cleanup orphaned dev servers from auto-claude worktrees
#
# Run this when you notice stuck Next.js/Prisma processes from auto-claude sessions.
# Usage: ./scripts/cleanup-dev-servers.sh

set -e

echo "Looking for orphaned auto-claude dev processes..."

# Find processes
PROCS=$(ps aux | grep -E '\.auto-claude/worktrees' | grep -v grep || true)

if [ -z "$PROCS" ]; then
    echo "No orphaned processes found."
    exit 0
fi

echo "Found processes:"
echo "$PROCS"
echo ""

# Kill Next.js servers
echo "Killing Next.js servers..."
pkill -f 'next.*\.auto-claude/worktrees' 2>/dev/null || true

# Kill pnpm processes
echo "Killing pnpm processes..."
pkill -f 'pnpm.*\.auto-claude/worktrees' 2>/dev/null || true

# Kill Prisma studio
echo "Killing Prisma studio..."
pkill -f 'prisma.*\.auto-claude/worktrees' 2>/dev/null || true

# Wait a moment for graceful shutdown
sleep 1

# Force kill any remaining
echo "Force killing any remaining..."
pkill -9 -f '\.auto-claude/worktrees' 2>/dev/null || true

echo ""
echo "Cleanup complete. Verifying..."

REMAINING=$(ps aux | grep -E '\.auto-claude/worktrees' | grep -v grep || true)
if [ -z "$REMAINING" ]; then
    echo "All processes killed successfully."
else
    echo "Warning: Some processes may still be running:"
    echo "$REMAINING"
fi