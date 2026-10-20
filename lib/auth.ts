import { SignJWT } from "jose";
export async function signToken(username: string) {
  return new SignJWT({ username }).setProtectedHeader({ alg: "HS256" }).setExpirationTime("7d")
    .sign(new TextEncoder().encode(process.env.JWT_SECRET!));
}
