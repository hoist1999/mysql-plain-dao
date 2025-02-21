#!/bin/bash

# 启动容器并运行测试
docker-compose up --abort-on-container-exit --exit-code-from jest_test

# 获取测试结果
TEST_RESULT=$?

# 关闭容器
docker-compose down

# 返回测试结果
exit $TEST_RESULT