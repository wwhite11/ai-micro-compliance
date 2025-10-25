import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { isAdminUser } from '@/lib/adminUsers';
import dbConnect from '@/lib/dbConnect';
import ContractCheckLog from '@/models/ContractCheckLog';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if user is authenticated and has admin access
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.email) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!isAdminUser(session.user.email)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    await dbConnect();

    // Get all logs, sorted by creation date (newest first)
    const logs = await ContractCheckLog.find({})
      .sort({ createdAt: -1 })
      .limit(100); // Limit to prevent overwhelming the admin

    return res.status(200).json(logs);
  } catch (error) {
    console.error('Error fetching logs:', error);
    return res.status(500).json({ error: 'Failed to fetch logs' });
  }
} 