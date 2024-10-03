#!/bin/bash
sudo apt-get install -y uidmap
# Install Docker
echo "Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
dockerd-rootless-setuptool.sh install
sudo loginctl enable-linger ubuntu
rm get-docker.sh
# Clone the repository
echo "Cloning the repository..."
git clone https://github.com/voiceflow-gallagan/vf-sitemap-kb-auto-updater.git "vf-sitemap"

# Change to the project directory
echo "Changing to the project directory..."
cd vf-sitemap

# Ask for Voiceflow API Key
read -p "Enter your Voiceflow API Key: " VF_API_KEY

# Set default port
PORT=3000

# Check if port 3000 is in use
while nc -z localhost $PORT 2>/dev/null; do
    echo "Port $PORT is already in use."
    read -p "Enter a different port number: " PORT
done

# Create .env file
echo "Creating .env file..."
cat << EOF > .env
VOICEFLOW_API_KEY=$VF_API_KEY
PORT=$PORT
USE_CRON=true
EOF

# Build and start the Docker containers in detached mode
echo "Building and starting Docker containers..."
docker compose up --build -d

# Wait for a moment to allow containers to start
echo "Waiting for containers to start..."
sleep 10

# Display logs from all containers
echo "Displaying container logs:"
docker compose logs --tail=50 -f
