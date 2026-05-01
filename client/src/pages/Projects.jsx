import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { Plus, FolderOpen, Users, CheckCircle2, Trash2, X } from 'lucide-react';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => { fetchProjects(); }, []);

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data);
    } catch (err) { toast.error('Failed to load projects'); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) { toast.error('Project name is required'); return; }
    setCreating(true);
    try {
      await api.post('/projects', { name: newName, description: newDesc });
      toast.success('Project created!');
      setShowCreate(false); setNewName(''); setNewDesc('');
      fetchProjects();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create project'); }
    finally { setCreating(false); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? All tasks will be deleted too.`)) return;
    try { await api.delete(`/projects/${id}`); toast.success('Project deleted'); fetchProjects(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed to delete'); }
  };

  if (loading) return <div className="page-container"><div className="loading-state">Loading projects...</div></div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <div><h1>Projects</h1><p className="text-muted">{projects.length} project{projects.length !== 1 ? 's' : ''}</p></div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}><Plus size={18} />New Project</button>
      </div>

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>Create New Project</h2><button className="btn-icon" onClick={() => setShowCreate(false)}><X size={20} /></button></div>
            <form onSubmit={handleCreate}>
              <div className="form-group"><label htmlFor="projectName">Project Name</label><input id="projectName" type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Website Redesign" autoFocus /></div>
              <div className="form-group"><label htmlFor="projectDesc">Description (optional)</label><textarea id="projectDesc" value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Brief description" rows={3} /></div>
              <div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button><button type="submit" className="btn btn-primary" disabled={creating}>{creating ? 'Creating...' : 'Create Project'}</button></div>
            </form>
          </div>
        </div>
      )}

      {projects.length === 0 ? (
        <div className="empty-container"><FolderOpen size={48} className="text-muted" /><h3>No projects yet</h3><p className="text-muted">Create your first project to get started</p><button className="btn btn-primary" onClick={() => setShowCreate(true)}><Plus size={18} />Create Project</button></div>
      ) : (
        <div className="projects-grid">
          {projects.map(project => {
            const progress = project.taskCount > 0 ? Math.round((project.doneCount / project.taskCount) * 100) : 0;
            return (
              <div key={project._id} className="project-card">
                <div className="project-card-header">
                  <Link to={`/projects/${project._id}`} className="project-name">{project.name}</Link>
                  <button className="btn-icon btn-danger-hover" onClick={() => handleDelete(project._id, project.name)} title="Delete project"><Trash2 size={16} /></button>
                </div>
                {project.description && <p className="project-desc">{project.description}</p>}
                <div className="project-meta">
                  <span className="meta-item"><Users size={14} />{project.members?.length || 0} members</span>
                  <span className="meta-item"><CheckCircle2 size={14} />{project.doneCount}/{project.taskCount} tasks</span>
                </div>
                <div className="progress-bar-container"><div className="progress-bar" style={{ width: `${progress}%` }}></div></div>
                <Link to={`/projects/${project._id}`} className="btn btn-secondary btn-sm btn-full">Open Project</Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
