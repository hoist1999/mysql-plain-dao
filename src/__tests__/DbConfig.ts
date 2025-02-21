export interface DBConfig {
    host: string;
    user: string;
    password: string;
    database: string;
    port: number;
}

// Database configuration from environment variables defined in docker-compose.yml jest_test service
export const getDBConfig = (): DBConfig => ({
    host: process.env.DB_HOST || '',
    user: process.env.DB_USER || '',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || '',
    port: Number(process.env.DB_PORT) || 3306
}); 