### 总体目标

**给这个库加一套“最小但专业”的 migrations 能力：**

- **安全**：每个 migration 在事务里执行，失败可回滚。
- **简单集成**：沿用现有的 `DbUtil` / CLI 习惯（环境变量、连接串）。
- **可追踪**：一个 `migrations` 表记录已执行版本、时间、校验信息。
- **容易写**：使用 TypeScript 写 migration（而不是只写 SQL 文件），同时也允许直接执行 SQL。

下面是一版初始设计草案，后续可以根据需要调整，然后再落地成代码和文档。

---

### 一、`migrations` 表设计

数据表名称：`migrations`，字段建议如下：

- **`id`**：`BIGINT UNSIGNED` 自增主键  
- **`name`**：`VARCHAR(255)`，migration 名（通常来自文件名，如 `20250101_add_users_table`）
- **`applied_at`**：`DATETIME`，执行成功时间
- **`duration_ms`**：`INT`，执行耗时（可选，但调试和性能分析很有用）
- **唯一约束**：`UNIQUE KEY uk_migrations_name (name)`

语义：

- **是否执行过**：看 `name` 是否在表里。

---

### 二、Migration 文件组织 & 命名

- **目录**：默认 `migrations/`（项目根目录），支持通过参数/env 覆盖，例如：
  - env：`DAO_MIGRATIONS_DIR`
  - CLI 选项：`--migrations-dir <dir>`
- **命名规则**：`<timestamp>_<short_name>.ts`
  - 如：`20250105_120000_create_users.ts`
  - timestamp 用 `YYYYMMDD_HHmmss`，排序简单、天然有顺序。
- **排序规则**：按文件名升序执行（先比较 timestamp）。

---

### 三、Migration 脚本接口（TypeScript）

每个 migration 只需要导出 `up` 函数，便于 CLI 调用：

```ts
// migrations/20250105_120000_create_users.ts
import type { MigrationContext } from 'mysql-plain-dao/migrations';

export async function up(ctx: MigrationContext): Promise<void> {
  await ctx.db.withTransaction(async (conn) => {
    await conn.execute(`
      CREATE TABLE users (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
  });
}
```

- **`MigrationContext`**（设计）：
  - `db: typeof DbUtil` - 提供 `DbUtil` 的所有静态方法（`executeAsync`、`withTransaction`、`queryAsync` 等）。
  - `logger?: (msg: string) => void` - 可选日志函数，用于 migration 内部输出信息。
- **事务策略**：
  - 推荐：migration 内部使用 `ctx.db.withTransaction` 包裹需要事务的操作。
  - 或者：CLI 在调用 `up()` 前自动开启事务，`up()` 执行成功后提交，失败则回滚。
- **简化设计**：只要求 `up` 函数，不需要 `down`。migration 一旦执行就是不可逆的，如需回滚需要手动编写新的 migration 或 SQL。
- **文件加载机制**：
  - CLI 运行时，migration 文件是 `.ts` 格式，需要动态加载。
  - 方案：使用 `tsx` 或 `ts-node` 在运行时编译执行，或者要求用户先编译 migration 文件到 `dist/migrations/` 目录。
  - 推荐：使用 `tsx`（项目已有依赖），通过 `import()` 动态加载 migration 文件。

---

### 四、CLI 命令设计（集成到现有 `mysql-plain-dao`）

在现有 CLI 上加一个子命令：`migrate`：

#### 1. 基础命令

- **`mysql-plain-dao migrate up`**
  - 行为：
    - 检查并创建 `migrations` 表（如果不存在）。
    - 扫描 migrations 目录，按文件名排序。
    - 对还没记录在 `migrations` 表中的 migration：
      - 读取 `up()` 并执行（可包裹事务）。
      - 写入一条记录（`name`, `applied_at`, `duration_ms`）。
  - 选项：
    - `--to <name>`：只执行到某个 migration（包含该条）。
    - `--dry-run`：只打印将要执行的 migration，不真正执行 SQL。

- **`mysql-plain-dao migrate status`**
  - 显示：
    - 所有 migration 文件（本地）
    - 哪些已执行（有记录）、哪些未执行
  - 输出格式示例：
    ```
    Migration Status:
    ✅ 20250105_120000_create_users (applied at 2025-01-05 12:00:15, duration: 45ms)
    ✅ 20250105_130000_add_email (applied at 2025-01-05 13:00:20, duration: 32ms)
    ⏳ 20250105_140000_add_index (pending)
    ```

- **`mysql-plain-dao migrate create <name>`**
  - 自动在 `migrations/` 下生成模版文件（TS），文件名前缀带时间戳。
  - 例：
    - `mysql-plain-dao migrate create add_users_table`
    - 生成 `migrations/20250105_120000_add_users_table.ts`
  - 模板内容示例：
    ```ts
    import type { MigrationContext } from 'mysql-plain-dao/migrations';

    export async function up(ctx: MigrationContext): Promise<void> {
      await ctx.db.executeAsync(`
        -- Your migration SQL here
      `);
    }
    ```

#### 2. 连接/配置复用

复用原有生成器 CLI 的连接参数约定：

- **连接串**：`-c, --conn`，也支持 `DAO_CONN` 环境变量。
- **通用 ENV**：
  - `DAO_CONN`：数据库连接。
  - `DAO_MIGRATIONS_DIR`：migration 目录。
- 这样：在 CI / Docker 中可以和现有生成器共用配置方式。

---

### 五、执行行为与约束

- **顺序保证**：所有 migration 必须按照文件名顺序执行；不允许"插队"执行中间的某个。
- **失败处理**：
  - 单个 migration 在事务内失败：回滚事务，并停止后续所有 migration。
  - CLI 退出码非 0；错误信息指明是哪个 migration 出错。
- **边界情况处理**：
  - migrations 目录不存在：创建目录或报错提示。
  - migration 文件格式错误（没有导出 `up` 函数）：跳过该文件并给出警告，或报错终止。
  - 文件名不符合命名规范：跳过该文件并给出警告。
  - 数据库连接失败：报错并退出。
  - `migrations` 表已存在但结构不匹配：报错提示需要手动修复。

---

### 六、与当前库定位的关系

- **保持"plain"风格**：不强制引入复杂的 ORM 概念，migration 脚本就是"一组 SQL 或使用 `DbUtil` 的 TypeScript 逻辑"。
- **简化设计**：只支持单向迁移（`up`），不提供自动回滚功能。如需回滚，需要手动编写新的 migration 或 SQL 脚本。
- **CLI 集成方式**：
  - 在现有的 `src/generator/cli.ts` 中使用 `commander` 的 `command()` 方法添加 `migrate` 子命令。
  - 子命令结构：
    ```ts
    program
      .command('migrate')
      .description('Database migration commands')
      .addCommand(migrateUpCommand)
      .addCommand(migrateStatusCommand)
      .addCommand(migrateCreateCommand);
    ```
- **扩展点**：
  - 未来可支持：
    - 只读模式（检测差异但不执行）
    - 多数据库配置（例如不同 schema / 不同数据库前缀）
  - 但首版建议先实现：`up` / `status` / `create` 三个核心命令。

---

### 七、待确认的设计细节

1. **migration 接口**（已确认采用 B 框架封装风格）：
   - 统一通过 `MigrationContext` 传入 `DbUtil` 风格的封装（`executeAsync`、`withTransaction` 等），避免在 migration 中直接操作底层 `mysql2` 连接。

实现阶段将根据该约定使用 `DbUtil` 封装来定义 `MigrationContext` 类型，并在 CLI 中注入对应实例。

---

### 九、实现细节补充

#### 1. MigrationContext 类型定义

```ts
// src/migrations/Types.ts
import type { DbUtil } from '../dao/DbUtil';

export interface MigrationContext {
  db: typeof DbUtil;
  logger?: (msg: string) => void;
}
```

#### 2. Migration 文件加载

- 使用 `tsx` 或 `ts-node` 动态加载 `.ts` 文件。
- 或者：要求用户将 migration 文件编译到 `dist/migrations/`，然后加载 `.js` 文件。
- 推荐方案：使用 `tsx` 的 `register()` 或直接通过 `import()` 动态导入（Node.js 原生支持）。

#### 3. 并发锁实现

- 使用 MySQL 的 `GET_LOCK()` 函数实现应用级锁：
  ```sql
  SELECT GET_LOCK('migration_lock', 10); -- 等待最多 10 秒
  -- 执行 migration
  SELECT RELEASE_LOCK('migration_lock');
  ```
- 或者使用文件锁（`fs.openSync` + `flock`），但跨平台兼容性较差。

#### 4. 错误处理与日志

- 所有错误信息应包含：
  - migration 文件名
  - 错误类型（SQL 错误、文件格式错误等）
  - 原始错误堆栈（开发环境）
- 使用 `debug` 包输出详细日志（与现有 `DbUtil` 保持一致）。

---

### 八、单元测试与集成测试设计

- **测试目标**：
  - 覆盖 `migrate up / status / create` 的主要行为。
  - 验证 `migrations` 表的写入逻辑（`name`、`applied_at`、`duration_ms`）。
  - 验证事务与回滚行为（某个 migration 抛错时不应留下部分变更，后续 migration 不再执行）。

- **测试框架与环境**：
  - 使用现有 Jest 测试框架，与 `src/__tests__` 的结构保持一致。
  - 复用当前测试数据库初始化方案：
    - 本地开发通过 `test-local.sh` 运行（依赖本地 MySQL/MariaDB）。
    - CI / Docker 环境通过 `test-in-docker.sh` 运行，保证环境一致性。
  - 为 migrations 功能新增专门的测试文件，例如：
    - `src/__tests__/migrations/migrate-up.test.ts`
    - `src/__tests__/migrations/migrate-status.test.ts`
    - `src/__tests__/migrations/migrate-create.test.ts`

- **测试场景示例**：
  - **`migrate up` 正常路径**：
    - 准备多个简单 migration（建表、加字段）。
    - 运行 `migrate up`：
      - 断言所有 migration 文件对应记录写入 `migrations` 表（`name` 唯一）。
      - 断言 `applied_at` 有值、`duration_ms` 为合理范围。
      - 断言数据库中目标表/字段实际存在。
  - **`migrate up` 失败回滚**：
    - 构造一个中间 migration 故意抛错（例如非法 SQL）。
    - 断言该 migration 对应的 schema 变更没有生效。
    - 断言之后的 migration 未执行。
    - 断言 `migrations` 表中不存在失败 migration 的记录。
  - **`migrate status` 输出**：
    - 在仅执行部分 migration 的情况下运行 `migrate status`。
    - 断言输出中能区分“已执行 / 未执行”的 migration 列表。
  - **`migrate create` 生成文件**：
    - 在临时目录中运行 `migrate create test_migration`。
    - 断言：
      - 生成的文件路径位于配置的 migrations 目录（默认或自定义）。
      - 文件命名符合 `<timestamp>_<name>.ts` 规则。
      - 文件内容包含使用 `MigrationContext` 的 `up` 模板。

- **测试隔离与清理策略**：
  - 每个测试文件/用例前：
    - 确保测试数据库处于初始状态（清空或重建相关表，包括 `migrations` 表及被测试的业务表）。
    - 可以使用独立的测试数据库 schema 或表前缀，避免与其他测试相互影响。
  - 每个测试文件/用例后：
    - 清理新建的表和测试数据，保证多次运行测试结果一致。