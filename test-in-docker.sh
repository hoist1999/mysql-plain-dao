#!/bin/bash
# 在 docker 容器中运行测试

# 定义粗体打印函数
print_bold() {
    echo -e "\033[1m$1\033[0m"
}

# 定义红色打印函数
print_red() {
    echo -e "\033[1;31m$1\033[0m"
}

# 定义绿色打印函数
print_green() {
    echo -e "\033[1;32m$1\033[0m"
}

# 清理日志目录
rm -rf ./docker-logs/*

# 获取所有需要的镜像，使用pull命令提前拉取镜像
# docker-compose.yml: 配置文件，告诉 Docker 需要启动哪些容器以及如何配置它们
#   包括两个容器：mysql-server（MariaDB 数据库容器）和 jest-server（运行测试的容器）
#   还配置了数据库连接信息、环境变量、容器之间的依赖关系等
# 从 docker-compose.yml 中提取镜像
COMPOSE_IMAGES=$(grep 'image:' docker-compose.yml | awk '{print $2}')

# Dockerfile.test: 构建测试容器的步骤说明文件
#   告诉 Docker 如何创建一个用于运行测试的容器镜像
#   步骤包括：使用 node:20-slim 作为基础镜像，安装 pnpm 工具，安装项目依赖等
# 从 Dockerfile 中提取基础镜像
DOCKERFILE_IMAGES=$(grep '^FROM' Dockerfile.test | awk '{print $2}')

# 合并所有镜像并去重
IMAGES=$(echo -e "${COMPOSE_IMAGES}\n${DOCKERFILE_IMAGES}" | sort -u)

# 显示要执行的 docker pull 命令
print_bold "请提前拉取以下镜像："
for IMAGE in $IMAGES; do
    echo "  $IMAGE"
done
echo "---"

# 检查并拉取镜像
for IMAGE in $IMAGES; do
    echo "正在检查 $IMAGE..."
    if ! docker image inspect "$IMAGE" >/dev/null 2>&1; then
        echo "镜像 $IMAGE 在本地未找到，正在拉取..."
        if ! docker pull "$IMAGE"; then
            print_red "拉取 $IMAGE 失败"
            exit 1
        fi
        
        # 验证拉取后镜像是否存在
        if ! docker image inspect "$IMAGE" >/dev/null 2>&1; then
            print_red "拉取后镜像 $IMAGE 未找到"
            exit 1
        fi
    else
        echo "镜像 $IMAGE 已存在于本地"
    fi
done

echo "---"

print_bold "启动容器并运行测试"

# 启用 BuildKit 以使用缓存挂载功能，加速依赖安装
# BuildKit 是 Docker 的下一代构建引擎，用于替代旧的构建器。
# 主要特点：
# - 并行构建：可并行执行构建步骤，提升速度
# - 更好的缓存机制：更精确的缓存控制，减少不必要的重建
# - 缓存挂载（Cache Mount）：支持在构建过程中挂载缓存卷，用于包管理器缓存等
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

# 启动容器并运行测试
docker compose up --build --abort-on-container-exit --exit-code-from jest-server
TEST_RESULT=$?

if [ $TEST_RESULT -ne 0 ]; then
    print_red "❌ 测试失败！"
    echo "请查看 docker-logs/jest-output.log 中的测试结果详情"
    exit 1
else
    print_green "✅ 所有测试通过！"
fi

# 清理容器和卷
print_bold "正在清理容器和卷..."
docker-compose down -v