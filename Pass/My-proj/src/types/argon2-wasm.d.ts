declare module "argon2-wasm" {
  export interface Argon2Options {
    pass: Uint8Array;
    salt: Uint8Array;
    time: number;
    mem: number;
    parallelism: number;
    hashLen: number;
    type: number;
  }

  export interface Argon2Result {
    hash: Uint8Array;
  }

  export function hash(options: Argon2Options): Promise<Argon2Result>;
}
