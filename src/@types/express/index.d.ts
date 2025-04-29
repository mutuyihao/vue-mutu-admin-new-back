declare global {
    namespace Express {
        interface Request {
            user?: { username: string, userId: number, role: string, iat: number, exp: number }; // 根据你的 payload 实际结构改
        }
    }

    interface JWTPayload {
        user: { username: string, userId: number, role: string, iat: number, exp: number }; // 根据你的 payload 实际结构改
    }
}
export { }