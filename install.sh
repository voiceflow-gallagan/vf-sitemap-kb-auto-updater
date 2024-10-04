#!/bin/bash
set -e  # Exit immediately if a command exits with a non-zero status.

echo "Starting installation script..."
echo "Updating package list..."
# Update package list
sudo apt-get update

echo "Installing uidmap..."
# Install uidmap
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

# Check for Voiceflow API Key
if [ -z "$VF_API_KEY" ]; then
    echo "Error: Voiceflow API Key is not set. Please run the script with VF_API_KEY environment variable."
    echo "Example: VF_API_KEY=your_vf_api_key PORT=3000 USE_CRON=true bash -c \"$(curl -fsSL https://raw.githubusercontent.com/voiceflow-gallagan/vf-sitemap-kb-auto-updater/main/install.sh)\""
    exit 1
fi

echo "API Key received: ${VF_API_KEY:0:20}..." # Print first 20 characters

# Set default settings
PORT=${PORT:-3000}
USE_CRON=${USER_CRON:-false}

echo "Service will run on port: $PORT"

# Create .env file
echo "Creating .env file..."
cat << EOF > .env
VOICEFLOW_API_KEY=$VF_API_KEY
PORT=$PORT
USE_CRON=$USE_CRON
EOF

echo ".env file created successfully."

# Build and start the Docker containers in detached mode
echo "Building and starting Docker containers..."
docker compose up --build -d

# Wait for a moment to allow containers to start
echo "Waiting for containers to start..."
sleep 10

# Display logs from all containers
echo "Displaying container logs:"
docker compose logs --tail=50 -f
