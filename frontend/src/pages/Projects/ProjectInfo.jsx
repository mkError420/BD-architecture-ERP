import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { projectsAPI } from '../../api';
import { Info, Calendar, DollarSign, MapPin, Building2, Users, CheckCircle2 } from 'lucide-react';

export default function ProjectInfo() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    try {
      const res = await projectsAPI.getOne(projectId);
      if (res.data.success) {
        setProject(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load project', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!project) {
    return <div className="text-center text-gray-500 py-8">Project not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
          <Info size={24} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Project Information</h1>
          <p className="text-gray-500 text-sm">{project.project_code}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <Building2 size={16} />
            <span>Project Name</span>
          </div>
          <p className="font-semibold text-gray-900">{project.name}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <Calendar size={16} />
            <span>Start Date</span>
          </div>
          <p className="font-semibold text-gray-900">{project.start_date || 'N/A'}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <Calendar size={16} />
            <span>End Date</span>
          </div>
          <p className="font-semibold text-gray-900">{project.end_date || 'N/A'}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <DollarSign size={16} />
            <span>Total Budget</span>
          </div>
          <p className="font-semibold text-gray-900">৳{Number(project.total_budget).toLocaleString()}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <MapPin size={16} />
            <span>Location</span>
          </div>
          <p className="font-semibold text-gray-900">{project.location || project.district || 'N/A'}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <CheckCircle2 size={16} />
            <span>Status</span>
          </div>
          <p className="font-semibold text-gray-900 capitalize">{project.status}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Description</h2>
        <p className="text-gray-600">{project.description || 'No description available'}</p>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Building Specifications</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500">Building Type</p>
            <p className="font-semibold text-gray-900">{project.building_type || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Stories Above Ground</p>
            <p className="font-semibold text-gray-900">{project.stories_above_ground || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Basement Floors</p>
            <p className="font-semibold text-gray-900">{project.basement_floors || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Units</p>
            <p className="font-semibold text-gray-900">{project.total_units || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Gross Floor Area</p>
            <p className="font-semibold text-gray-900">{project.gross_floor_area || 'N/A'} sqft</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Structural System</p>
            <p className="font-semibold text-gray-900">{project.structural_system || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Foundation System</p>
            <p className="font-semibold text-gray-900">{project.foundation_system || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">RAJUK Approval No</p>
            <p className="font-semibold text-gray-900">{project.rajuk_approval_no || 'N/A'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
