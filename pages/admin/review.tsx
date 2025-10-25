import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { isAdminUser } from '@/lib/adminUsers';

interface ContractIssue {
  title: string;
  explanation: string;
}

interface ContractRecommendation {
  name: string;
  reason: string;
  draft: string;
  link?: string;
}

interface ContractLog {
  _id: string;
  userId: string;
  promptVersion: string;
  contractTypeDetected: string;
  inputContract: string;
  outputIssues: ContractIssue[];
  outputRecommendations: ContractRecommendation[];
  outputImprovedContract: string;
  approved?: boolean;
  adminNotes?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
}

export default function AdminReview() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [logs, setLogs] = useState<ContractLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<ContractLog | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    // Check if user has admin access
    if (!isAdminUser(session.user?.email)) {
      router.push('/dashboard');
      return;
    }

    fetchLogs();
  }, [session, status, router]);

  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/admin/logs');
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      } else {
        console.error('Failed to fetch logs');
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const approveLog = async (logId: string, approved: boolean) => {
    setApproving(true);
    try {
      console.log('Approving log:', logId, 'with status:', approved);
      
      const response = await fetch('/api/admin/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          logId,
          approved,
          adminNotes,
        }),
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        const updatedLog = await response.json();
        console.log('Approval successful, updating state...');
        
        // Update the logs list with the updated log
        setLogs(prevLogs => 
          prevLogs.map(log => 
            log._id === logId ? updatedLog : log
          )
        );
        
        // Immediately update the selected log to show the new status
        setSelectedLog(updatedLog);
        
        // Clear admin notes
        setAdminNotes('');
        
        console.log('State updated, UI should switch to change status view');
      } else {
        const errorData = await response.json();
        console.error('Failed to approve log:', errorData);
      }
    } catch (error) {
      console.error('Error approving log:', error);
    } finally {
      setApproving(false);
    }
  };

  const exportData = async () => {
    try {
      const response = await fetch('/api/admin/export');
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'fine-tuning-data.json';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Admin Review - Contract Compliance</title>
      </Head>
      
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Admin Review</h1>
            <div className="flex space-x-3">
              <a
                href="/dashboard"
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
              >
                Back to Dashboard
              </a>
              <button
                onClick={exportData}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
              >
                Export Fine-tuning Data
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Logs List */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow">
                <div className="px-4 py-5 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Contract Check Logs</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {logs.length} total logs
                  </p>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {logs.map((log) => (
                    <div
                      key={log._id}
                      onClick={() => setSelectedLog(log)}
                      className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                        selectedLog?._id === log._id ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {log.contractTypeDetected}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(log.createdAt).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            {log.userId}
                          </p>
                        </div>
                        <div className="ml-2">
                          {log.approved === true && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Approved
                            </span>
                          )}
                          {log.approved === false && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Rejected
                            </span>
                          )}
                          {log.approved === undefined && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Pending
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Log Details */}
            <div className="lg:col-span-2">
              {selectedLog ? (
                <div className="bg-white rounded-lg shadow">
                  <div className="px-4 py-5 border-b border-gray-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-lg font-medium text-gray-900">
                          {selectedLog.contractTypeDetected}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                          Checked on {new Date(selectedLog.createdAt).toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-500">
                          User: {selectedLog.userId}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">
                          Prompt Version: {selectedLog.promptVersion}
                        </p>
                        {selectedLog.approvedBy && (
                          <p className="text-sm text-gray-500">
                            Approved by: {selectedLog.approvedBy}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 space-y-6">
                    {/* Original Contract */}
                    <div>
                      <h3 className="text-md font-medium text-gray-900 mb-2">Original Contract</h3>
                      <div className="bg-gray-50 p-3 rounded-md max-h-40 overflow-y-auto">
                        <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                          {selectedLog.inputContract}
                        </pre>
                      </div>
                    </div>

                    {/* Issues Found */}
                    <div>
                      <h3 className="text-md font-medium text-gray-900 mb-2">Issues Found</h3>
                      <div className="space-y-2">
                        {selectedLog.outputIssues.map((issue, index) => (
                          <div key={index} className="bg-red-50 p-3 rounded-md">
                            <p className="text-sm font-medium text-red-800">{issue.title}</p>
                            <p className="text-sm text-red-700 mt-1">{issue.explanation}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recommended Clauses */}
                    {selectedLog.outputRecommendations.length > 0 && (
                      <div>
                        <h3 className="text-md font-medium text-gray-900 mb-2">Recommended Clauses</h3>
                        <div className="space-y-3">
                          {selectedLog.outputRecommendations.map((rec, index) => (
                            <div key={index} className="bg-blue-50 p-3 rounded-md">
                              <p className="text-sm font-medium text-blue-800">{rec.name}</p>
                              <p className="text-sm text-blue-700 mt-1">{rec.reason}</p>
                              <div className="mt-2 bg-white p-2 rounded border">
                                <p className="text-sm text-gray-700">{rec.draft}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Improved Contract */}
                    <div>
                      <h3 className="text-md font-medium text-gray-900 mb-2">Improved Contract</h3>
                      <div className="bg-green-50 p-3 rounded-md max-h-60 overflow-y-auto">
                        <pre className="text-sm text-green-700 whitespace-pre-wrap">
                          {selectedLog.outputImprovedContract}
                        </pre>
                      </div>
                    </div>

                    {/* Admin Notes */}
                    <div>
                      <h3 className="text-md font-medium text-gray-900 mb-2">Admin Notes</h3>
                      <textarea
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        placeholder="Add notes about this analysis..."
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        rows={3}
                      />
                    </div>

                    {/* Approval Actions */}
                    <div className="flex space-x-3">
                      {selectedLog.approved === undefined ? (
                        <>
                          <button
                            onClick={() => approveLog(selectedLog._id, true)}
                            disabled={approving}
                            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-md"
                          >
                            {approving ? 'Approving...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => approveLog(selectedLog._id, false)}
                            disabled={approving}
                            className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded-md"
                          >
                            {approving ? 'Rejecting...' : 'Reject'}
                          </button>
                        </>
                      ) : (
                        <div className="w-full">
                          <div className="text-center mb-3">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                              selectedLog.approved 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {selectedLog.approved ? 'Approved' : 'Rejected'}
                            </span>
                            {selectedLog.approvedBy && (
                              <p className="text-sm text-gray-500 mt-1">
                                by {selectedLog.approvedBy}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => {
                              setSelectedLog({ ...selectedLog, approved: undefined });
                              setAdminNotes('');
                            }}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                          >
                            Change Status
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  <p className="text-gray-500">Select a log to review</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 