import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, Users, UserPlus, X, Trash2, Edit3, Calendar, Flag } from 'lucide-react';

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [memberEmail, setMemberEmail] = useState('');

  // task form state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [taskStatus, setTaskStatus] = useState('todo');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');

  const isAdmin = project?.members?.find(m => m.user?._id === user?._id)?.role === 'admin';

  useEffect(() => { loadData(); }, [id]);

  const loadData = async () => {
    try {
      const [projRes, tasksRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/tasks/project/${id}`)
      ]);
      setProject(projRes.data);
      setTasks(tasksRes.data);
    } catch (err) { toast.error('Failed to load project'); navigate('/projects'); }
    finally { setLoading(false); }
  };

  const resetTaskForm = () => {
    setTaskTitle(''); setTaskDesc(''); setTaskPriority('medium');
    setTaskStatus('todo'); setTaskDueDate(''); setTaskAssignee('');
    setEditingTask(null);
  };

  const openEditTask = (task) => {
    setTaskTitle(task.title); setTaskDesc(task.description || '');
    setTaskPriority(task.priority); setTaskStatus(task.status);
    setTaskDueDate(task.dueDate ? task.dueDate.split('T')[0] : '');
    setTaskAssignee(task.assignedTo?._id || '');
    setEditingTask(task); setShowTaskForm(true);
  };

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    if (!taskTitle.trim()) { toast.error('Task title is required'); return; }
    try {
      const data = { title: taskTitle, description: taskDesc, priority: taskPriority, status: taskStatus, dueDate: taskDueDate || null, assignedTo: taskAssignee || null, project: id };
      if (editingTask) {
        await api.put(`/tasks/${editingTask._id}`, data);
        toast.success('Task updated');
      } else {
        await api.post('/tasks', data);
        toast.success('Task created');
      }
      setShowTaskForm(false); resetTaskForm(); loadData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save task'); }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
      loadData();
    } catch (err) { toast.error(err.response?.data?.message || 'Cannot update status'); }
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try { await api.delete(`/tasks/${taskId}`); toast.success('Task deleted'); loadData(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed to delete'); }
  };

  const addMember = async (e) => {
    e.preventDefault();
    if (!memberEmail.trim()) return;
    try {
      await api.post(`/projects/${id}/members`, { email: memberEmail });
      toast.success('Member added!'); setMemberEmail(''); loadData();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to add member'); }
  };

  const removeMember = async (userId) => {
    if (!window.confirm('Remove this member?')) return;
    try { await api.delete(`/projects/${id}/members/${userId}`); toast.success('Member removed'); loadData(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed to remove'); }
  };

  if (loading) return <div className="page-container"><div className="loading-state">Loading project...</div></div>;
  if (!project) return null;

  const todoTasks = tasks.filter(t => t.status === 'todo');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const doneTasks = tasks.filter(t => t.status === 'done');

  const priorityColors = { low: '#10b981', medium: '#f59e0b', high: '#f97316', urgent: '#ef4444' };

  return (
    <div className="page-container">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="btn-icon" onClick={() => navigate('/projects')}><ArrowLeft size={20} /></button>
          <div><h1>{project.name}</h1>{project.description && <p className="text-muted">{project.description}</p>}</div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary" onClick={() => setShowMembers(true)}><Users size={18} />Members ({project.members?.length})</button>
          {isAdmin && <button className="btn btn-primary" onClick={() => { resetTaskForm(); setShowTaskForm(true); }}><Plus size={18} />Add Task</button>}
        </div>
      </div>

      {/* Task Board - 3 columns */}
      <div className="task-board">
        {[
          { title: 'To Do', status: 'todo', items: todoTasks, color: '#f59e0b' },
          { title: 'In Progress', status: 'in_progress', items: inProgressTasks, color: '#3b82f6' },
          { title: 'Done', status: 'done', items: doneTasks, color: '#10b981' }
        ].map(column => (
          <div key={column.status} className="task-column">
            <div className="column-header">
              <span className="column-dot" style={{ background: column.color }}></span>
              <h3>{column.title}</h3>
              <span className="column-count">{column.items.length}</span>
            </div>
            <div className="column-tasks">
              {column.items.map(task => {
                const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';
                return (
                  <div key={task._id} className={`task-card ${isOverdue ? 'task-overdue' : ''}`}>
                    <div className="task-card-top">
                      <span className="task-title">{task.title}</span>
                      {isAdmin && (
                        <div className="task-actions">
                          <button className="btn-icon-sm" onClick={() => openEditTask(task)}><Edit3 size={14} /></button>
                          <button className="btn-icon-sm btn-danger-hover" onClick={() => deleteTask(task._id)}><Trash2 size={14} /></button>
                        </div>
                      )}
                    </div>
                    {task.description && <p className="task-desc">{task.description}</p>}
                    <div className="task-meta">
                      <span className="priority-badge" style={{ color: priorityColors[task.priority], borderColor: priorityColors[task.priority] }}>
                        <Flag size={12} />{task.priority}
                      </span>
                      {task.dueDate && (
                        <span className={`due-badge ${isOverdue ? 'overdue' : ''}`}>
                          <Calendar size={12} />{new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <div className="task-bottom">
                      {task.assignedTo ? (
                        <div className="assignee"><div className="mini-avatar">{task.assignedTo.name.charAt(0)}</div><span>{task.assignedTo.name}</span></div>
                      ) : <span className="text-muted" style={{ fontSize: '12px' }}>Unassigned</span>}
                      <select value={task.status} onChange={e => updateTaskStatus(task._id, e.target.value)} className="status-select">
                        <option value="todo">To Do</option>
                        <option value="in_progress">In Progress</option>
                        <option value="done">Done</option>
                      </select>
                    </div>
                  </div>
                );
              })}
              {column.items.length === 0 && <p className="column-empty">No tasks</p>}
            </div>
          </div>
        ))}
      </div>

      {/* Task Form Modal */}
      {showTaskForm && (
        <div className="modal-overlay" onClick={() => { setShowTaskForm(false); resetTaskForm(); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>{editingTask ? 'Edit Task' : 'Create Task'}</h2><button className="btn-icon" onClick={() => { setShowTaskForm(false); resetTaskForm(); }}><X size={20} /></button></div>
            <form onSubmit={handleTaskSubmit}>
              <div className="form-group"><label>Title</label><input type="text" value={taskTitle} onChange={e => setTaskTitle(e.target.value)} placeholder="Task title" autoFocus /></div>
              <div className="form-group"><label>Description</label><textarea value={taskDesc} onChange={e => setTaskDesc(e.target.value)} placeholder="Optional description" rows={3} /></div>
              <div className="form-row">
                <div className="form-group"><label>Priority</label><select value={taskPriority} onChange={e => setTaskPriority(e.target.value)}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option></select></div>
                <div className="form-group"><label>Status</label><select value={taskStatus} onChange={e => setTaskStatus(e.target.value)}><option value="todo">To Do</option><option value="in_progress">In Progress</option><option value="done">Done</option></select></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Due Date</label><input type="date" value={taskDueDate} onChange={e => setTaskDueDate(e.target.value)} /></div>
                <div className="form-group"><label>Assign To</label><select value={taskAssignee} onChange={e => setTaskAssignee(e.target.value)}><option value="">Unassigned</option>{project.members?.map(m => <option key={m.user._id} value={m.user._id}>{m.user.name}</option>)}</select></div>
              </div>
              <div className="modal-actions"><button type="button" className="btn btn-secondary" onClick={() => { setShowTaskForm(false); resetTaskForm(); }}>Cancel</button><button type="submit" className="btn btn-primary">{editingTask ? 'Update Task' : 'Create Task'}</button></div>
            </form>
          </div>
        </div>
      )}

      {/* Members Modal */}
      {showMembers && (
        <div className="modal-overlay" onClick={() => setShowMembers(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>Team Members</h2><button className="btn-icon" onClick={() => setShowMembers(false)}><X size={20} /></button></div>
            {isAdmin && (
              <form onSubmit={addMember} className="add-member-form">
                <input type="email" value={memberEmail} onChange={e => setMemberEmail(e.target.value)} placeholder="Enter email to add member" />
                <button type="submit" className="btn btn-primary"><UserPlus size={18} /></button>
              </form>
            )}
            <div className="members-list">
              {project.members?.map(m => (
                <div key={m.user._id} className="member-item">
                  <div className="member-info">
                    <div className="user-avatar">{m.user.name.charAt(0).toUpperCase()}</div>
                    <div><span className="member-name">{m.user.name}</span><span className="member-email">{m.user.email}</span></div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className={`role-badge ${m.role}`}>{m.role}</span>
                    {isAdmin && m.user._id !== user?._id && (
                      <button className="btn-icon-sm btn-danger-hover" onClick={() => removeMember(m.user._id)}><Trash2 size={14} /></button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
