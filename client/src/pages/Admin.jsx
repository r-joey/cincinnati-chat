import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, FileText, BarChart3, MessageSquare, HelpCircle, AlertCircle } from 'lucide-react';
import StatsBoard from '../components/StatsBoard';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function Admin() {
  const navigate = useNavigate();
  const [pdfInfo, setPdfInfo] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [stats, setStats] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/stats`);
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, []);

  const fetchPdfInfo = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/pdf-info`);
      const data = await res.json();
      setPdfInfo(data.document);
    } catch (err) {
      console.error('Failed to fetch PDF info:', err);
    }
  }, []);

  useEffect(() => {
    fetchPdfInfo();
    fetchStats();
    // Poll stats every 5 seconds for real-time updates
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, [fetchPdfInfo, fetchStats]);

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setUploadMessage('Please select a PDF file.');
      return;
    }

    setUploading(true);
    setUploadMessage('');

    const formData = new FormData();
    formData.append('pdf', file);

    try {
      const res = await fetch(`${API_BASE}/api/admin/upload-pdf`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (res.ok) {
        setUploadMessage(`Uploaded "${data.document.filename}" successfully (${data.textLength} characters extracted)`);
        fetchPdfInfo();
      } else {
        setUploadMessage(data.error || 'Upload failed');
      }
    } catch (err) {
      setUploadMessage('Failed to upload PDF');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-3 shadow-sm">
        <button
          onClick={() => navigate('/')}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <h1 className="text-lg font-semibold text-slate-800">Admin Dashboard</h1>
      </header>

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* PDF Upload Section */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-amber-500" />
            Hotel Information PDF
          </h2>

          {pdfInfo && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">
              Current file: <strong>{pdfInfo.filename}</strong> — uploaded{' '}
              {new Date(pdfInfo.uploaded_at).toLocaleString()}
            </div>
          )}

          <label className="block">
            <div className="flex items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 hover:border-amber-400 rounded-xl cursor-pointer transition-colors bg-slate-50 hover:bg-amber-50/50">
              <div className="text-center">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-500">
                  {uploading ? 'Uploading...' : 'Click to upload a PDF (replaces current)'}
                </p>
              </div>
            </div>
            <input
              type="file"
              accept=".pdf"
              onChange={handleUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>

          {uploadMessage && (
            <p className={`mt-3 text-sm ${uploadMessage.includes('success') ? 'text-emerald-600' : 'text-red-600'}`}>
              {uploadMessage}
            </p>
          )}
        </div>

        {/* Statistics Section */}
        <StatsBoard stats={stats} />
      </div>
    </div>
  );
}
