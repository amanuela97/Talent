declare namespace NodeJS {
  export interface ProcessEnv {
    DATABASE_URL: string;
    DIRECT_URL: string;
    JWT_SECRET: string;
    JWT_REFRESH_SECRET: string;
    ADMIN_LIST: string;
    CLOUD_NAME: string;
    CLOUD_API_KEY: string;
    CLOUD_API_SECRET: string;
    MAIL_USER: string;
    MAIL_PASS: string;
    MAIL_HOST: string;
    PORT: string;
    NODE_ENV: string;
    FRONTEND_URL: string;
  }
}
