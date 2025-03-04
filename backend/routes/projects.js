const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const auth = require('../middleware/auth');

// Get project statistics
router.get('/stats', auth, async (req, res) => {
    try {
        // Get status distribution
        const statusDistribution = await Project.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        // Get category distribution
        const categoryDistribution = await Project.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } }
        ]);

        // Get activity timeline (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const activityTimeline = await Project.aggregate([
            {
                $match: {
                    submissionDate: { $gte: sevenDaysAgo }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$submissionDate' } },
                    submissions: { $sum: 1 },
                    reviews: {
                        $sum: {
                            $cond: [
                                { $in: ['$status', ['APPROVED', 'REJECTED']] },
                                1,
                                0
                            ]
                        }
                    }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Get recent activities
        const recentActivities = await Project.find()
            .populate('submittedBy', 'firstName lastName')
            .sort({ submissionDate: -1 })
            .limit(5)
            .select('title status submissionDate submittedBy');

        // Format the response
        const formattedResponse = {
            statusDistribution: statusDistribution.reduce((acc, curr) => {
                acc[curr._id.toLowerCase()] = curr.count;
                return acc;
            }, {}),
            categoryDistribution: categoryDistribution.reduce((acc, curr) => {
                acc[curr._id] = curr.count;
                return acc;
            }, {}),
            activityTimeline: activityTimeline,
            recentActivities: recentActivities.map(activity => ({
                type: activity.status === 'PENDING' ? 'submission' : 'review',
                timestamp: activity.submissionDate,
                studentName: `${activity.submittedBy.firstName} ${activity.submittedBy.lastName}`,
                description: `${activity.title} project ${activity.status === 'PENDING' ? 'submitted' : activity.status.toLowerCase()}`
            }))
        };

        res.json(formattedResponse);
    } catch (error) {
        console.error('Error fetching project stats:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get all projects
router.get('/', auth, async (req, res) => {
    try {
        const projects = await Project.find()
            .populate('submittedBy', 'firstName lastName enrollmentNumber')
            .sort({ submissionDate: -1 });
        res.json(projects);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get projects by student ID
router.get('/student/:studentId', auth, async (req, res) => {
    try {
        const projects = await Project.find({ submittedBy: req.params.studentId })
            .populate('submittedBy', 'firstName lastName enrollmentNumber')
            .sort({ submissionDate: -1 });
        res.json(projects);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get project by ID
router.get('/:id', auth, async (req, res) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate('submittedBy', 'firstName lastName enrollmentNumber');
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }
        res.json(project);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Submit new project
router.post('/', auth, async (req, res) => {
    try {
        if (req.user.role !== 'student') {
            return res.status(403).json({ message: 'Only students can submit projects' });
        }

        const project = new Project({
            title: req.body.title,
            description: req.body.description,
            category: req.body.category,
            technologies: req.body.technologies,
            submittedBy: req.user.id,
            githubUrl: req.body.githubUrl,
            files: req.body.files
        });

        const newProject = await project.save();
        await newProject.populate('submittedBy', 'firstName lastName enrollmentNumber');
        res.status(201).json(newProject);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update project (for feedback and status)
router.patch('/:id', auth, async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Only faculty can update status and feedback
        if (req.user.role === 'faculty') {
            if (req.body.status) project.status = req.body.status;
            if (req.body.feedback) project.feedback = req.body.feedback;
        } 
        // Students can only update their own projects
        else if (req.user.role === 'student' && project.submittedBy.toString() === req.user.id) {
            if (req.body.title) project.title = req.body.title;
            if (req.body.description) project.description = req.body.description;
            if (req.body.category) project.category = req.body.category;
            if (req.body.technologies) project.technologies = req.body.technologies;
            if (req.body.githubUrl) project.githubUrl = req.body.githubUrl;
            if (req.body.files) project.files = req.body.files;
        } else {
            return res.status(403).json({ message: 'Not authorized to update this project' });
        }

        const updatedProject = await project.save();
        await updatedProject.populate('submittedBy', 'firstName lastName enrollmentNumber');
        res.json(updatedProject);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete project
router.delete('/:id', auth, async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Only allow deletion by the student who submitted it or faculty
        if (req.user.role !== 'faculty' && project.submittedBy.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to delete this project' });
        }

        await project.remove();
        res.json({ message: 'Project deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;