import React, { useEffect, useState } from 'react';
import { Card } from '../../components/common/Card';
import { Table } from '../../components/common/Table';
import { Button } from '../../components/common/Button';
import { StatusBadge } from '../../components/common/StatusBadge';
import { UploadDocumentModal } from '../../components/documents/UploadDocumentModal';
import { formatDate } from '../../utils/formatters';
import { documentService } from '../../services/documentService';
import { projectService } from '../../services/projectService';
import { useAuth } from '../../context/AuthContext';
import { 
  FileText, 
  FileUp, 
  Download, 
  Search, 
  Building2, 
  User, 
  Filter 
} from 'lucide-react';

export function DocumentsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';
  const [documents, setDocuments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All');

  useEffect(() => {
    async function loadData() {
      try {
        const [docData, projData] = await Promise.all([
          documentService.getAllDocuments(),
          projectService.getAllProjects(),
        ]);
        setDocuments(docData || []);
        setProjects(projData || []);
      } catch (err) {
        console.error('Failed to load documents page data:', err);
      }
    }
    loadData();

    const unsub = documentService.subscribe(setDocuments);
    return () => unsub();
  }, []);

  const types = ['All', 'Technical Drawing', 'Agreement', 'Payment Receipt', 'Contract'];

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.uploadedBy.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = selectedType === 'All' || doc.type === selectedType;
    return matchesSearch && matchesType;
  });

  const columns = [
    { header: 'Document Name' },
    { header: 'Type' },
    { header: 'Project Site' },
    { header: 'Uploaded By' },
    { header: 'Date' },
    { header: 'File Format' },
    { header: 'Action', className: 'text-right' },
  ];

  return (
    <div className="space-y-6 text-[#f0f6fc]">
        
        {/* Header with Upload Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-white tracking-tight uppercase">Document Repository & Archive</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Secure digital archive for drawings, milestone contracts, payment receipts, and waybills.
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            icon={FileUp}
            disabled={!isAdmin && projects.length === 0}
            onClick={() => setIsUploadModalOpen(true)}
            title={(!isAdmin && projects.length === 0) ? 'You must be assigned to at least one construction project to upload documents.' : 'Upload Document'}
          >
            Upload Document
          </Button>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#161b22] p-3 rounded-2xl border border-[#30363d] shadow-md">
          <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto text-xs">
            {types.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setSelectedType(t)}
                className={`px-3 py-1.5 rounded-xl font-bold uppercase tracking-wider text-[11px] whitespace-nowrap transition-all cursor-pointer ${
                  selectedType === t
                    ? 'bg-[#b4e600] text-black font-black shadow-xs'
                    : 'text-slate-400 hover:bg-[#0d1117] hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documents, project, or author..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-[#30363d] bg-[#0d1117] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#b4e600] focus:border-[#b4e600] transition-all"
            />
          </div>
        </div>

        {/* Documents Ledger */}
        <Card title={`Archived Documents (${filteredDocs.length})`} subtitle="Master index of verified site records">
          <Table
            columns={columns}
            data={filteredDocs}
            keyExtractor={(d) => d.id}
            renderRow={(doc) => (
              <>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-[#b4e600]/10 text-[#b4e600] border border-[#b4e600]/30">
                      <FileText className="w-4 h-4 stroke-[2.5]" />
                    </div>
                    <div>
                      <span className="font-bold text-white block">{doc.name}</span>
                      <span className="text-[11px] text-slate-400">{doc.size}</span>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 text-slate-300">{doc.type}</td>
                <td className="py-3 px-4 font-bold text-white">{doc.projectName}</td>
                <td className="py-3 px-4 text-slate-400">{doc.uploadedBy}</td>
                <td className="py-3 px-4 text-slate-400">{formatDate(doc.date)}</td>
                <td className="py-3 px-4">
                  <span className="font-mono text-[10px] font-black uppercase tracking-wider bg-[#0d1117] border border-[#30363d] px-2 py-0.5 rounded-lg text-[#b4e600]">
                    {doc.fileType || 'PDF'}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Download}
                    onClick={() => alert(`Simulated download of ${doc.name}`)}
                  >
                    Download
                  </Button>
                </td>
              </>
            )}
          />
        </Card>

        {/* Upload Modal */}
        <UploadDocumentModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          projects={projects}
          onDocumentUploaded={(newDoc) => setDocuments((prev) => [newDoc, ...prev])}
        />

      </div>
  );
}

export default DocumentsPage;
