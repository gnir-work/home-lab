default:
    just --list

tailscale-up:
    sudo tailscale up --accept-dns=false

tailscale-down:
    sudo tailscale down
