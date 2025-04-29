import { z } from 'zod'
import { createZodDto } from 'nestjs-zod'
import { title } from 'process'
import { create } from 'domain'

const CreateConversationSchema = z.object({
    id: z.string().optional(),
    title: z.string().optional(),
    messages: z.array(z.any()),
    createdAt: z.date(),
    isDeleted: z.boolean().default(false)
})

export class CreateConversationDto extends createZodDto(CreateConversationSchema) { }
