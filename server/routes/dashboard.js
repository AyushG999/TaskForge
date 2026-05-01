const express = require('express');
const Task = require('../models/Task');
const Project = require('../models/Project');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/dashboard/stats - get overall stats for current user
router.get('/stats', auth, async (req, res) => {
  try {
    // get all projects user is part of
    const projects = await Project.find({ 'members.user': req.user._id });
    const projectIds = projects.map(p => p._id);

    // get all tasks in those projects
    const allTasks = await Task.find({ project: { $in: projectIds } })
      .populate('assignedTo', 'name email');

    const now = new Date();

    // total tasks
    const totalTasks = allTasks.length;

    // tasks by status
    const todoCount = allTasks.filter(t => t.status === 'todo').length;
    const inProgressCount = allTasks.filter(t => t.status === 'in_progress').length;
    const doneCount = allTasks.filter(t => t.status === 'done').length;

    // overdue tasks (past due date and not done)
    const overdueTasks = allTasks.filter(
      t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'done'
    );

    // tasks per user
    const tasksByUser = {};
    allTasks.forEach(task => {
      if (task.assignedTo) {
        const userId = task.assignedTo._id.toString();
        if (!tasksByUser[userId]) {
          tasksByUser[userId] = {
            user: { _id: task.assignedTo._id, name: task.assignedTo.name, email: task.assignedTo.email },
            total: 0,
            todo: 0,
            in_progress: 0,
            done: 0
          };
        }
        tasksByUser[userId].total++;
        tasksByUser[userId][task.status]++;
      }
    });

    // my tasks (assigned to current user)
    const myTasks = allTasks.filter(
      t => t.assignedTo && t.assignedTo._id.toString() === req.user._id.toString()
    );

    res.json({
      totalTasks,
      statusBreakdown: {
        todo: todoCount,
        in_progress: inProgressCount,
        done: doneCount
      },
      overdueCount: overdueTasks.length,
      overdueTasks: overdueTasks.map(t => ({
        _id: t._id,
        title: t.title,
        dueDate: t.dueDate,
        project: t.project,
        priority: t.priority
      })),
      tasksByUser: Object.values(tasksByUser),
      myTasksCount: myTasks.length,
      projectCount: projects.length
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/dashboard/project/:id/stats - per project stats
router.get('/project/:id/stats', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // make sure user is a member
    const isMember = project.members.find(
      m => m.user.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const tasks = await Task.find({ project: req.params.id })
      .populate('assignedTo', 'name email');

    const now = new Date();

    res.json({
      totalTasks: tasks.length,
      todo: tasks.filter(t => t.status === 'todo').length,
      in_progress: tasks.filter(t => t.status === 'in_progress').length,
      done: tasks.filter(t => t.status === 'done').length,
      overdue: tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'done').length
    });
  } catch (err) {
    console.error('Project stats error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
