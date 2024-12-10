/* Autogenerated code */

export interface Config {
  apps: {
    api: {
      port: number;
      privatePort: number;
      useCachingInterceptor: boolean;
    };
    eventsNotifier: {
      port: number;
      privatePort: number;
    };
  };
  libs: {
    common: {
      network: "devnet" | "testnet" | "mainnet";
      urls: {
        api: string;
        gateway: string;
        queue: string;
      };
      xBulkAddress: string;
      mnemonics: {
        first: string;
      };
      tokens: {
        first: string;
      };
      database: {
        host: string;
        port: number;
        username?: string;
        password?: string;
        name: string;
        tlsAllowInvalidCertificates: boolean;
      };
      nativeAuth: {
        maxExpirySeconds: number;
        acceptedOrigins: string[];
      };
      security: {
        admins: string[];
      };
      rateLimiterSecret?: string;
    };
  };
}
