declare namespace NodeJS {
  export interface ProcessEnv {
    DATABASE_URL: string;
    DIRECT_URL: string;
    jwtSecretKey: string;
    jwtRefreshTokenKey: string;
    ADMIN_LIST: string;
    CLOUD_NAME: string;
    CLOUD_API_KEY: string;
    CLOUD_API_SECRET: string;
  }
}
