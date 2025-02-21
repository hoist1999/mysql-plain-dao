#!/bin/bash

# 定义粗体输出函数
print_bold() {
    echo -e "\033[1m$1\033[0m"
}

print_red() {
    echo -e "\033[1;31m$1\033[0m"
}

print_green() {
    echo -e "\033[1;32m$1\033[0m"
}

# 清理日志目录
rm -rf ./docker-logs/*

# 获取所有需要的镜像
# 从 docker-compose.yml 获取镜像
COMPOSE_IMAGES=$(grep 'image:' docker-compose.yml | awk '{print $2}')

# 从 Dockerfile 获取基础镜像
DOCKERFILE_IMAGES=$(grep '^FROM' Dockerfile.test | awk '{print $2}')

# 合并所有镜像并去重
IMAGES=$(echo -e "${COMPOSE_IMAGES}\n${DOCKERFILE_IMAGES}" | sort -u)

# 显示将要执行的 docker pull 命令
print_bold "Pull the following image in advance:"
for IMAGE in $IMAGES; do
    echo "  $IMAGE"
done
echo "---"

# 检查并拉取镜像
for IMAGE in $IMAGES; do
    echo "Checking $IMAGE..."
    if ! docker image inspect "$IMAGE" >/dev/null 2>&1; then
        echo "Image $IMAGE not found locally, pulling..."
        if ! docker pull "$IMAGE"; then
            print_red "Failed to pull $IMAGE"
            exit 1
        fi
        
        # 再次验证镜像是否存在
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

# 启动容器并运行测试
docker-compose up --build --abort-on-container-exit --exit-code-from jest_test
TEST_RESULT=$?

if [ $TEST_RESULT -ne 0 ]; then
    print_red "❌ Test failed!"
    echo "Please check the test results in docker-logs/jest-output.log for details"
    exit 1
else
    print_green "✅ All tests passed!"
fi

# 清理容器和卷
print_bold "Cleaning up containers and volumes..."
docker-compose down -v