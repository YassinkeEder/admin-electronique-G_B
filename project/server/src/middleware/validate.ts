import type { RequestHandler } from 'express'
import type { ZodTypeAny } from 'zod'

export const validate = (schema: ZodTypeAny): RequestHandler => {
  return async (req, res, next) => {
    try {
      const parsed = await schema.parseAsync(req.body)
      req.body = parsed
      return next()
    } catch (err) {
      const details = (err as any)?.issues ?? (err as any)?.errors ?? err
      return res.status(400).json({ error: 'Invalid request payload', details })
    }
  }
}
