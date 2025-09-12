#!/bin/bash
#
# remote-access.sh: A script to easily create SSH tunnels for specific services.
#
# This script simplifies the process of forwarding ports from a remote wlk
# server to your local machine for management purposes.

set -o errexit
set -o nounset
set -o pipefail

SSH_HOST="wlk"

usage() {
    cat << EOF
Usage: $(basename "$0") [options] <service>

A utility to create SSH port forwarding tunnels for specific services.

Options:
  --host <hostname>   Specify the SSH host alias (default: "${SSH_HOST}").
  -h, --help          Display this help message and exit.

Available services:
  wlk           Forward local port 8080 for the main web application.
  minio         Forward local port 9001 for the MinIO object storage.
  prisma        Forward local port 5555 for Prisma Studio.
EOF
    exit 1
}

prompt_yes_no() {
    local question="$1"
    local answer

    # -n 1 reads a single character, -r prevents backslash interpretation
    read -p "${question} (Y/n) " -n 1 -r answer
    printf "\n"

    if [[ "${answer}" =~ ^[Yy]$ ]] || [[ -z "${answer}" ]]; then
        return 0
    else
        return 1
    fi
}

forward_wlk() {
    local required_host_entry="wlk.sams.haus"
    local required_ip="127.0.0.1"

    printf "➡️ Forwarding port 80 to local port 8080 via host '%s'...\n" "${SSH_HOST}"

    if ! grep -qE "^\s*${required_ip}\s+.*${required_host_entry}" /etc/hosts; then
        printf "❗ Warning: Host entry not found in /etc/hosts.\n"
        printf "   Please add the following line to your /etc/hosts file to proceed:\n"
        printf "   %s %s\n\n" "${required_ip}" "${required_host_entry}"
    fi

    printf "🔌 Establishing SSH tunnel. Wlk will be available at http://%s:8080.\n" "${required_host_entry}"
    printf "🛑 Press Ctrl+C to close.\n"
    ssh -N -L ${required_ip}:8080:localhost:80 "${SSH_HOST}"
}

forward_minio() {
    local hint_command="ssh ${SSH_HOST} \"grep -E 'MINIO_ROOT_(USER|PASSWORD)=' wlk-preview/.env wlk-preview/docker-compose.yaml\""

    printf "🔑 For credentials, you can run the following command:\n"
    printf "   %s\n" "${hint_command}"

    if prompt_yes_no "Do you want to run this command now to fetch credentials?"; then
        printf "🧭 Fetching credentials...\n"
        # 'eval' is used to correctly execute the command string with its nested quotes
        eval "${hint_command}"
        printf -- "👋 Credentials fetched\n\n"
    fi

    printf "➡️ Forwarding port 9001 for MinIO via host '%s'...\n" "${SSH_HOST}"
    printf "🔌 Establishing SSH tunnel. Minio will be available at http://127.0.0.1:9001.\n"
    printf "🛑 Press Ctrl+C to close.\n"
    ssh -N -L 127.0.0.1:9001:localhost:9001 "${SSH_HOST}"
}

forward_prisma() {
    local hint_command="ssh -t ${SSH_HOST} 'cd wlk-preview && docker compose exec wlk npx prisma studio'"

    printf "➡️ Forwarding port 5555 for Prisma Studio via host '%s'...\n" "${SSH_HOST}"

    printf "🔌 Establishing SSH tunnel in the background...\n"
    ssh -N -L 127.0.0.1:5555:localhost:5555 "${SSH_HOST}" &
    # Capture the Process ID (PID) of the background command
    SSH_TUNNEL_PID=$!

    cleanup_and_continue() {
        kill "${SSH_TUNNEL_PID}"
        printf "\n👋 Background tunnel closed\n"
        return 0
    }
    trap cleanup_and_continue INT

    sleep 1

    printf "✅ SSH tunnel established with PID %s.\n\n" "${SSH_TUNNEL_PID}"
    printf "❗ To use the tunnel, you must start Prisma Studio on the remote server with:\n"
    printf "   %s\n" "${hint_command}"

    if prompt_yes_no "Do you want to run this command now in this terminal?"; then
        printf "\n🧭 Launching Prisma Studio on remote (interactive)...\n"
        
        # Temporarily disable 'errexit' so Ctrl+C on ssh (non-zero) doesn't abort the script
        set +e
        eval "${hint_command}"
        ssh_status=$?
        set -e
        
        printf -- "👋 Prisma Studio finished (status %s)\n" "$ssh_status"
    fi

    printf "\n🔗 Tunnel still running in background (PID: %s).\n" "${SSH_TUNNEL_PID}"
    printf "🛑 Press Ctrl+C to close the connection.\n"
    # 'wait' pauses the script here, waiting for the background process to finish
    wait "${SSH_TUNNEL_PID}"
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --host)
            if [[ -z "${2-}" ]]; then
                printf "Error: --host option requires a value.\n\n" >&2
                usage
            fi
            SSH_HOST="$2"
            shift 2
            ;;
        -h | --help)
            usage
            ;;
        -*)
            printf "Error: Unknown option '%s'\n\n" "$1" >&2
            usage
            ;;
        *)
            break
            ;;
    esac
done

if [[ $# -eq 0 ]]; then
    printf "Error: No service specified.\n\n" >&2
    usage
fi

SERVICE="$1"

case "${SERVICE}" in
    wlk)
        forward_wlk
        ;;
    minio)
        forward_minio
        ;;
    prisma)
        forward_prisma
        ;;
    *)
        printf "Error: Unknown service '%s'\n\n" "$1" >&2
        usage
        ;;
esac