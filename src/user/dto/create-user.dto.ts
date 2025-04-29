import { z } from 'zod'
import { createZodDto } from 'nestjs-zod'
const CreateUserSchema = z.object({
    name: z.string(),
    username: z.string(),
    email: z.string(),
    password: z.string(),
    roleName: z.string().optional(),
    roleId: z.number().optional()
})

export class CreateUserDto extends createZodDto(CreateUserSchema) { }

export const CreateUserSchemaType = CreateUserSchema