import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import { PLANS } from '@/lib/plans';

interface Usage {
  id: string;
  userId: string;
  documentCount: number;
  month: number;
  year: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.email) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { subscription: true, usage: true },
  });

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (req.method === 'GET') {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const usage = user.usage.find(
      (u: Usage) => u.month === currentMonth && u.year === currentYear
    );

    return res.status(200).json(usage || { documentCount: 0, month: currentMonth, year: currentYear });
  }

  if (req.method === 'POST') {
    // Allow a few free checks before requiring subscription
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Get current usage
    let usage = user.usage.find(
      (u: Usage) => u.month === currentMonth && u.year === currentYear
    );

    const currentUsage = usage?.documentCount || 0;
    const freeChecksAllowed = 1000; // Allow 1000 free checks per month for testing

    // If user has no subscription, check if they're within free limit
    if (!user.subscription || user.subscription.status !== 'active') {
      if (currentUsage >= freeChecksAllowed) {
        return res.status(403).json({ error: 'Free limit reached. Please subscribe to continue.' });
      }
    } else {
      // User has subscription, check plan limits
      const plan = PLANS[user.subscription.plan as keyof typeof PLANS];
      if (!plan) {
        return res.status(400).json({ error: 'Invalid plan' });
      }

      // Check if user has reached their limit
      if (plan.docsPerMonth !== -1 && usage && usage.documentCount >= plan.docsPerMonth) {
        return res.status(403).json({ error: 'Document limit reached' });
      }
    }

    // Update or create usage record
    if (usage) {
      usage = await prisma.usage.update({
        where: { id: usage.id },
        data: { documentCount: { increment: 1 } },
      });
    } else {
      usage = await prisma.usage.create({
        data: {
          userId: user.id,
          documentCount: 1,
          month: currentMonth,
          year: currentYear,
        },
      });
    }

    return res.status(200).json(usage);
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 