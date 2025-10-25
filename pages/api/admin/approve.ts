import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import { isAdminUser } from '@/lib/adminUsers';
import dbConnect from '@/lib/dbConnect';
import ContractCheckLog from '@/models/ContractCheckLog';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
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

    const { logId, approved, adminNotes } = req.body;
    console.log('Approving log:', { logId, approved, adminNotes });

    if (!logId) {
      return res.status(400).json({ error: 'Log ID is required' });
    }

    await dbConnect();
    console.log('Database connected');

    // Update the log with approval status and admin notes
    const updatedLog = await ContractCheckLog.findByIdAndUpdate(
      logId,
      {
        approved: approved,
        adminNotes: adminNotes,
        approvedBy: session.user.email,
        approvedAt: new Date(),
      },
      { new: true }
    );

    console.log('Updated log result:', updatedLog);

    if (!updatedLog) {
      return res.status(404).json({ error: 'Log not found' });
    }

    return res.status(200).json(updatedLog);
  } catch (error) {
    console.error('Error approving log:', error);
    return res.status(500).json({ error: 'Failed to approve log' });
  }
} 