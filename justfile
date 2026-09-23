default:
    just --list

up:
    docker compose up -d --build

# Stop all services
down:
    docker compose down

# Install systemd service so containers start on boot (run once)
install-service:
    sudo systemctl enable docker
    sudo cp home-lab.service /etc/systemd/system/home-lab.service
    sudo systemctl daemon-reload
    sudo systemctl enable home-lab.service
    @echo "docker and home-lab.service enabled on boot"

tailscale-up:
    sudo tailscale up --accept-dns=false

tailscale-down:
    sudo tailscale down
