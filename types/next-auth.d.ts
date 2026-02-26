import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session extends DefaultSession {
    accessToken?: string;
  }
}

// JWT コールバックでカスタムフィールドを使うための型拡張
// これがないと token.accessToken / token.refreshToken が型エラーになる
declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
  }
}
