import { z } from 'zod'
import { createZodDto } from 'nestjs-zod'
const CreateRoleSchema = z.object({
    name: z.string(),
    description: z.string(),
    routes: z.array(z.string()).optional(),
    permissions: z.array(z.string()).optional(),
})

export class CreateRoleDto extends createZodDto(CreateRoleSchema) { }

export const CreateRoleSchemaType = CreateRoleSchema
