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

    // Get all approved logs
    const approvedLogs = await ContractCheckLog.find({ approved: true })
      .sort({ createdAt: -1 });

    // Format data for fine-tuning
    const fineTuningData = approvedLogs.map(log => ({
      messages: [
        {
          role: "system",
          content: `You are a legal compliance expert specializing in contract analysis. Analyze the following contract and provide structured feedback.`
        },
        {
          role: "user",
          content: log.inputContract
        },
        {
          role: "assistant",
          content: `Contract Type Detected: ${log.contractTypeDetected}

Issues Found:
${log.outputIssues.map((issue: any, index: number) => `${index + 1}. ${issue.explanation}`).join('\n')}

Recommended Clauses:
${log.outputRecommendations.map((rec: any) => `• ${rec.name}: ${rec.reason}\nDraft: ${rec.draft}`).join('\n\n')}

Improved Contract:
${log.outputImprovedContract}`
        }
      ]
    }));

    // Set headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="fine-tuning-data.json"');

    return res.status(200).json(fineTuningData);
  } catch (error) {
    console.error('Error exporting data:', error);
    return res.status(500).json({ error: 'Failed to export data' });
  }
} 