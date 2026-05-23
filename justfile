vm_host := env_var_or_default("HOMELAB_VM", "ubuntu@homelab")
home_lab_dir := env_var_or_default("HOME_LAB_DIR", "~/home-lab")

default:
    just --list

# Start all services on the VM (pull latest + rebuild)
up:
    ssh {{vm_host}} "cd {{home_lab_dir}} && git pull && docker compose up -d --build"

# Stop all services on the VM
down:
    ssh {{vm_host}} "cd {{home_lab_dir}} && docker compose down"

# Install systemd service so containers start on VM boot (run once)
install-service:
    scp home-lab.service {{vm_host}}:/tmp/home-lab.service
    ssh {{vm_host}} "sudo mv /tmp/home-lab.service /etc/systemd/system/home-lab.service && sudo systemctl daemon-reload && sudo systemctl enable home-lab.service"
    @echo "home-lab.service installed and enabled on {{vm_host}}"

tailscale-up:
    sudo tailscale up --accept-dns=false

tailscale-down:
    sudo tailscale down
