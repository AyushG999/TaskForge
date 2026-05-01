const Project = require('../models/Project');

// check if user is a member of the project (any role)
const projectMember = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.params.id || req.body.project;
    
    if (!projectId) {
      return res.status(400).json({ message: 'Project ID is required' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const membership = project.members.find(
      m => m.user.toString() === req.user._id.toString()
    );

    if (!membership) {
      return res.status(403).json({ message: 'You are not a member of this project' });
    }

    req.project = project;
    req.membership = membership;
    next();
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// check if user is admin of the project
const projectAdmin = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.params.id || req.body.project;
    
    if (!projectId) {
      return res.status(400).json({ message: 'Project ID is required' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const membership = project.members.find(
      m => m.user.toString() === req.user._id.toString()
    );

    if (!membership || membership.role !== 'admin') {
      return res.status(403).json({ message: 'Only project admins can do this' });
    }

    req.project = project;
    req.membership = membership;
    next();
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { projectMember, projectAdmin };
