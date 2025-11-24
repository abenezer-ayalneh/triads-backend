# NestJS Template

This is a simple Nest.js starter template with some common configured items.

### Configured items

- Prettier
- EsLint
- Commit-lint
- Winston(logging)
- Global exception filter
- Helmet
- Throttler
- CORS with allowed origins
- Swagger documentation
- Husky(with commit lint and pretty quick)

### Memory Optimization

This application has been optimized for low-memory environments (2GB RAM VPS):

1. **Database Connection Management**: PrismaService properly closes connections on module destroy
2. **Query Limits**: All `findMany` queries have limits to prevent loading excessive data into memory
3. **Logging**: Production logging level set to 'info' instead of 'silly' to reduce log volume
4. **Lodash Optimization**: Only imports specific functions instead of the entire library
5. **Excel Import**: File size limits and row processing limits to prevent memory spikes
6. **PM2 Configuration**: Watch mode disabled in production, memory restart limit set to 1GB

**Database Connection Pooling**: For optimal performance on limited resources, configure your `DATABASE_URL` with connection pool parameters:

```
DATABASE_URL="postgresql://user:password@host:port/database?connection_limit=5&pool_timeout=20"
```

Adjust `connection_limit` based on your VPS resources (recommended: 3-5 for 2GB RAM).
