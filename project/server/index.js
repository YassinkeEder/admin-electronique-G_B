// server/index.ts
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import prisma from '../lib/prisma';
import { randomUUID } from 'crypto';
const app = express();
const PORT = process.env.PORT || 3001;

const ORIGIN = process.env.ALLOWED_ORIGIN || 'http://localhost:5173';
app.use(cors({ origin: ORIGIN }));
app.use(express.json());
// ✅ prisma.profile (pas prisma.user — ton schéma utilise Profile)
app.get('/api/users', async (_req, res) => {
    try {
        const profiles = await prisma.profile.findMany({
            select: { id: true, fullName: true, email: true, role: true, isActive: true }
        });
        res.json(profiles);
    }
    catch (error) {
        console.error('Error fetching profiles:', error);
        res.status(500).json({ error: 'Failed to fetch profiles' });
    }
});
app.post('/api/users', async (req, res) => {
    try {
        const { id, email, fullName, role } = req.body;
        if (!email) {
            res.status(400).json({ error: 'email is required' });
            return;
        }
        const profileId = id ?? randomUUID();
        const profile = await prisma.profile.create({
            data: { id: profileId, email, fullName: fullName ?? '', role }
        });
        res.status(201).json(profile);
    }
    catch (error) {
        console.error('Error creating profile:', error);
        res.status(500).json({ error: 'Failed to create profile' });
    }
});
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
process.on('SIGINT', async () => {
    await prisma.$disconnect();
    process.exit(0);
});
app.listen(PORT, () => {
    if (process.env.NODE_ENV !== 'production') {
        console.log(`✅ API running at http://localhost:${PORT}`);
    }
});
