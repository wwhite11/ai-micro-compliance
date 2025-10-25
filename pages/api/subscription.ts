import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import { PLANS } from '@/lib/plans';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.email) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { subscription: true },
  });

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (req.method === 'GET') {
    if (!user.subscription) {
      return res.status(200).json({ plan: 'free' });
    }

    const plan = PLANS[user.subscription.plan as keyof typeof PLANS];
    if (!plan) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    return res.status(200).json({
      plan: user.subscription.plan,
      status: user.subscription.status,
      priceId: user.subscription.stripeSubscriptionId,
      currentPeriodEnd: user.subscription.currentPeriodEnd,
      docsPerMonth: plan.docsPerMonth,
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 