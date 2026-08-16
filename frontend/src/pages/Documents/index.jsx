import { useState, useEffect } from 'react';
import { documentsAPI, projectsAPI } from '../../api';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import DeleteConfirm from '../../components/ui/DeleteConfirm';
import { formatDate } from '../../utils/helpers';
import { Plus, Search, FileText, Upload, Download, Trash2, Eye, FileCheck2, Image, FileCode } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Documents() {
  const [documents, setDocuments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [projectFilter, setProjectFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    project_id: '',
    doc_type: 'drawing',
    description: '',
  });
  const [file, setFile] = useState(null);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [projectFilter, typeFilter]);

  const loadProjects = async () => {
    try {
      const res = await projectsAPI.getAll({ per_page: 100 });
      if (res.data.success) setProjects(res.data.data);
    } catch {
      setProjects([{ id: 1, name: 'Gulshan Heights Tower' }, { id: 2, name: 'Uttara Commercial Complex' }]);
    }
  };

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const res = await documentsAPI.getAll({
        project_id: projectFilter,
        doc_type: typeFilter,
      });
      if (res.data.success) setDocuments(res.data.data);
    } catch {
      setDocuments([
        { id: 1, title: 'RAJUK Approved Building Plan (Sanctioned)', project_name: 'Gulshan Heights Tower', doc_type: 'permit', file_name: 'rajuk_sanction_plan_2025.pdf', file_size: 4500000, file_path: '#', created_at: '2025-01-10' },
        { id: 2, title: 'Structural & Column Rebar Layout DWG', project_name: 'Gulshan Heights Tower', doc_type: 'drawing', file_name: 'structural_column_rev2.dwg', file_size: 8200000, file_path: '#', created_at: '2025-02-15' },
        { id: 3, title: 'Soil Test & Standard Penetration Report (SPT)', project_name: 'Uttara Commercial Complex', doc_type: 'report', file_name: 'buet_soil_test_report.pdf', file_size: 2100000, file_path: '#', created_at: '2025-03-01' },
        { id: 4, title: 'Civil Contractor Master Agreement & Stamp', project_name: 'Uttara Commercial Complex', doc_type: 'contract', file_name: 'notarized_contract_agreement.pdf', file_size: 1500000, file_path: '#', created_at: '2025-03-10' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const openUploadModal = () => {
    setSelectedDoc(null);
    setFormData({
      title: '',
      project_id: projects[0]?.id || '',
      doc_type: 'drawing',
      description: '',
    });
    setFile(null);
    setIsModalOpen(true);
  };

  const openDeleteModal = (doc) => {
    setSelectedDoc(doc);
    setIsDeleteOpen(true);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }
    const data = new FormData();
    data.append('file', file);
    data.append('title', formData.title || file.name);
    data.append('project_id', formData.project_id);
    data.append('doc_type', formData.doc_type);
    data.append('description', formData.description);

    try {
      await documentsAPI.upload(data);
      toast.success('Document uploaded successfully!');
      setIsModalOpen(false);
      loadDocuments();
    } catch {
      toast.error('Failed to upload document');
    }
  };

  const handleDelete = async () => {
    try {
      await documentsAPI.delete(selectedDoc.id);
      toast.success('Document deleted');
      setIsDeleteOpen(false);
      loadDocuments();
    } catch {
      toast.error('Failed to delete document');
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 KB';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(1)} MB`;
    return `${Math.round(bytes / 1024)} KB`;
  };

  const getDocTypeBadge = (type) => {
    const map = {
      drawing: { label: 'Drawing (নকশা)', bg: 'bg-blue-100 text-blue-800' },
      permit: { label: 'RAJUK Permit (অনুমোদন)', bg: 'bg-emerald-100 text-emerald-800' },
      contract: { label: 'Contract (চুক্তিপত্র)', bg: 'bg-purple-100 text-purple-800' },
      report: { label: 'Test Report', bg: 'bg-amber-100 text-amber-800' },
      photo: { label: 'Site Photo', bg: 'bg-teal-100 text-teal-800' },
      other: { label: 'General File', bg: 'bg-gray-100 text-gray-800' },
    };
    const t = map[type] || map.other;
    return <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${t.bg}`}>{t.label}</span>;
  };

  const columns = [
    {
      header: 'Document Title & File',
      render: (row) => (
        <div>
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-primary-600" />
            <span className="font-bold text-gray-900">{row.title}</span>
          </div>
          <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
            <span className="font-mono text-gray-600">{row.file_name}</span>
            <span>•</span>
            <span>{formatFileSize(row.file_size)}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Category',
      render: (row) => getDocTypeBadge(row.doc_type),
    },
    {
      header: 'Project',
      render: (row) => <span className="text-xs font-medium text-gray-800">{row.project_name || 'General'}</span>,
    },
    {
      header: 'Upload Date',
      render: (row) => <span className="text-xs text-gray-500">{formatDate(row.created_at)}</span>,
    },
    {
      header: 'Actions',
      className: 'text-right',
      cellClassName: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <a
            href={row.file_path}
            target="_blank"
            rel="noreferrer"
            className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            title="Download / View"
          >
            <Download size={16} />
          </a>
          <button
            onClick={() => openDeleteModal(row)}
            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Project Documents & Compliance Files</h1>
          <p className="text-gray-500 text-sm mt-1">Manage RAJUK approvals, structural drawings, soil test reports, and stamped contracts</p>
        </div>
        <button onClick={openUploadModal} className="btn-primary">
          <Upload size={18} /> Upload Document
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-wrap items-center gap-3">
        <select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          className="form-input text-xs w-56"
        >
          <option value="">All Projects</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="form-input text-xs w-48"
        >
          <option value="">All Document Types</option>
          <option value="drawing">Architectural / Structural Drawing</option>
          <option value="permit">RAJUK / CDA / Govt. Permit</option>
          <option value="contract">Contract & Agreements</option>
          <option value="report">Soil / Concrete Test Reports</option>
          <option value="photo">Site Inspection Photos</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={documents}
        loading={loading}
      />

      {/* Upload Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Upload Project Document"
        size="md"
      >
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="form-label">Document Title (শিরোনাম) *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. RAJUK Approval Letter & Sanctioned Sheet"
              className="form-input"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Project</label>
              <select
                value={formData.project_id}
                onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                className="form-input"
              >
                <option value="">-- General File --</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Document Classification</label>
              <select
                value={formData.doc_type}
                onChange={(e) => setFormData({ ...formData, doc_type: e.target.value })}
                className="form-input"
              >
                <option value="drawing">Drawing / CAD Layout (নকশা)</option>
                <option value="permit">RAJUK / Govt. Permit (অনুমোদন)</option>
                <option value="contract">Contract Agreement (চুক্তিপত্র)</option>
                <option value="report">Test Report (BUET/Lab Report)</option>
                <option value="photo">Site Photo (কাজের ছবি)</option>
                <option value="other">Other Official File</option>
              </select>
            </div>
          </div>

          <div>
            <label className="form-label">Select File (PDF, DWG, Image, Docx up to 10MB) *</label>
            <input
              type="file"
              required
              onChange={(e) => setFile(e.target.files[0])}
              className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            />
          </div>

          <div>
            <label className="form-label">Description / Remarks</label>
            <textarea
              rows="2"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Revision number, approving authority, special clauses..."
              className="form-input text-xs"
            ></textarea>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Start Upload
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <DeleteConfirm
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Document"
        message={`Are you sure you want to remove "${selectedDoc?.title}"?`}
      />
    </div>
  );
}
