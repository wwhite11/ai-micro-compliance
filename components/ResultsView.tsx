"use client";

interface RecommendedClause {
  name: string;
  reason: string;
  draft: string;
  link?: string;
}

interface ResultsViewProps {
  contractType: string;
  issues: string[];
  recommendedClauses: RecommendedClause[];
  improvedText: string;
  reminder: string;
}

export default function ResultsView({
  contractType,
  issues,
  recommendedClauses,
  improvedText,
  reminder
}: ResultsViewProps) {
  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([improvedText], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'improved-contract.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6">
      {/* A) Detected Contract Type */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          ✅ Detected Contract Type:
        </h3>
        <p className="text-gray-700">{contractType || "Contract type could not be detected"}</p>
      </div>

      {/* B) Issues Found */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Issues Found:
        </h3>
        {issues.length === 0 || (issues.length === 1 && issues[0].includes("No major issues")) ? (
          <p className="text-green-600 font-medium">✅ No major issues found — looks good!</p>
        ) : (
          <div className="space-y-3">
            {issues.map((issue, index) => (
              <div key={index} className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <p className="text-gray-800">{issue}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* C) Recommended Clauses */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Recommended Clauses:
        </h3>
        {recommendedClauses.length === 0 ? (
          <p className="text-green-600 font-medium">✅ No additional clauses recommended at this time.</p>
        ) : (
          <div className="space-y-4">
            {recommendedClauses.map((clause, index) => (
              <div key={index} className="border border-gray-100 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">{clause.name}</h4>
                <p className="text-gray-700 mb-3">{clause.reason}</p>
                <div className="bg-gray-50 border border-gray-200 rounded p-3 mb-3">
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">{clause.draft}</pre>
                </div>
                {clause.link && (
                  <a
                    href={clause.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Learn more →
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* D) Improved Contract Draft */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Improved Contract Draft:
          </h3>
          <button
            onClick={handleDownload}
            className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Download Improved Contract (.txt)
          </button>
        </div>
        <textarea
          value={improvedText}
          readOnly
          className="w-full p-4 border border-gray-300 rounded-lg bg-white text-black min-h-[300px] resize-y font-mono text-sm"
        />
      </div>

      {/* E) Disclaimer */}
      <div className="text-center">
        <p className="text-sm text-gray-500">
          {reminder || "Disclaimer: This is general information only and not a substitute for legal advice. Always consult a qualified attorney for complex or high-value contracts."}
        </p>
      </div>
    </div>
  );
} 