## 项目依赖安装

```bash
$ pnpm install
```

## 项目开发运行

```bash
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode
$ pnpm run start:prod
```

## 项目开发外部依赖

### Redis 安装

```shell
docker run -d \
  --name mutu-redis \
  -p 6379:6379 \
  --volume /opt/mutu_redis_data:/data \
  --restart unless-stopped \
  redis:7.2 \
  --appendonly yes
```

### 带有 pgvector 插件的 PostgresSQL

```shell
docker run -d \
  --name mutu-postgres \
  --env POSTGRES_USER=mutu \
  --env POSTGRES_PASSWORD=mutu \
  --env POSTGRES_DB=mutu \
  --volume /opt/mutu_pgdata:/var/lib/postgresql/data \
  --network bridge \
  -p 5432:5432 \
  --restart unless-stopped \
  pgvector/pgvector:0.8.0-pg17
```

