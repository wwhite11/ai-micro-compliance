import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { getPromptForDocumentType } from '@/lib/prompts';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth/[...nextauth]';
import dbConnect from '@/lib/dbConnect';
import ContractCheckLog from '@/models/ContractCheckLog';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text, documentType, docType } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  try {
    // Get user session for logging
    const session = await getServerSession(req, res, authOptions);
    const userId = session?.user?.email || 'anonymous';

    // Get the appropriate prompt for the document type
    const selectedDocType = documentType || docType || 'Freelance Contract';
    const systemPrompt = getPromptForDocumentType(selectedDocType);
    
    console.log('Using document type:', selectedDocType);
    console.log('System prompt:', systemPrompt);

    // Set temperature to 0.1 for advanced contract types to ensure stable, repeatable output
    const advancedContractTypes = ['Freelance Contract', 'Independent Contractor Agreement', 'Master Services Agreement', 'Statement of Work', 'IP Assignment', 'Auto-Detect'];
    const temperature = advancedContractTypes.includes(selectedDocType) ? 0.1 : 0.7;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      temperature: temperature,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: text
        }
      ],
    });

    const answer = response.choices[0].message.content;
    
    if (!answer) {
      throw new Error('No response from OpenAI');
    }

    console.log('Raw OpenAI response:', answer);

    // Advanced parsing for new output structure
    let contractType = '';
    let issues: string[] = [];
    let recommendedClauses: { name: string; reason: string; draft: string; link?: string }[] = [];
    let improvedText = '';
    let reminder = '';

    // Use regex to extract sections
    const contractTypeMatch = answer.match(/Contract Type Detected:\s*([\s\S]*?)(?=\n\s*2\)|\n\s*Issues Found:|\n\s*\d+\)|\n\s*Recommended Clauses:|\n\s*\*\*2\) Issues Found|\n\s*\*\*3\) Recommended Clauses|\n\s*\*\*4\) Improved Contract|\n\s*\*\*5\) Reminder|$)/i);
    if (contractTypeMatch) {
      contractType = contractTypeMatch[1].trim().replace(/^[-•*\d.]+\s*/, '');
    }

    // Issues Found (numbered list)
    const issuesMatch = answer.match(/Issues Found:\s*([\s\S]*?)(?=\n\s*3\)|\n\s*Recommended Clauses:|\n\s*\*\*3\) Recommended Clauses|\n\s*\*\*4\) Improved Contract|\n\s*\*\*5\) Reminder|\n\s*Improved Contract:|$)/i);
    if (issuesMatch) {
      issues = issuesMatch[1]
        .split(/\n+/)
        .map(line => line.replace(/^\d+\.|^[-•*]\s*/, '').trim())
        .filter(line => line.length > 0);
    }

    // Recommended Clauses (bulleted list)
    const clausesMatch = answer.match(/Recommended Clauses:\s*([\s\S]*?)(?=\n\s*4\)|\n\s*Improved Contract:|\n\s*\*\*4\) Improved Contract|\n\s*\*\*5\) Reminder|\n\s*Reminder:|$)/i);
    if (clausesMatch) {
      // Each clause may be a bullet or start with a name:
      const clauseBlocks = clausesMatch[1].split(/\n(?=\s*[-•*])/).filter(Boolean);
      recommendedClauses = clauseBlocks.map(block => {
        const nameMatch = block.match(/[-•*]\s*([^:]+):?/);
        const name = nameMatch ? nameMatch[1].trim() : '';
        const reasonMatch = block.match(/Reason:([^\n]+)/i);
        const reason = reasonMatch ? reasonMatch[1].trim() : '';
        const draftMatch = block.match(/Draft:([\s\S]*?)(Link:|$)/i);
        const draft = draftMatch ? draftMatch[1].replace(/Link:.*/i, '').trim() : '';
        const linkMatch = block.match(/Link:([^\s]+)/i);
        const link = linkMatch ? linkMatch[1].trim() : '';
        return { name, reason, draft, link };
      }).filter(c => c.name || c.draft);
    }

    // Improved Contract
    const improvedMatch = answer.match(/Improved Contract:\s*([\s\S]*?)(?=\n\s*5\)|\n\s*Reminder:|\n\s*\*\*5\) Reminder|$)/i);
    if (improvedMatch) {
      improvedText = improvedMatch[1].trim();
    }

    // Reminder
    const reminderMatch = answer.match(/Reminder:\s*([\s\S]*)/i);
    if (reminderMatch) {
      reminder = reminderMatch[1].trim();
    }

    // Fallback to legacy parsing if not enough info
    if (!contractType && !issues.length && !improvedText) {
      // Legacy parsing (old prompt)
      const parts = answer.split(/(?:ISSUES FOUND:|IMPROVED VERSION:)/);
      if (parts.length >= 2) {
        const issuesText = parts[1]?.split('IMPROVED VERSION:')[0]?.trim() || '';
        issues = issuesText
          .split('\n')
          .filter(line => line.trim().length > 0)
          .map(line => line.replace(/^[-•*]\s*/, '').trim())
          .filter(line => line.length > 0);
        const improved = parts[parts.length - 1]?.trim() || '';
        improvedText = improved;
      }
    }

    // Fallback for issues
    if (!issues.length) {
      const bulletPoints = answer.match(/^[-•*]\s*(.+)$/gm);
      if (bulletPoints) {
        issues = bulletPoints.map(point => point.replace(/^[-•*]\s*/, '').trim());
      } else {
        const firstParagraph = answer.split('\n\n')[0];
        issues = [firstParagraph.trim()];
      }
    }
    if (!improvedText) {
      const paragraphs = answer.split('\n\n').filter(p => p.trim().length > 0);
      if (paragraphs.length > 1) {
        improvedText = paragraphs[paragraphs.length - 1].trim();
      } else {
        improvedText = 'No improved version available.';
      }
    }

    // === Backend Filtering ===
    // Remove issues that are just signature lines, signature blocks, or date lines
    const signatureRegex = /signed by|signature block|date:?|^\s*-+\s*$/i;
    issues = issues.filter(issue =>
      issue &&
      !signatureRegex.test(issue) &&
      !/^_{3,}/.test(issue.trim()) &&
      !/^\s*date\s*:?/i.test(issue.trim())
    );

    // Remove recommended clauses that duplicate issues (by name or content)
    if (recommendedClauses && recommendedClauses.length > 0) {
      const lowerIssues = issues.map(i => i.toLowerCase());
      recommendedClauses = recommendedClauses.filter(clause => {
        const clauseName = clause.name?.toLowerCase() || '';
        const clauseDraft = clause.draft?.toLowerCase() || '';
        // If the clause name or draft is already mentioned in issues, filter it out
        return !lowerIssues.some(issue =>
          issue.includes(clauseName) || issue.includes(clauseDraft)
        );
      });
    }

    // === Improved Draft Post-Processing ===
    if (improvedText) {
      // Remove Markdown bolding (**...**)
      improvedText = improvedText.replace(/\*\*(.*?)\*\*/g, '$1');
      // Ensure section headers are ALL CAPS and on their own line
      // (Assume headers are lines that are all uppercase or start with a capitalized word and are followed by a colon or are alone)
      improvedText = improvedText.replace(/^(\s*)([A-Z][A-Z\s]+):?\s*$/gm, (match, p1, p2) => `${p1}${p2.trim().toUpperCase()}`);
      // Also, for lines like 'Disputes' or 'Termination' etc. (not already all caps), make them all caps if they are likely headers
      improvedText = improvedText.replace(/^(\s*)([A-Z][a-z]+(?: [A-Z][a-z]+)*):?\s*$/gm, (match, p1, p2) => {
        // Only convert if the line is short (likely a header)
        if (p2.length < 30) return `${p1}${p2.toUpperCase()}`;
        return match;
      });
    }

    // Backend fallback for contract type detection
    if (!contractType || /could not be detected/i.test(contractType)) {
      // Try to extract from the first non-empty line of the input text
      const firstLine = (text || '').split(/\r?\n/).find((line: string) => line.trim().length > 0);
      if (firstLine && firstLine.length < 80) {
        contractType = firstLine.trim();
      }
    }

    // === MongoDB Logging ===
    try {
      await dbConnect();
      await ContractCheckLog.create({
        userId,
        promptVersion: "v1.0",
        contractTypeDetected: contractType,
        inputContract: text,
        outputIssues: issues.map(issue => ({ title: issue.split(':')[0]?.trim() || issue, explanation: issue })),
        outputRecommendations: recommendedClauses,
        outputImprovedContract: improvedText,
      });
      console.log('✅ Logged contract check to MongoDB');
    } catch (error) {
      console.error('❌ Failed to log to MongoDB:', error);
      console.log('ℹ️  MongoDB logging is optional - continuing without logging');
      // Don't fail the request if logging fails
    }

    return res.status(200).json({
      contractType,
      issues,
      recommendedClauses,
      improvedText,
      reminder,
    });
  } catch (error) {
    console.error('OpenAI API error:', error);
    return res.status(500).json({ error: 'Failed to check compliance' });
  }
} 