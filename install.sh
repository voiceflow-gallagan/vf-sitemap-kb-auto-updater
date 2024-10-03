#!/bin/bash
set -e  # Exit immediately if a command exits with a non-zero status.

echo "Starting installation script..."

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
echo "Prompting for Voiceflow API Key..."
read -p "Enter your Voiceflow API Key: " VF_API_KEY

# Check if VF_API_KEY is empty
if [ -z "$VF_API_KEY" ]; then
    echo "Error: Voiceflow API Key cannot be empty."
    exit 1
fi

echo "API Key received: ${VF_API_KEY:0:5}..." # Print first 5 characters for verification


# Set default port
PORT=3000

# Check if port 3000 is in use
while nc -z localhost $PORT 2>/dev/null; do
    echo "Port $PORT is already in use."
    read -p "Enter a different port number: " PORT
done

echo "Service will run on port: $PORT"

# Create .env file
echo "Creating .env file..."
cat << EOF > .env
VOICEFLOW_API_KEY=$VF_API_KEY
PORT=$PORT
USE_CRON=false
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
