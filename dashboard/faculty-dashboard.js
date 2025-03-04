const API_BASE_URL = 'http://localhost:8080';

// Add detailed debugging logs
console.log('=== Authentication Debug Start ===');
console.log('All session storage items:', {
    keys: Object.keys(sessionStorage),
    length: sessionStorage.length
});

// Log each item individually
for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    console.log(`Item ${i}:`, {
        key: key,
        value: sessionStorage.getItem(key)
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // Add detailed debugging logs
    console.log('=== Authentication Debug Start ===');
    console.log('All session storage items:', {
        keys: Object.keys(sessionStorage),
        length: sessionStorage.length
    });

    // Log each item individually
    for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        console.log(`Item ${i}:`, {
            key: key,
            value: sessionStorage.getItem(key)
        });
    }

    // Check if user is logged in and has valid faculty ID
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    const facultyId = sessionStorage.getItem('facultyId');
    const token = sessionStorage.getItem('token');
    const userType = sessionStorage.getItem('userType');

    // Debug log to see what values we have
    console.log('Authentication Check Values:', {
        isLoggedIn: isLoggedIn,
        facultyId: facultyId,
        token: token,
        userType: userType
    });

    // Check each value with detailed logging
    if (!isLoggedIn) {
        console.error('Authentication Failed: isLoggedIn is missing or false');
        sessionStorage.clear();
        window.location.href = '/login/login.html';
        return;
    }

    if (!facultyId) {
        console.error('Authentication Failed: facultyId is missing');
        sessionStorage.clear();
        window.location.href = '/login/login.html';
        return;
    }

    if (!token) {
        console.error('Authentication Failed: token is missing');
        sessionStorage.clear();
        window.location.href = '/login/login.html';
        return;
    }

    if (userType !== 'faculty') {
        console.error('Authentication Failed: incorrect userType', {
            expected: 'faculty',
            actual: userType
        });
        sessionStorage.clear();
        window.location.href = '/login/login.html';
        return;
    }

    console.log('=== Authentication Debug End ===');

    // Get user info
    const userName = sessionStorage.getItem('facultyName');
    
    // Update UI with user info
    document.getElementById('userName').textContent = userName || 'Faculty';
    document.getElementById('userRole').textContent = 'Faculty';

    // Update navbar brand to prevent homepage redirection
    const navbarBrand = document.querySelector('.navbar-brand');
    if (navbarBrand) {
        navbarBrand.href = '#';
    }

    // Check for URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const section = urlParams.get('section');
    
    // Load initial section
    if (section) {
        showDashboardSection(section);
    } else {
        showDashboardSection('projectReview');
    }

    // Initialize event listeners
    initializeEventListeners();
});

// Initialize Event Listeners
function initializeEventListeners() {
    // Search Projects
    const searchInput = document.getElementById('searchProjects');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleProjectSearch, 300));
    }

    // Category Filter
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', handleProjectFilter);
    }

    // Sort Filter
    const sortFilter = document.getElementById('sortFilter');
    if (sortFilter) {
        sortFilter.addEventListener('change', handleProjectSort);
    }
}

// Dashboard Section Management
function showDashboardSection(section) {
    // Update active menu item
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`.menu-item[onclick*="${section}"]`).classList.add('active');

    // Hide all sections
    document.querySelectorAll('.dashboard-section').forEach(el => {
        el.style.display = 'none';
    });
    
    // Show selected section
    switch(section) {
        case 'projectReview':
            document.getElementById('projectReviewSection').style.display = 'block';
            loadProjects();
            break;
        case 'studentProgress':
            document.getElementById('studentProgressSection').style.display = 'block';
            loadProgress();
            break;
        case 'browseProjects':
            document.getElementById('browseProjectsSection').style.display = 'block';
            loadAllProjects();
            break;
        case 'feedback':
            document.getElementById('feedbackSection').style.display = 'block';
            loadFeedbackHistory();
            break;
        case 'settings':
            document.getElementById('settingsSection').style.display = 'block';
            loadUserSettings();
            break;
    }
}

async function makeAuthenticatedRequest(url, options = {}) {
    const token = sessionStorage.getItem('token');
    const facultyId = sessionStorage.getItem('facultyId');

    if (!token || !facultyId) {
        console.error('Missing authentication data:', { hasToken: !!token, hasFacultyId: !!facultyId });
        sessionStorage.clear();
        window.location.href = '../login/login.html';
        throw new Error('Authentication required. Please log in again.');
    }

    const headers = {
        'Authorization': `Bearer ${token}`,
        ...options.headers
    };

    const response = await fetch(url, { ...options, headers });
    if (response.status === 401) {
        console.error('Authentication failed');
        sessionStorage.clear();
        window.location.href = '../login/login.html';
        throw new Error('Session expired. Please log in again.');
    }
    return response;
}

// Project Review Functions
async function loadProjects() {
    const projectsList = document.getElementById('projectsList');
    
    try {
        // Static data for demonstration
        const projects = [
            {
                _id: '1',
                title: 'AI Chat Application',
                status: 'PENDING',
                studentName: 'John Doe',
                submissionDate: new Date().toISOString(),
                category: 'AI & Machine Learning',
                description: 'A chatbot application using natural language processing.',
                technologies: ['Python', 'TensorFlow', 'Flask'],
                githubLink: 'https://github.com/johndoe/ai-chat'
            },
            {
                _id: '2',
                title: 'E-commerce Platform',
                status: 'PENDING',
                studentName: 'Jane Smith',
                submissionDate: new Date().toISOString(),
                category: 'Web Development',
                description: 'A full-stack e-commerce platform with payment integration.',
                technologies: ['React', 'Node.js', 'MongoDB'],
                githubLink: 'https://github.com/janesmith/ecommerce'
            },
            {
                _id: '3',
                title: 'IoT Weather Station',
                status: 'PENDING',
                studentName: 'Mike Johnson',
                submissionDate: new Date().toISOString(),
                category: 'Internet of Things',
                description: 'A weather monitoring system using IoT sensors.',
                technologies: ['Arduino', 'ESP32', 'C++'],
                githubLink: 'https://github.com/mikej/iot-weather'
            }
        ];

        projectsList.innerHTML = projects.map(project => `
            <div class="project-card" data-status="${project.status.toLowerCase()}">
                <div class="project-title">${project.title}</div>
                <div class="project-info">
                    <span><i class="fas fa-user me-1"></i>${project.studentName}</span>
                    <span><i class="fas fa-calendar me-1"></i>${new Date(project.submissionDate).toLocaleDateString()}</span>
                    <span class="badge ${getStatusBadgeClass(project.status)}">${project.status}</span>
                </div>
                <div class="project-category">
                    <i class="fas fa-tag me-1"></i>${project.category}
                </div>
                <p class="project-description">${project.description}</p>
                <div class="project-tech-stack">
                    ${project.technologies.map(tech => `
                        <span class="tech-badge">${tech}</span>
                    `).join('')}
                </div>
                <div class="project-actions mt-3">
                    <button class="btn btn-success btn-sm" onclick="approveProject('${project._id}')">
                        <i class="fas fa-check me-1"></i>Approve
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="rejectProject('${project._id}')">
                        <i class="fas fa-times me-1"></i>Reject
                    </button>
                    <button class="btn btn-primary btn-sm" onclick="provideFeedback('${project._id}')">
                        <i class="fas fa-comment me-1"></i>Feedback
                    </button>
                    ${project.githubLink ? `
                        <a href="${project.githubLink}" target="_blank" class="btn btn-secondary btn-sm">
                            <i class="fab fa-github me-1"></i>View Code
                        </a>
                    ` : ''}
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading projects:', error);
        showNotification('Failed to load projects', 'error');
    }
}

// Project Actions
async function approveProject(projectId) {
    try {
        // Simulate API call success
        showNotification('Project approved successfully!', 'success');
        loadProjects();
    } catch (error) {
        console.error('Error approving project:', error);
        showNotification('Failed to approve project', 'error');
    }
}

async function rejectProject(projectId) {
    try {
        // Simulate API call success
        showNotification('Project rejected', 'success');
        loadProjects();
    } catch (error) {
        console.error('Error rejecting project:', error);
        showNotification('Failed to reject project', 'error');
    }
}

function provideFeedback(projectId) {
    document.getElementById('projectIdForFeedback').value = projectId;
    const modal = new bootstrap.Modal(document.getElementById('feedbackModal'));
    modal.show();
}

async function submitFeedback() {
    const form = document.getElementById('feedbackForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const projectId = document.getElementById('projectIdForFeedback').value;
    const feedbackType = document.getElementById('feedbackType').value;
    const comment = document.getElementById('feedbackComment').value;

    try {
        // Simulate API call success
        showNotification('Feedback submitted successfully!', 'success');
        const modal = bootstrap.Modal.getInstance(document.getElementById('feedbackModal'));
        modal.hide();
        loadProjects();
    } catch (error) {
        console.error('Error submitting feedback:', error);
        showNotification('Failed to submit feedback', 'error');
    }
}

// Browse Projects Functions
let allProjects = [];

async function loadAllProjects() {
    try {
        // For now using static data since API is not ready
        allProjects = [
            {
                _id: '1',
                title: 'AI Chat Application',
                description: 'A chatbot application using natural language processing.',
                category: 'AI & ML',
                technologies: ['Python', 'TensorFlow', 'Flask'],
                submittedBy: { firstName: 'John', lastName: 'Doe' },
                submissionDate: new Date().toISOString(),
                status: 'PENDING',
                githubUrl: 'https://github.com/example/ai-chat'
            },
            {
                _id: '2',
                title: 'E-commerce Platform',
                description: 'A full-stack e-commerce platform with payment integration.',
                category: 'Web Development',
                technologies: ['React', 'Node.js', 'MongoDB'],
                submittedBy: { firstName: 'Jane', lastName: 'Smith' },
                submissionDate: new Date().toISOString(),
                status: 'APPROVED',
                githubUrl: 'https://github.com/example/ecommerce'
            },
            {
                _id: '3',
                title: 'Smart Home IoT',
                description: 'IoT-based home automation system.',
                category: 'IoT',
                technologies: ['Arduino', 'ESP32', 'MQTT'],
                submittedBy: { firstName: 'Mike', lastName: 'Johnson' },
                submissionDate: new Date().toISOString(),
                status: 'PENDING',
                githubUrl: 'https://github.com/example/smart-home'
            }
        ];
        
        displayProjects(allProjects);
    } catch (error) {
        console.error('Error loading projects:', error);
        showNotification('Failed to load projects', 'error');
    }
}

function displayProjects(projects) {
    const projectsList = document.getElementById('browseProjectsList');
    if (!projectsList) return;

    projectsList.innerHTML = projects.map(project => `
        <div class="project-card">
            <div class="project-header">
                <h4 class="project-title">${project.title}</h4>
                <span class="badge ${getStatusBadgeClass(project.status)}">${project.status}</span>
            </div>
            <div class="project-info">
                <p class="project-description">${project.description}</p>
                <div class="project-meta">
                    <span class="category"><i class="fas fa-tag"></i> ${project.category}</span>
                    <span class="student"><i class="fas fa-user"></i> ${project.submittedBy.firstName} ${project.submittedBy.lastName}</span>
                    <span class="date"><i class="fas fa-calendar"></i> ${new Date(project.submissionDate).toLocaleDateString()}</span>
                </div>
                <div class="project-tech-stack">
                    ${project.technologies.map(tech => `<span class="tech-badge">${tech}</span>`).join('')}
                </div>
            </div>
            <div class="project-actions">
                <button class="btn btn-primary btn-sm" onclick="viewProjectDetails('${project._id}')">
                    <i class="fas fa-info-circle"></i> View Details
                </button>
                ${project.githubUrl ? `
                    <a href="${project.githubUrl}" target="_blank" class="btn btn-secondary btn-sm">
                        <i class="fab fa-github"></i> View Code
                    </a>
                ` : ''}
                <button class="btn btn-outline-primary btn-sm" onclick="provideFeedback('${project._id}')">
                    <i class="fas fa-comment"></i> Feedback
                </button>
            </div>
        </div>
    `).join('');
}

function handleProjectSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    const filteredProjects = allProjects.filter(project => 
        project.title.toLowerCase().includes(searchTerm) ||
        project.description.toLowerCase().includes(searchTerm) ||
        project.technologies.some(tech => tech.toLowerCase().includes(searchTerm))
    );
    displayProjects(filteredProjects);
}

function handleProjectFilter(e) {
    const category = e.target.value;
    const filteredProjects = category === 'all' 
        ? allProjects 
        : allProjects.filter(project => project.category === category);
    displayProjects(filteredProjects);
}

function handleProjectSort(e) {
    const sortType = e.target.value;
    const sortedProjects = [...allProjects];
    
    switch(sortType) {
        case 'newest':
            sortedProjects.sort((a, b) => new Date(b.submissionDate) - new Date(a.submissionDate));
            break;
        case 'oldest':
            sortedProjects.sort((a, b) => new Date(a.submissionDate) - new Date(b.submissionDate));
            break;
        case 'title':
            sortedProjects.sort((a, b) => a.title.localeCompare(b.title));
            break;
    }
    
    displayProjects(sortedProjects);
}

// Progress Functions
async function loadProgress() {
    try {
        // Try to fetch real-time data from the API
        let data;
        try {
            const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/projects/stats`);
            if (!response.ok) throw new Error('Failed to fetch progress data');
            data = await response.json();
        } catch (error) {
            console.warn('Using fallback data due to API error:', error);
            // Fallback data if API fails
            data = {
                statusDistribution: {
                    approved: 8,
                    pending: 5,
                    rejected: 2
                },
                categoryDistribution: {
                    'Web Development': 6,
                    'Mobile Apps': 3,
                    'AI & ML': 4,
                    'IoT': 2
                },
                activityTimeline: [
                    { date: '2024-03-01', submissions: 3, reviews: 2 },
                    { date: '2024-03-02', submissions: 4, reviews: 3 },
                    { date: '2024-03-03', submissions: 2, reviews: 4 },
                    { date: '2024-03-04', submissions: 5, reviews: 3 },
                    { date: '2024-03-05', submissions: 3, reviews: 5 }
                ],
                recentActivities: [
                    {
                        type: 'submission',
                        timestamp: new Date().toISOString(),
                        studentName: 'John Doe',
                        description: 'Submitted AI Chat Application project'
                    },
                    {
                        type: 'review',
                        timestamp: new Date(Date.now() - 86400000).toISOString(),
                        studentName: 'Jane Smith',
                        description: 'E-commerce Platform project approved'
                    },
                    {
                        type: 'feedback',
                        timestamp: new Date(Date.now() - 172800000).toISOString(),
                        studentName: 'Mike Johnson',
                        description: 'Received feedback on IoT Weather Station'
                    }
                ]
            };
        }

        // Clear existing charts if they exist
        const charts = ['projectStatusChart', 'categoryDistributionChart', 'activityTimelineChart'].map(id => 
            Chart.getChart(document.getElementById(id))
        );
        charts.forEach(chart => chart?.destroy());

        // Create Project Status Distribution Chart
        const statusCtx = document.getElementById('projectStatusChart').getContext('2d');
        new Chart(statusCtx, {
            type: 'doughnut',
            data: {
                labels: ['Approved', 'Pending', 'Rejected'],
                datasets: [{
                    data: [
                        data.statusDistribution.approved || 0,
                        data.statusDistribution.pending || 0,
                        data.statusDistribution.rejected || 0
                    ],
                    backgroundColor: [
                        '#28a745', // Success green
                        '#ffc107', // Warning yellow
                        '#dc3545'  // Danger red
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    title: {
                        display: true,
                        text: 'Project Status Distribution'
                    }
                }
            }
        });

        // Create Category Distribution Chart
        const categoryData = Object.entries(data.categoryDistribution || {});
        const categoryCtx = document.getElementById('categoryDistributionChart').getContext('2d');
        new Chart(categoryCtx, {
            type: 'bar',
            data: {
                labels: categoryData.map(([category]) => category),
                datasets: [{
                    label: 'Projects per Category',
                    data: categoryData.map(([, count]) => count),
                    backgroundColor: '#3498db',
                    borderColor: '#2980b9',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: 'Projects by Category'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });

        // Create Activity Timeline Chart
        const activityData = data.activityTimeline || [];
        const activityCtx = document.getElementById('activityTimelineChart').getContext('2d');
        new Chart(activityCtx, {
            type: 'line',
            data: {
                labels: activityData.map(item => new Date(item.date).toLocaleDateString()),
                datasets: [{
                    label: 'Project Submissions',
                    data: activityData.map(item => item.submissions),
                    borderColor: '#3498db',
                    backgroundColor: '#3498db20',
                    tension: 0.4,
                    fill: true
                }, {
                    label: 'Project Reviews',
                    data: activityData.map(item => item.reviews),
                    borderColor: '#2ecc71',
                    backgroundColor: '#2ecc7120',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Activity Timeline'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });

        // Update Recent Activities Timeline
        const activityTimeline = document.getElementById('activityTimeline');
        activityTimeline.innerHTML = data.recentActivities.map(activity => `
            <div class="timeline-item">
                <div class="timeline-icon ${getStatusIconClass(activity.type)}">
                    <i class="fas ${getStatusIcon(activity.type)}"></i>
                </div>
                <div class="timeline-content">
                    <div class="timeline-date">${new Date(activity.timestamp).toLocaleDateString()}</div>
                    <h6>${activity.studentName}</h6>
                    <p class="mb-0">${activity.description}</p>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error in loadProgress:', error);
        showNotification('Failed to load progress data', 'error');
    }
}

// Feedback History Functions
async function loadFeedbackHistory() {
    const feedbackList = document.getElementById('feedbackList');
    
    try {
        // Static data for demonstration
        const feedbackHistory = [
            {
                projectId: '1',
                projectTitle: 'AI Chat Application',
                studentName: 'John Doe',
                feedbackType: 'improvement',
                comment: 'Consider adding error handling for edge cases.',
                date: new Date().toISOString(),
                status: 'pending'
            },
            {
                projectId: '2',
                projectTitle: 'E-commerce Platform',
                studentName: 'Jane Smith',
                feedbackType: 'praise',
                comment: 'Excellent implementation of the payment system.',
                date: new Date().toISOString(),
                status: 'approved'
            },
            {
                projectId: '3',
                projectTitle: 'IoT Weather Station',
                studentName: 'Mike Johnson',
                feedbackType: 'suggestion',
                comment: 'Could add data visualization for historical weather data.',
                date: new Date().toISOString(),
                status: 'approved'
            }
        ];

        feedbackList.innerHTML = feedbackHistory.map(feedback => `
            <div class="feedback-item">
                <div class="feedback-header">
                    <div>
                        <h5 class="feedback-project mb-1">${feedback.projectTitle}</h5>
                        <p class="text-muted mb-0">Student: ${feedback.studentName}</p>
                    </div>
                    <span class="badge ${getFeedbackBadgeClass(feedback.status)}">${feedback.status}</span>
                </div>
                <div class="feedback-content">
                    <p class="mb-1"><strong>Type:</strong> ${feedback.feedbackType}</p>
                    <p class="mb-0">${feedback.comment}</p>
                </div>
                <div class="feedback-footer">
                    <small class="text-muted">${new Date(feedback.date).toLocaleDateString()}</small>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading feedback history:', error);
        showNotification('Failed to load feedback history', 'error');
    }
}

// Settings Functions
async function loadUserSettings() {
    const facultyId = sessionStorage.getItem('facultyId');
    
    try {
        const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/faculty/${facultyId}`);
        if (!response.ok) throw new Error('Failed to fetch user settings');
        
        const settings = await response.json();
        populateSettingsForm(settings);
    } catch (error) {
        console.error('Error loading settings:', error);
        showNotification('Failed to load settings', 'error');
    }
}

function populateSettingsForm(settings) {
    document.getElementById('fullName').value = settings.name || '';
    document.getElementById('email').value = settings.email || '';
    document.getElementById('department').value = settings.department || '';
    document.getElementById('emailNotifications').checked = settings.notifications?.email || false;
    document.getElementById('projectUpdates').checked = settings.notifications?.projects || false;
    document.getElementById('feedbackNotifications').checked = settings.notifications?.feedback || false;
}

async function saveSettings() {
    const facultyId = sessionStorage.getItem('facultyId');
    const settings = {
        name: document.getElementById('fullName').value,
        email: document.getElementById('email').value,
        department: document.getElementById('department').value,
        notifications: {
            email: document.getElementById('emailNotifications').checked,
            projects: document.getElementById('projectUpdates').checked,
            feedback: document.getElementById('feedbackNotifications').checked
        }
    };

    try {
        const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/faculty/${facultyId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(settings)
        });

        if (!response.ok) throw new Error('Failed to save settings');

        showNotification('Settings saved successfully!', 'success');
    } catch (error) {
        console.error('Error saving settings:', error);
        showNotification('Failed to save settings', 'error');
    }
}

// Utility Functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function getStatusBadgeClass(status) {
    switch(status.toLowerCase()) {
        case 'approved':
            return 'bg-success';
        case 'pending':
            return 'bg-warning text-dark';
        case 'rejected':
            return 'bg-danger';
        default:
            return 'bg-secondary';
    }
}

function getFeedbackBadgeClass(status) {
    switch(status.toLowerCase()) {
        case 'approved':
            return 'bg-success';
        case 'pending':
            return 'bg-warning text-dark';
        case 'rejected':
            return 'bg-danger';
        default:
            return 'bg-secondary';
    }
}

function getStatusIconClass(type) {
    switch(type.toLowerCase()) {
        case 'approval':
            return 'text-success';
        case 'rejection':
            return 'text-danger';
        case 'feedback':
            return 'text-primary';
        default:
            return 'text-secondary';
    }
}

function getStatusIcon(type) {
    switch(type.toLowerCase()) {
        case 'approval':
            return 'fa-check-circle';
        case 'rejection':
            return 'fa-times-circle';
        case 'feedback':
            return 'fa-comment';
        default:
            return 'fa-info-circle';
    }
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} notification`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Handle Logout
function handleLogout() {
    sessionStorage.clear();
    window.location.href = '../login/login.html';
}

// Filter Projects
function filterProjects(status) {
    // Update active button state
    document.querySelectorAll('.project-filters .btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`.project-filters button[onclick*="${status}"]`).classList.add('active');

    // Filter projects
    const projects = document.querySelectorAll('.project-card');
    projects.forEach(project => {
        if (status === 'all' || project.dataset.status.toLowerCase() === status) {
            project.style.display = 'block';
        } else {
            project.style.display = 'none';
        }
    });
}

// View Project Details
function viewProjectDetails(projectId) {
    // Implement project details view
    console.log('Viewing project details:', projectId);
} 