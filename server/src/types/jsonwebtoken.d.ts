declare module 'jsonwebtoken' {
  export interface JwtPayload {
    userId: string;
    iat?: number;
    exp?: number;
  }

  export function verify(token: string, secretOrPublicKey: string | Buffer): JwtPayload;
  export function sign(payload: string | object | Buffer, secretOrPrivateKey: string | Buffer): string;
}