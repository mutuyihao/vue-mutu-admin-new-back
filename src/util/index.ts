import { createHmac } from 'node:crypto';
export function omit(obj: Record<string, any>, excludeKeys: string[]) {
    const copy = { ...obj };
    for (const key of excludeKeys) {
        delete copy[key];
    }
    return copy;
}
export function encrptPassword(password: string) {
    return createHmac('sha256', process.env.PASSWORD_SECRET_KEY!).update(password).digest('hex');
}