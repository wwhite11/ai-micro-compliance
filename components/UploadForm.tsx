"use client";

import { useState, useRef } from "react";

interface UploadFormProps {
  onCheck: (content: string) => void;
  checking: boolean;
}

export default function UploadForm({ onCheck, checking }: UploadFormProps) {
  const [documentText, setDocumentText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let content = documentText;

    if (file) {
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        const formData = new FormData();
        formData.append('file', file);
        try {
          const response = await fetch('/api/extract-text', {
            method: 'POST',
            body: formData,
          });
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to extract text from PDF');
          }
          const data = await response.json();
          const combinedContent = documentText + (documentText ? '\n\n' : '') + data.text;
          onCheck(combinedContent);
        } catch (error) {
          console.error('PDF extraction error:', error);
          alert('Failed to extract text from PDF. Please try again or paste the text manually.');
        }
        return;
      } else {
        // Handle text files (TXT, DOCX) directly
        const reader = new FileReader();
        reader.onload = async (event) => {
          const result = event.target?.result as string;
          const combinedContent = documentText + (documentText ? '\n\n' : '') + result;
          onCheck(combinedContent);
        };
        reader.readAsText(file);
        return;
      }
    }

    if (!content.trim()) {
      alert('Please enter contract text to check');
      return;
    }

    onCheck(content);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Textarea Section */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Contract Text
        </label>
        <textarea
          value={documentText}
          onChange={(e) => setDocumentText(e.target.value)}
          placeholder="Paste your contract text here..."
          className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[300px] resize-y text-black"
        />
      </div>

      {/* File Upload Section */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Or upload your contract file
        </label>
        <div className="flex items-center space-x-4">
          <button
            type="button"
            onClick={handleUploadClick}
            className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Choose File
          </button>
          <span className="text-sm text-gray-500">
            Supported: TXT, DOCX, PDF
          </span>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.docx,.pdf"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        {file && (
          <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-800">
              Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          </div>
        )}
      </div>

      {/* Check Button */}
      <button
        type="submit"
        disabled={checking || (!documentText.trim() && !file)}
        className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
      >
        {checking ? "Checking your contract..." : "Check My Contract"}
      </button>
    </form>
  );
} 