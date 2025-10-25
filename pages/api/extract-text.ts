import type { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm, File, Fields, Files } from 'formidable';
import fs from 'fs';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

export const config = {
  api: {
    bodyParser: false,
  },
};

function parseForm(req: NextApiRequest): Promise<{ fields: Fields; files: Files }> {
  const form = new IncomingForm();
  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { files } = await parseForm(req);
    let file = files.file as File | File[] | undefined;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    if (Array.isArray(file)) {
      file = file[0];
    }

    const filePath = file.filepath;
    const ext = file.originalFilename?.split('.').pop()?.toLowerCase();
    let text = '';

    if (ext === 'pdf') {
      const data = fs.readFileSync(filePath);
      const pdfData = await pdfParse(data);
      text = pdfData.text;
    } else if (ext === 'docx') {
      const data = fs.readFileSync(filePath);
      const result = await mammoth.extractRawText({ buffer: data });
      text = result.value;
    } else if (ext === 'txt') {
      text = fs.readFileSync(filePath, 'utf-8');
    } else {
      return res.status(400).json({ error: 'Unsupported file type' });
    }

    // Optionally: delete the file after processing
    fs.unlinkSync(filePath);

    return res.status(200).json({ text });
  } catch (error) {
    console.error('File extraction error:', error);
    return res.status(500).json({ error: 'Failed to extract text' });
  }
} 