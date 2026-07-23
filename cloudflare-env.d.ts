interface Fetcher {
  fetch(request: Request): Promise<Response>;
}

interface D1Result<T = unknown> {
  results: T[];
  meta: {
    changes: number;
  };
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  run<T = Record<string, unknown>>(): Promise<D1Result<T>>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = Record<string, unknown>>(
    statements: D1PreparedStatement[],
  ): Promise<D1Result<T>[]>;
}

declare module "cloudflare:workers" {
  export const env: Record<string, unknown>;
}
