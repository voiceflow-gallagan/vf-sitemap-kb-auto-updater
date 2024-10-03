#!/bin/bash
sudo apt-get install -y uidmap
# Install Docker
echo "Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
dockerd-rootless-setuptool.sh install
sudo loginctl enable-linger ubuntu
# Clone the repository
echo "Cloning the repository..."
git clone https://github.com/voiceflow-gallagan/vf-sitemap-kb-auto-updater.git

# Change to the project directory
echo "Changing to the project directory..."
cd vf-sitemap-kb-auto-updater

# Build and start the Docker containers in detached mode
echo "Building and starting Docker containers..."
docker compose up --build -d

# Wait for a moment to allow containers to start
echo "Waiting for containers to start..."
sleep 10

# Display logs from all containers
echo "Displaying container logs:"
docker compose logs --tail=50 -f
