import React, { useState, useEffect } from 'react';
import { reportAPI } from '../services/api';
import Navbar from '../components/Navbar';
import { FaUpload, FaFileAlt, FaTrash, FaEye } from 'react-icons/fa';

const ReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const response = await reportAPI.getReports();
      if (response.data.success) {
        setReports(response.data.data);
      }
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await reportAPI.uploadReport(formData);
      if (response.data.success) {
        alert('Report uploaded and processed successfully!');
        loadReports();
      }
    } catch (error) {
      alert('Error uploading report: ' + (error.response?.data?.message || error.message));
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleViewReport = async (reportId) => {
    try {
      const response = await reportAPI.getReportById(reportId);
      if (response.data.success) {
        setSelectedReport(response.data.data);
      }
    } catch (error) {
      console.error('Error loading report:', error);
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!confirm('Are you sure you want to delete this report?')) return;

    try {
      await reportAPI.deleteReport(reportId);
      alert('Report deleted successfully');
      loadReports();
      if (selectedReport?.id === reportId) {
        setSelectedReport(null);
      }
    } catch (error) {
      alert('Error deleting report');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Medical Reports</h1>
          
          <label className="btn-primary cursor-pointer flex items-center gap-2">
            <FaUpload />
            {uploading ? 'Uploading...' : 'Upload Report'}
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Reports List */}
          <div className="card">
            <h2 className="text-xl font-bold mb-4">Your Reports</h2>
            
            {loading ? (
              <p className="text-gray-600">Loading reports...</p>
            ) : reports.length === 0 ? (
              <p className="text-gray-600 text-center py-8">
                No reports uploaded yet. Upload your first medical report to get AI-powered explanations.
              </p>
            ) : (
              <div className="space-y-3">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedReport?.id === report.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-primary-300'
                    }`}
                    onClick={() => handleViewReport(report.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FaFileAlt className="text-primary-600 text-2xl" />
                        <div>
                          <p className="font-medium text-gray-800">{report.fileName}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(report.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewReport(report.id);
                          }}
                          className="text-primary-600 hover:text-primary-700"
                        >
                          <FaEye />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteReport(report.id);
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Report Details */}
          <div className="card">
            <h2 className="text-xl font-bold mb-4">Report Details</h2>
            
            {!selectedReport ? (
              <p className="text-gray-600 text-center py-8">
                Select a report to view details and AI explanation
              </p>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">File Information</h3>
                  <p className="text-sm text-gray-600"><strong>Name:</strong> {selectedReport.fileName}</p>
                  <p className="text-sm text-gray-600">
                    <strong>Uploaded:</strong> {new Date(selectedReport.uploadedAt).toLocaleString()}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">📄 Extracted Text</h3>
                  <div className="bg-gray-50 p-4 rounded-lg max-h-60 overflow-y-auto">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                      {selectedReport.extractedText}
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">🤖 AI Explanation</h3>
                  <div className="bg-blue-50 p-4 rounded-lg max-h-60 overflow-y-auto">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {selectedReport.aiExplanation}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Information Card */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">📋 How it works</h3>
          <ul className="list-disc list-inside space-y-2 text-sm text-blue-800">
            <li>Upload your medical reports (images or PDF files)</li>
            <li>Our AI uses OCR to extract text from your documents</li>
            <li>Get clear, patient-friendly explanations of your results</li>
            <li>Understand medical terms and what they mean for you</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
