#!/bin/bash
# Cleanup orphaned dev servers from auto-claude worktrees
#
# Run this when you notice stuck Next.js/Prisma processes from auto-claude sessions.
# Usage: ./scripts/cleanup-dev-servers.sh

set -e

echo "Looking for orphaned auto-claude dev processes..."

# Function to find processes running from worktree directories
# Checks both command line args AND working directory
find_worktree_processes() {
    local pids_to_kill=()

    # Method 1: Find by command line args (catches most processes)
    while IFS= read -r pid; do
        [ -n "$pid" ] && pids_to_kill+=("$pid")
    done < <(pgrep -f '\.auto-claude/worktrees' 2>/dev/null || true)

    # Method 2: Find by working directory (catches next-server, etc.)
    # Check common dev server processes
    for proc_name in next-server node pnpm prisma; do
        while IFS= read -r pid; do
            [ -z "$pid" ] && continue
            cwd=$(readlink "/proc/$pid/cwd" 2>/dev/null || true)
            if [[ "$cwd" == *".auto-claude/worktrees"* ]]; then
                pids_to_kill+=("$pid")
            fi
        done < <(pgrep -f "$proc_name" 2>/dev/null || true)
    done

    # Deduplicate and output
    printf '%s\n' "${pids_to_kill[@]}" | sort -u
}

# Find all matching processes
PIDS=$(find_worktree_processes)

if [ -z "$PIDS" ]; then
    echo "No orphaned processes found."
    exit 0
fi

echo "Found orphaned processes:"
for pid in $PIDS; do
    cmd=$(ps -p "$pid" -o args= 2>/dev/null || echo "[process ended]")
    cwd=$(readlink "/proc/$pid/cwd" 2>/dev/null || echo "[unknown]")
    echo "  PID $pid: $cmd"
    echo "       cwd: $cwd"
done
echo ""

# Kill processes gracefully first
echo "Sending SIGTERM..."
for pid in $PIDS; do
    kill "$pid" 2>/dev/null || true
done

sleep 2

# Check what's still running and force kill
echo "Checking for remaining processes..."
REMAINING=$(find_worktree_processes)

if [ -n "$REMAINING" ]; then
    echo "Force killing remaining processes..."
    for pid in $REMAINING; do
        kill -9 "$pid" 2>/dev/null || true
    done
    sleep 1
fi

# Final verification
FINAL=$(find_worktree_processes)
if [ -z "$FINAL" ]; then
    echo "All processes killed successfully."
else
    echo "Warning: Some processes may still be running:"
    for pid in $FINAL; do
        ps -p "$pid" -o pid,args= 2>/dev/null || true
    done
fi