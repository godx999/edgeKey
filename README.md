# EdgeKey

EdgeKey 是一套有vike框架开发，可直接部署到 Cloudflare 的一体化全栈卡密商城系统：同一套代码同时包含前端页面、SSR 渲染、后端 API / 数据变更入口，并由 Cloudflare Workers 运行。

## 一键部署到 Cloudflare Workers

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/34892002/edgeKey)

>  ** 点击按钮后，会打开Cloudflare Workers 部署向导，操作提示：** 
> 1. 登录并授权 Git 账户(github、gitlab)，它会自动在你的git账号创建一个新仓库。
> 2. 为了增强安全性，请在向导中修改默认的密钥（ `AUTH_SECRET`）。
> 3. 如果你不绑定已有的D1数据库，它会自动完成新建数据库并初始化数据（管理员账号等）的操作，无需手动干预。
> 4. 部署成功之后在页面的日志里面可以找到 "Deployed edgekey triggers (0.38 sec) https://edgekey.你的账号.workers.dev" 这样的日志，其中 "https://edgekey.你的账号.workers.dev" 就是你的项目网址。
> 5. https://edgekey.你的账号.workers.dev/admin 为管理后台登陆地址，默认管理员账号:admin，密码:admin123456，切记登陆后立即修改密码！

## 技术栈

- 框架与渲染
  - Vike（文件路由 + SSR）
  - Vue 3（前端组件）
- Server / 运行时
  - Hono（服务端路由与中间件）
  - Photon（将服务端入口适配到 Cloudflare）
  - Wrangler（Cloudflare 部署与本地开发工具）
- 数据与变更
  - Telefunc（前后端同构的数据变更 RPC）
  - Prisma（ORM）
  - D1（Cloudflare 原生 SQLite 数据库，本项目开发与部署统一使用）
- UI
  - Tailwind CSS
  - daisyUI（Tailwind 组件与主题）
- 认证
  - Auth.js（管理员账号密码登录）

## 项目结构

```
.
├─ assets/                 # 静态资源
├─ components/             # 复用组件（非路由页面）
├─ pages/                  # Vike 文件路由目录（页面就近放置组件/样式/类型）
│  ├─ +config.ts           # 全局配置（例如 title、SSR 等）
│  ├─ +Layout.vue          # 全局布局
│  ├─ +Head.vue            # 全局 head 标签
│  ├─ tailwind.css         # Tailwind + daisyUI 入口
│  ├─ index/+Page.vue      # 前台首页（/）
│  ├─ product/+Page.vue    # 商品详情页（/product/:slug）
│  ├─ query/+Page.vue      # 订单查询页（/query）
│  ├─ order/+Page.vue      # 订单详情页（/order/:orderNo）
│  ├─ admin/               # 管理后台（/admin）
│  └─ _error/+Page.vue     # 错误页
├─ server/                 # 服务端入口（Hono）与中间件
│  ├─ entry.ts             # 服务端主入口
│  ├─ authjs-handler.ts    # Auth.js handler + session middleware
│  ├─ prisma-middleware.ts # Prisma D1 注入中间件
│  └─ telefunc-handler.ts  # Telefunc handler
├─ lib/                    # 业务逻辑库（支付适配器、发货逻辑等）
├─ modules/                # 功能模块（支付通知、订单等）
├─ scripts/                # 辅助脚本（种子数据、验证脚本）
├─ prisma/                 # Prisma Schema 与迁移 SQL
│  ├─ schema.prisma
│  └─ migrations/
│     ├─ 0001_init.sql
│     └─ 0002_xxx.sql
├─ vite.config.ts          # Vite 插件配置（vike + vue + tailwind + telefunc）
├─ wrangler.jsonc          # Cloudflare Workers 配置（入口为 Photon 虚拟模块）
└─ package.json            # 脚本与依赖
```

### 关于 `+` 文件（Vike 约定）

`pages/` 目录下以 `+` 开头的文件是 Vike 的"约定接口文件"，用于声明页面、配置与数据加载等；不带 `+` 的文件会被当作普通模块（组件、样式、类型）处理，便于页面就近组织代码。

常见 `+` 文件：
- `+Page.vue`：页面组件
- `+data.ts`：页面数据获取（SSR/CSR 共享）
- `+Layout.vue`：布局（包裹页面）
- `+Head.vue`：head 标签
- `+config.ts`：页面/全局配置

## 本地开发

推荐使用 Bun（也可替换为 npm/pnpm/yarn）。

```bash
bun install
```

由于本项目使用了 Cloudflare D1 数据库，在首次启动本地开发服务器前，必须先初始化本地的 D1 模拟器表结构：

```bash
# 1. 生成 Prisma Client（首次安装依赖后必须执行）
bunx prisma generate

# 2. 按顺序将所有迁移脚本应用到本地 Wrangler 模拟器
bunx wrangler d1 migrations apply DB --local

# 3. 初始化管理员账号与初始化种子数据
bun run db:seed

# 4. 准备.env 文件
# 请在 `env.example` 中填写必要的环境变量，例如 `AUTH_SECRET`。
# 然后复制 `env.example` 到 `env` 文件。

# 5. 启动开发服务器
bun run dev
```

## 构建与部署（手动）

首次部署到 Cloudflare 前，需要先在云端创建并初始化 D1 数据库：

1. **登录并创建数据库**
   ```bash
   bunx wrangler login
   bunx wrangler d1 create edgekey-db
   ```

2. **绑定 Database ID**
   将上一步终端输出的 `database_id` 填入 `wrangler.jsonc`。

3. **按顺序初始化云端表结构**
   ```bash
   bunx wrangler d1 migrations apply DB --remote
   ```

4. **初始化管理员账号与初始化种子数据**
   ```bash
   bunx wrangler d1 execute DB --remote --file="./scripts/seed.sql"
   ```
   初始化后默认管理员账号为 `admin / admin123456`，首次登录后请立即修改密码。

5. **配置 AUTH_SECRET**
  输入命令执行，根据命令行提示输入你要使用的密钥字符串。
   ```bash
   bunx wrangler secret put AUTH_SECRET
   ```

6. **生成 Prisma Client 并一键部署**
   ```bash
   bunx prisma generate
   bun run up
   ```

`bun run up` 等价于先构建再发布：
- `vike build`
- `wrangler deploy`

部署配置见 `wrangler.jsonc`（其中 `main` 指向 Photon 的 Cloudflare server-entry 虚拟入口）。

## 认证与密钥（重要）

当前项目使用 Auth.js 的管理员账号密码登录模式。用于生产环境前请务必：
- 配置 `AUTH_SECRET`，未配置时应用会拒绝启动
- Cloudflare 生产环境优先使用 `wrangler secret put AUTH_SECRET`
- 首次初始化后立即修改默认管理员密码

## Cloudflare D1 + Prisma 本地开发工作流

本项目使用了 Prisma ORM 与 Cloudflare D1 数据库，完全遵循 [官方 Prisma + Cloudflare D1 指南](https://www.prisma.io/docs/guides/deployment/cloudflare-d1) 的最佳实践。

### 当前运行方式

- `bun dev` 运行在 Cloudflare 风格的本地开发环境中，Prisma 会通过 `env.DB` 连接到**本地 D1 模拟器**。
- `bun run up` 部署后，Prisma 会通过同一个 `env.DB` 绑定连接到**远程 D1**。
- `.env` 中的 `DATABASE_URL` 仅用于 Prisma CLI / 配置层，不参与当前应用运行时的数据库连接。
- 当前 `prisma/schema.prisma` 仅保留 Cloudflare client generator，运行时统一使用 `generated/prisma/client`。
- 因此，本项目当前的数据库运行模式是：**开发环境用本地 D1，生产环境用远程 D1**。

### 正确的数据库开发工作流

当你需要修改数据库表结构时，请**严格按照以下流程执行**：

**第一步：修改 Schema 并生成 SQL 迁移脚本**

修改 `prisma/schema.prisma` 后，不要使用常规的 `migrate dev`，而是使用 `migrate diff` 生成 SQL 脚本：

```bash
# 由于 Cloudflare D1 和普通的 MySQL 完全不同。普通的 Prisma migrate dev 依赖于一个长期运行的数据库连接来比对状态、创建 shadow database 等等，而 D1 不支持这些操作。
# 后续增量迁移（修改现有表结构时）
# 新版 Prisma 已经废弃了 --from-local-d1，推荐使用 --from-migrations
bunx prisma migrate diff \
  --from-migrations prisma/migrations \
  --to-schema prisma/schema.prisma \
  --script > prisma/migrations/0002_xxx.sql
```

说明：
- `0001_init.sql` 只用于第一次初始化，不应在后续迁移中反复覆盖。
- 后续迁移请按顺序新增文件，例如 `0002_add_foo.sql`、`0003_add_bar.sql`。

**第二步：将迁移同步到本地 D1 模拟器（用于本地开发/测试）**

```bash
bunx wrangler d1 migrations apply DB --local
```

如果不执行这一步，运行 `bun dev` 访问页面时会报错 `no such table`。

**第三步：将迁移同步到 Cloudflare 线上（发布前）**

```bash
bunx wrangler d1 migrations apply DB --remote
```

本地和线上需要分别执行一次。

### 日常开发命令

```bash
bun dev
```

上面的命令会启动本地开发服务器，并使用 `wrangler.jsonc` 中定义的 D1 绑定连接到**本地 D1 模拟器**。

### Telefunc 说明

- Telefunc 函数按约定放在对应页面目录下，以 `.telefunc.ts` 结尾。
- 当前 Windows + `bun dev` + `workerd` 组合下，Telefunc 的开发态命名/同目录检查会触发路径兼容问题，因此在 `server/telefunc-handler.ts` 中关闭了该检查。
- 这不会影响 Telefunc 的实际加载和调用，只是跳过开发态的命名约定校验。

**⚠️ 绝对不要做的操作：**
1. **不要**假设 `bun dev` 使用的是 `prisma/db.sqlite`；当前它实际使用的是本地 D1 模拟器。
2. **不要**使用 `prisma migrate dev`，这会偏离当前 D1 迁移工作流。
3. **不要**反复覆盖 `prisma/migrations/0001_init.sql`；初始化迁移和后续增量迁移应分开维护。
