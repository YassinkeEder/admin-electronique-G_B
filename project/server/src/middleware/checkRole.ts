import type { RequestHandler } from 'express'
import prisma from '../../../lib/prisma'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

export const checkRole = (allowedRoles: string[]): RequestHandler => {
  return async (req, res, next) => {
    try {
      const auth = req.headers.authorization
      if (!auth || !auth.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing Authorization header' })
      }
      const token = auth.split(' ')[1]
      if (!SUPABASE_URL) {
        console.error('Missing SUPABASE URL env var')
        return res.status(500).json({ error: 'Server misconfiguration' })
      }

      const url = SUPABASE_URL.replace(/\/$/, '') + '/auth/v1/user'
      const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}`, apikey: ANON_KEY ?? '' } })
      if (!resp.ok) {
        return res.status(401).json({ error: 'Invalid token' })
      }

      const user = await resp.json() as { id?: string; user?: { id?: string } }
      const userId = user.id || user.user?.id
      if (!userId) return res.status(401).json({ error: 'Invalid token payload' })

      const profile = await prisma.profile.findUnique({ where: { id: userId } })
      if (!profile) return res.status(403).json({ error: 'Profile not found' })

      // admin has full access; otherwise check allowedRoles
      if (profile.role === 'admin' || allowedRoles.includes(profile.role)) {
        ;(req as any).user = { id: userId, role: profile.role }
        return next()
      }

      return res.status(403).json({ error: 'Forbidden' })
    } catch (err) {
      console.error('checkRole error', err)
      return res.status(500).json({ error: 'Authorization failure' })
    }
  }
}
