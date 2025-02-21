#!/bin/bash

rm -rf ./docker-logs/*

# 启动容器并运行测试
docker-compose up --abort-on-container-exit --exit-code-from jest_test

# 获取测试结果
TEST_RESULT=$?

# 如果测试失败，查看npm日志
if [ $TEST_RESULT -ne 0 ]; then
    echo "Test failed. Checking npm logs..."
    docker exec jest_test cat /root/.npm/_logs/$(date +%Y-%m-%d)*-debug-0.log
fi

# 关闭容器
docker-compose down

# 返回测试结果
exit $TEST_RESULT