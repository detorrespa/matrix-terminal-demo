// Local shims for editor/lint environments without node_modules.
// These are minimal declarations to satisfy TypeScript in this repo.

declare module 'next/server' {
  export type NextRequest = Request;
  export class NextResponse {
    static json(data: unknown, init?: ResponseInit): Response;
  }
}

declare const process: {
  env: Record<string, string | undefined>;
};
