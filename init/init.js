const { PrismaClient } = require('@prisma/client')
const { createHmac } = require('node:crypto')
// const { v4: uuidv4 } = require('uuid')
const prisma = new PrismaClient()
function encrptPassword(password) {
    return createHmac('sha256', process.env.PASSWORD_SECRET_KEY).update(password).digest('hex');
}
async function seed() {
    console.log('开始初始化数据')
    await prisma.role.createMany({
        data: [
            { name: 'ADMIN' },
            { name: 'USER' },
        ]
    })
    await prisma.user.create({
        data: {
            username: 'admin',
            email: 'admin@qq.com',
            password: encrptPassword('123456'),
            roleId: 1
        }
    })
    console.log('初始化数据成功')
    await prisma.$disconnect();

}
seed()
    .catch((e) => {
        throw e
    })
    .finally(async () => {
        // 关闭 Prisma 连接
        await prisma.$disconnect()
    })
