const express = require('express');
const { body, validationResult } = require('express-validator');
const Project = require('../models/Project');
const User = require('../models/User');
const Task = require('../models/Task');
const auth = require('../middleware/auth');
const { projectMember, projectAdmin } = require('../middleware/roleGuard');

const router = express.Router();

// POST /api/projects - create a new project
router.post('/', auth, [
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Project name is required'),
  body('description').optional().trim().isLength({ max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { name, description } = req.body;

    const project = new Project({
      name,
      description: description || '',
      createdBy: req.user._id,
      members: [{
        user: req.user._id,
        role: 'admin'
      }]
    });

    await project.save();
    await project.populate('members.user', 'name email');

    res.status(201).json(project);
  } catch (err) {
    console.error('Create project error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/projects - get all projects user is part of
router.get('/', auth, async (req, res) => {
  try {
    const projects = await Project.find({
      'members.user': req.user._id
    })
    .populate('members.user', 'name email')
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 });

    // also get task counts for each project
    const projectsWithCounts = await Promise.all(
      projects.map(async (project) => {
        const taskCount = await Task.countDocuments({ project: project._id });
        const doneCount = await Task.countDocuments({ project: project._id, status: 'done' });
        return {
          ...project.toObject(),
          taskCount,
          doneCount
        };
      })
    );

    res.json(projectsWithCounts);
  } catch (err) {
    console.error('Get projects error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/projects/:id - get single project
router.get('/:id', auth, projectMember, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('members.user', 'name email')
      .populate('createdBy', 'name email');

    res.json(project);
  } catch (err) {
    console.error('Get project error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/projects/:id - update project (admin only)
router.put('/:id', auth, projectAdmin, [
  body('name').optional().trim().isLength({ min: 1, max: 100 }),
  body('description').optional().trim().isLength({ max: 500 })
], async (req, res) => {
  try {
    const { name, description } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (description !== undefined) updates.description = description;

    const project = await Project.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    ).populate('members.user', 'name email');

    res.json(project);
  } catch (err) {
    console.error('Update project error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/projects/:id - delete project (admin only)
router.delete('/:id', auth, projectAdmin, async (req, res) => {
  try {
    // delete all tasks in this project too
    await Task.deleteMany({ project: req.params.id });
    await Project.findByIdAndDelete(req.params.id);
    res.json({ message: 'Project deleted' });
  } catch (err) {
    console.error('Delete project error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/projects/:id/members - add member to project (admin only)
router.post('/:id/members', auth, projectAdmin, [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { email } = req.body;

    // find the user by email
    const userToAdd = await User.findOne({ email });
    if (!userToAdd) {
      return res.status(404).json({ message: 'No user found with that email' });
    }

    // check if already a member
    const alreadyMember = req.project.members.find(
      m => m.user.toString() === userToAdd._id.toString()
    );
    if (alreadyMember) {
      return res.status(400).json({ message: 'User is already a member' });
    }

    req.project.members.push({
      user: userToAdd._id,
      role: 'member'
    });
    await req.project.save();
    await req.project.populate('members.user', 'name email');

    res.json(req.project);
  } catch (err) {
    console.error('Add member error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/projects/:id/members/:userId - remove member (admin only)
router.delete('/:id/members/:userId', auth, projectAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    // can't remove yourself if you're the only admin
    if (userId === req.user._id.toString()) {
      const adminCount = req.project.members.filter(m => m.role === 'admin').length;
      if (adminCount <= 1) {
        return res.status(400).json({ message: 'Cannot remove the only admin' });
      }
    }

    req.project.members = req.project.members.filter(
      m => m.user.toString() !== userId
    );
    await req.project.save();

    // unassign any tasks that were assigned to this user
    await Task.updateMany(
      { project: req.params.id, assignedTo: userId },
      { assignedTo: null }
    );

    await req.project.populate('members.user', 'name email');
    res.json(req.project);
  } catch (err) {
    console.error('Remove member error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
