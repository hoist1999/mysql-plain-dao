#!/bin/bash
# run test in docker container

# Define bold print function
print_bold() {
    echo -e "\033[1m$1\033[0m"
}

# Define red print function
print_red() {
    echo -e "\033[1;31m$1\033[0m"
}

# Define green print function
print_green() {
    echo -e "\033[1;32m$1\033[0m"
}

# Clean up logs directory
rm -rf ./docker-logs/*

# Get all required ima
ges
# Extract images from docker-compose.yml
COMPOSE_IMAGES=$(grep 'image:' docker-compose.yml | awk '{print $2}')

# Extract base images from Dockerfile
DOCKERFILE_IMAGES=$(grep '^FROM' Dockerfile.test | awk '{print $2}')

# Merge all images and remove duplicates
IMAGES=$(echo -e "${COMPOSE_IMAGES}\n${DOCKERFILE_IMAGES}" | sort -u)

# Display docker pull commands to be executed
print_bold "Pull the following image in advance:"
for IMAGE in $IMAGES; do
    echo "  $IMAGE"
done
echo "---"

# Check and pull images
for IMAGE in $IMAGES; do
    echo "Checking $IMAGE..."
    if ! docker image inspect "$IMAGE" >/dev/null 2>&1; then
        echo "Image $IMAGE not found locally, pulling..."
        if ! docker pull "$IMAGE"; then
            print_red "Failed to pull $IMAGE"
            exit 1
        fi
        
        # Verify image exists after pulling
        if ! docker image inspect "$IMAGE" >/dev/null 2>&1; then
            print_red "Image $IMAGE not found after pulling"
            exit 1
        fi
    else
        echo "Image $IMAGE already exists locally"
    fi
done

echo "---"

print_bold "Start the container and run the test"

# Start containers and run tests
docker compose up --build --abort-on-container-exit --exit-code-from jest_test
TEST_RESULT=$?

if [ $TEST_RESULT -ne 0 ]; then
    print_red "❌ Test failed!"
    echo "Please check the test results in docker-logs/jest-output.log for details"
    exit 1
else
    print_green "✅ All tests passed!"
fi

# Clean up containers and volumes
print_bold "Cleaning up containers and volumes..."
docker-compose down -v