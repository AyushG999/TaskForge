const express = require('express');
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const Project = require('../models/Project');
const auth = require('../middleware/auth');
const { projectMember, projectAdmin } = require('../middleware/roleGuard');

const router = express.Router();

// POST /api/tasks - create a task (admin only)
router.post('/', auth, [
  body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Task title is required'),
  body('project').isMongoId().withMessage('Valid project ID is required'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('status').optional().isIn(['todo', 'in_progress', 'done']),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('assignedTo').optional({ nullable: true }).isMongoId()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    // check if user is admin of this project
    const project = await Project.findById(req.body.project);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const membership = project.members.find(
      m => m.user.toString() === req.user._id.toString()
    );
    if (!membership || membership.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can create tasks' });
    }

    // if assignedTo is provided, check the user is a project member
    if (req.body.assignedTo) {
      const isMember = project.members.find(
        m => m.user.toString() === req.body.assignedTo
      );
      if (!isMember) {
        return res.status(400).json({ message: 'Assigned user is not a project member' });
      }
    }

    const task = new Task({
      title: req.body.title,
      description: req.body.description || '',
      project: req.body.project,
      assignedTo: req.body.assignedTo || null,
      createdBy: req.user._id,
      status: req.body.status || 'todo',
      priority: req.body.priority || 'medium',
      dueDate: req.body.dueDate || null
    });

    await task.save();
    await task.populate('assignedTo', 'name email');
    await task.populate('createdBy', 'name email');

    res.status(201).json(task);
  } catch (err) {
    console.error('Create task error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/tasks/project/:projectId - get all tasks for a project
router.get('/project/:projectId', auth, projectMember, async (req, res) => {
  try {
    const tasks = await Task.find({ project: req.params.projectId })
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (err) {
    console.error('Get tasks error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/tasks/:id - get single task
router.get('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('project', 'name');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // check user is member of the project
    const project = await Project.findById(task.project._id || task.project);
    const isMember = project.members.find(
      m => m.user.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(task);
  } catch (err) {
    console.error('Get task error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/tasks/:id - update task
// admins can update everything, members can only update status of their assigned tasks
router.put('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const project = await Project.findById(task.project);
    const membership = project.members.find(
      m => m.user.toString() === req.user._id.toString()
    );

    if (!membership) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (membership.role === 'admin') {
      // admins can update everything
      if (req.body.title) task.title = req.body.title;
      if (req.body.description !== undefined) task.description = req.body.description;
      if (req.body.status) task.status = req.body.status;
      if (req.body.priority) task.priority = req.body.priority;
      if (req.body.dueDate !== undefined) task.dueDate = req.body.dueDate;
      if (req.body.assignedTo !== undefined) task.assignedTo = req.body.assignedTo;
    } else {
      // members can only update status of tasks assigned to them
      if (!task.assignedTo || task.assignedTo.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'You can only update tasks assigned to you' });
      }
      if (req.body.status) {
        task.status = req.body.status;
      } else {
        return res.status(400).json({ message: 'Members can only update task status' });
      }
    }

    await task.save();
    await task.populate('assignedTo', 'name email');
    await task.populate('createdBy', 'name email');

    res.json(task);
  } catch (err) {
    console.error('Update task error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/tasks/:id - delete task (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const project = await Project.findById(task.project);
    const membership = project.members.find(
      m => m.user.toString() === req.user._id.toString()
    );

    if (!membership || membership.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can delete tasks' });
    }

    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    console.error('Delete task error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
