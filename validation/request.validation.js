import { z } from 'zod';

export const signupPostRequestBodySchema = z.object({
  name: z.string(),
  email: z.email(),
  password: z.string().min(3),
});

export const loginPostRequestBodySchema = z.object({
  email: z.email(),
  password: z.string().min(3),
});

export const shortenPostRequestBodySchema = z.object({
  targetURL: z.url(),
  shortCode: z.string(),
  userId:z.uuid()
});
