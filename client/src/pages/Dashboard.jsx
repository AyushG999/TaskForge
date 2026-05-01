import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, CheckCircle2, Clock, AlertTriangle, 
  FolderOpen, Users, ArrowRight 
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/dashboard/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-state">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="text-muted">Welcome back, {user?.name}</p>
        </div>
        <Link to="/projects" className="btn btn-primary">
          <FolderOpen size={18} />
          View Projects
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#6366f11a', color: '#6366f1' }}>
            <LayoutDashboard size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats?.totalTasks || 0}</span>
            <span className="stat-label">Total Tasks</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#f59e0b1a', color: '#f59e0b' }}>
            <Clock size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats?.statusBreakdown?.todo || 0}</span>
            <span className="stat-label">To Do</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#3b82f61a', color: '#3b82f6' }}>
            <ArrowRight size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats?.statusBreakdown?.in_progress || 0}</span>
            <span className="stat-label">In Progress</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#10b9811a', color: '#10b981' }}>
            <CheckCircle2 size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats?.statusBreakdown?.done || 0}</span>
            <span className="stat-label">Completed</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#ef44441a', color: '#ef4444' }}>
            <AlertTriangle size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats?.overdueCount || 0}</span>
            <span className="stat-label">Overdue</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#8b5cf61a', color: '#8b5cf6' }}>
            <FolderOpen size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats?.projectCount || 0}</span>
            <span className="stat-label">Projects</span>
          </div>
        </div>
      </div>

      {/* Two column layout */}
      <div className="dashboard-grid">
        {/* Overdue Tasks */}
        <div className="dashboard-section">
          <h2>
            <AlertTriangle size={20} className="section-icon text-danger" />
            Overdue Tasks
          </h2>
          {stats?.overdueTasks?.length > 0 ? (
            <div className="overdue-list">
              {stats.overdueTasks.map(task => (
                <div key={task._id} className="overdue-item">
                  <div className="overdue-info">
                    <span className="overdue-title">{task.title}</span>
                    <span className="overdue-date">
                      Due: {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                  <span className={`priority-badge priority-${task.priority}`}>
                    {task.priority}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">No overdue tasks. Nice work!</p>
          )}
        </div>

        {/* Tasks by User */}
        <div className="dashboard-section">
          <h2>
            <Users size={20} className="section-icon" />
            Tasks per User
          </h2>
          {stats?.tasksByUser?.length > 0 ? (
            <div className="user-tasks-list">
              {stats.tasksByUser.map(item => (
                <div key={item.user._id} className="user-task-item">
                  <div className="user-avatar">
                    {item.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="user-task-info">
                    <span className="user-name">{item.user.name}</span>
                    <div className="user-task-breakdown">
                      <span className="mini-badge todo">{item.todo} todo</span>
                      <span className="mini-badge progress">{item.in_progress} active</span>
                      <span className="mini-badge done">{item.done} done</span>
                    </div>
                  </div>
                  <span className="user-task-total">{item.total}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">No tasks assigned yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
