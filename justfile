default:
    just --list

# Pull latest and rebuild all services
up:
    git pull
    docker compose up -d --build

# Stop all services
down:
    docker compose down

# Install systemd service so containers start on boot (run once)
install-service:
    sudo cp home-lab.service /etc/systemd/system/home-lab.service
    sudo systemctl daemon-reload
    sudo systemctl enable home-lab.service
    @echo "home-lab.service installed and enabled"

tailscale-up:
    sudo tailscale up --accept-dns=false

tailscale-down:
    sudo tailscale down
