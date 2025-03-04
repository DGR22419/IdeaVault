const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 8080;

// Sample user data (replace with database in production)
const users = {
    students: [
        { id: '1', email: 'student@example.com', password: 'password123', name: 'John Student', role: 'student' }
    ],
    faculty: [
        { id: '1', email: 'faculty@example.com', password: 'password123', name: 'Dr. Smith', role: 'faculty' }
    ]
};

// Enable CORS with specific options
app.use(cors({
    origin: 'http://localhost:8080',
    credentials: true
}));

// Body parsing middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname)));

// Authentication endpoint
app.post('/api/auth/login', (req, res) => {
    const { email, password, userType } = req.body;
    console.log('Login attempt:', { email, userType });

    // Find user based on type and credentials
    const userList = userType === 'faculty' ? users.faculty : users.students;
    const user = userList.find(u => u.email === email && u.password === password);

    if (user) {
        // In production, use proper JWT token generation
        const token = 'sample-token-' + Date.now();
        
        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } else {
        res.status(401).json({
            success: false,
            message: 'Invalid credentials'
        });
    }
});

// API endpoints for projects (sample data)
app.get('/api/students/:studentId/projects', (req, res) => {
    // Sample project data
    res.json([
        {
            id: '1',
            title: 'AI Image Recognition',
            category: 'AI',
            description: 'A machine learning project that recognizes objects in images using TensorFlow.',
            status: 'Approved',
            technologies: ['Python', 'TensorFlow', 'OpenCV'],
            githubLink: 'https://github.com/example/ai-image'
        },
        {
            id: '2',
            title: 'E-commerce Platform',
            category: 'Web',
            description: 'A full-stack e-commerce website with user authentication and payment integration.',
            status: 'Pending',
            technologies: ['React', 'Node.js', 'MongoDB'],
            githubLink: 'https://github.com/example/ecommerce'
        }
    ]);
});

// Serve specific HTML files
app.get('/*.html', (req, res) => {
    res.sendFile(path.join(__dirname, req.path));
});

// Serve home page for root URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'home', 'index.html'));
});

// Handle all other routes
app.get('*', (req, res) => {
    // Check if it's a known route
    const knownRoutes = ['/dashboard', '/projects', '/profile'];
    const route = knownRoutes.find(r => req.path.startsWith(r));
    
    if (route) {
        // For known routes, serve the home page and let client-side routing handle it
        res.sendFile(path.join(__dirname, 'home', 'index.html'));
    } else {
        // For unknown routes, redirect to login
        res.redirect('/login/login.html');
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Login page: http://localhost:${PORT}/login/login.html`);
    console.log(`Home page: http://localhost:${PORT}/home/index.html`);
}); 