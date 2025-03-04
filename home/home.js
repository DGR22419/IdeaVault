const API_BASE_URL = 'http://localhost:30001';

document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    if (!isLoggedIn) {
        window.location.href = '../login/login.html';
        return;
    }

    // Get user info
    const userType = sessionStorage.getItem('userType');
    const userName = sessionStorage.getItem(userType === 'faculty' ? 'facultyName' : 'studentName');
    
    // Update UI with user info
    document.getElementById('userName').textContent = userName;
    document.getElementById('userRole').textContent = userType === 'faculty' ? 'Faculty' : 'Student';

    // Add dashboard button to navbar
    const userInfo = document.querySelector('.user-info');
    if (userInfo) {
        const dashboardButton = document.createElement('button');
        dashboardButton.className = 'btn btn-primary ms-2';
        dashboardButton.onclick = () => {
            const token = sessionStorage.getItem('token');
            const userType = sessionStorage.getItem('userType');
            
            if (!token) {
                showNotification('Please log in to access the dashboard.', 'error');
                window.location.href = '../login/login.html';
                return;
            }

            if (userType === 'faculty') {
                window.location.href = '../dashboard/faculty-dashboard.html';
    } else {
                window.location.href = '../dashboard/student-dashboard.html';
            }
        };
        dashboardButton.innerHTML = '<i class="fas fa-bars me-2"></i>Dashboard';
        userInfo.parentElement.appendChild(dashboardButton);
    }

    // Load initial statistics
    loadStatistics();
    
    // Refresh statistics every 5 minutes
    setInterval(loadStatistics, 300000);
});

// Project navigation
function goToProjects() {
    const userType = sessionStorage.getItem('userType');
    if (userType === 'faculty') {
        window.location.href = '../dashboard/faculty-dashboard.html?section=projectReview';
    } else {
        window.location.href = '../dashboard/student-dashboard.html?section=submitProject';
    }
}

function showProjectList(filter) {
    const userType = sessionStorage.getItem('userType');
    if (userType === 'faculty') {
        window.location.href = '../dashboard/faculty-dashboard.html?section=projectReview';
    } else {
        window.location.href = '../dashboard/student-dashboard.html?section=browseProjects';
    }
}

// Handle project upload form
function showUploadForm(category) {
    // Store the selected category
    sessionStorage.setItem('selectedCategory', category);
    // Redirect to student dashboard with submit project section
    window.location.href = '../dashboard/student-dashboard.html?section=submitProject';
}

// Load My Projects
async function loadMyProjects() {
    const projectsList = document.getElementById('myProjectsList');
    const studentId = sessionStorage.getItem('studentId');
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/projects/student/${studentId}`);
        if (!response.ok) throw new Error('Failed to fetch projects');
        
        const projects = await response.json();
        
        if (projects.length === 0) {
            projectsList.innerHTML = `
                <div class="text-center text-muted py-5">
                    <i class="fas fa-folder-open fa-3x mb-3"></i>
                    <p>No projects submitted yet</p>
                    <button class="btn btn-primary" onclick="showSubmitProject()">
                        <i class="fas fa-plus me-2"></i>Submit Your First Project
                    </button>
                </div>
            `;
            return;
        }

        projectsList.innerHTML = projects.map(project => `
            <div class="project-card" data-status="${project.status}">
                <div class="project-title">
                    <span>${project.title}</span>
                    <span class="project-status status-${project.status.toLowerCase()}">${project.status}</span>
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
                <div class="project-links">
                    ${project.githubLink ? `
                        <a href="${project.githubLink}" target="_blank">
                            <i class="fab fa-github"></i>View on GitHub
                        </a>
                    ` : ''}
                    <a href="#" onclick="viewProjectDetails('${project._id}')">
                        <i class="fas fa-info-circle"></i>View Details
                    </a>
                    ${project.status === 'REJECTED' ? `
                        <a href="#" onclick="editProject('${project._id}')">
                            <i class="fas fa-edit"></i>Edit Project
                        </a>
                    ` : ''}
                    </div>
                            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading projects:', error);
        showNotification('Failed to load projects. Please try again.', 'error');
    }
}

// Filter My Projects
function filterMyProjects(status) {
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

// Edit Project
function editProject(projectId) {
    // Implement project editing
    console.log('Editing project:', projectId);
}

function showSubmitProject() {
    const modal = new bootstrap.Modal(document.getElementById('projectUploadModal'));
    modal.show();
}

function loadAllProjects() {
    console.log('Loading all projects...');
}

function showProgress() {
    console.log('Showing progress...');
}

function showProjectFeedback() {
    console.log('Showing project feedback...');
}

function showSettings() {
    console.log('Showing settings...');
}

// Logout functionality
function handleLogout() {
    // Clear session storage
    sessionStorage.clear();
    
    // Redirect to login page
    window.location.href = '../login/login.html';
}

// Initialize the file drop zone
document.addEventListener('DOMContentLoaded', function() {
    const fileDropZone = document.getElementById('fileDropZone');
    const fileInput = document.getElementById('projectFiles');
    const fileList = document.getElementById('fileList');
    const techInput = document.getElementById('techInput');
    const selectedTechs = document.getElementById('selectedTechs');
    let selectedFiles = [];
    let technologies = [];

    // File Drop Zone functionality
    fileDropZone.addEventListener('click', () => fileInput.click());

    fileDropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileDropZone.classList.add('dragover');
    });

    fileDropZone.addEventListener('dragleave', () => {
        fileDropZone.classList.remove('dragover');
    });

    fileDropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        fileDropZone.classList.remove('dragover');
        const files = e.dataTransfer.files;
        handleFiles(files);
    });

    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });

    function handleFiles(files) {
        selectedFiles = Array.from(files);
        updateFileList();
    }

    function updateFileList() {
        fileList.innerHTML = selectedFiles.map(file => `
            <div class="file-item">
                <i class="fas fa-file"></i>
                <span>${file.name}</span>
                <button type="button" class="btn btn-sm btn-danger" onclick="removeFile('${file.name}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
}

    // Technologies input functionality
    techInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
    e.preventDefault();
            const tech = techInput.value.trim();
            if (tech && !technologies.includes(tech)) {
                technologies.push(tech);
                updateTechList();
                techInput.value = '';
            }
        }
    });

    function updateTechList() {
        selectedTechs.innerHTML = technologies.map(tech => `
            <span class="tech-tag">
                ${tech}
                <i class="fas fa-times" onclick="removeTech('${tech}')"></i>
            </span>
        `).join('');
    }

    // Make these functions globally available
    window.removeFile = (fileName) => {
        selectedFiles = selectedFiles.filter(file => file.name !== fileName);
        updateFileList();
    };

    window.removeTech = (tech) => {
        technologies = technologies.filter(t => t !== tech);
        updateTechList();
    };

    // Handle project submission
    window.handleProjectSubmit = async () => {
        const form = document.getElementById('projectUploadForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const formData = new FormData();
        formData.append('title', document.getElementById('projectTitle').value);
        formData.append('category', document.getElementById('projectCategory').value);
        formData.append('description', document.getElementById('projectDescription').value);
        formData.append('technologies', JSON.stringify(technologies));
        formData.append('githubLink', document.getElementById('githubLink').value);
        formData.append('studentId', sessionStorage.getItem('studentId'));

        selectedFiles.forEach(file => {
            formData.append('files', file);
        });

    try {
        const response = await fetch(`${API_BASE_URL}/api/projects`, {
            method: 'POST',
                body: formData
            });

            if (response.ok) {
        // Close modal and show success message
                const modal = bootstrap.Modal.getInstance(document.getElementById('projectUploadModal'));
                modal.hide();
        showNotification('Project submitted successfully!', 'success');
        
                // Refresh projects list if we're on the My Projects section
                loadMyProjects();
            } else {
                throw new Error('Failed to submit project');
        }
    } catch (error) {
            showNotification('Failed to submit project. Please try again.', 'error');
    }
    };
});

// Show notification function
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} notification`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Function to animate counting up to a number
function animateCounter(element, target, duration = 2000) {
    const start = parseInt(element.textContent);
    const increment = (target - start) / (duration / 16);
    let current = start;

    const animate = () => {
        current += increment;
        element.textContent = Math.round(current);

        if (increment > 0 && current < target || increment < 0 && current > target) {
            requestAnimationFrame(animate);
        } else {
            element.textContent = target;
        }
    };

    requestAnimationFrame(animate);
}

// Function to make authenticated requests
async function makeAuthenticatedRequest(url, options = {}) {
    const token = sessionStorage.getItem('token');
    if (!token) {
        throw new Error('No authentication token found');
    }

    return fetch(url, {
        ...options,
            headers: {
            ...options.headers,
            'Authorization': `Bearer ${token}`
        }
    });
}

// Function to load and display statistics
async function loadStatistics() {
    try {
        // Static data for demonstration
        const projectStats = {
            total: 125,
            approved: 85,
            pending: 40
        };

        const studentStats = {
            activeCount: 50
        };

        // Get the counter elements
        const totalProjectsElement = document.getElementById('totalProjects');
        const approvedProjectsElement = document.getElementById('approvedProjects');
        const pendingProjectsElement = document.getElementById('pendingProjects');
        const activeStudentsElement = document.getElementById('activeStudents');

        // Animate the counters
        if (totalProjectsElement) animateCounter(totalProjectsElement, projectStats.total);
        if (approvedProjectsElement) animateCounter(approvedProjectsElement, projectStats.approved);
        if (pendingProjectsElement) animateCounter(pendingProjectsElement, projectStats.pending);
        if (activeStudentsElement) animateCounter(activeStudentsElement, studentStats.activeCount);

    } catch (error) {
        console.error('Error loading statistics:', error);
        showNotification('Error loading statistics. Please try again later.', 'error');
    }
}

// Faculty Dashboard functionality
function toggleFacultyDashboard() {
    const dashboard = document.getElementById('facultyDashboard');
    const body = document.body;
    
    if (dashboard.classList.contains('active')) {
        dashboard.classList.remove('active');
        const overlay = document.querySelector('.dashboard-overlay');
        if (overlay) {
            overlay.remove();
        }
        body.style.overflow = 'auto';
    } else {
        dashboard.classList.add('active');
        const overlay = document.createElement('div');
        overlay.className = 'dashboard-overlay active';
        overlay.onclick = toggleFacultyDashboard;
        document.body.appendChild(overlay);
        body.style.overflow = 'hidden';
    }
}

function showFacultyDashboardSection(section) {
    document.querySelectorAll('.dashboard-section').forEach(el => el.style.display = 'none');
    
    switch(section) {
        case 'projectReview':
            document.getElementById('projectReviewSection').style.display = 'block';
            loadProjectsForReview();
            break;
        case 'studentProgress':
            showStudentProgress();
            break;
        case 'announcements':
            showAnnouncementManager();
            break;
        case 'categories':
            showCategoryManager();
            break;
        case 'reports':
            showReports();
            break;
        case 'settings':
            showFacultySettings();
            break;
    }
}

// Load Projects for Review
async function loadProjectsForReview() {
    const projectsList = document.getElementById('facultyProjectsList');
    
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
        
        if (projects.length === 0) {
            projectsList.innerHTML = `
                <div class="text-center text-muted py-5">
                    <i class="fas fa-clipboard-check fa-3x mb-3"></i>
                    <p>No projects pending review</p>
            </div>
        `;
        return;
    }

        projectsList.innerHTML = projects.map(project => `
            <div class="project-card" data-status="${project.status}">
                <div class="project-title">
                    <span>${project.title}</span>
                    <span class="project-status status-${project.status.toLowerCase()}">${project.status}</span>
                </div>
                <div class="project-info">
                    <span class="student-name">
                        <i class="fas fa-user me-1"></i>${project.studentName}
                </span>
                    <span class="submission-date">
                        <i class="fas fa-calendar me-1"></i>${new Date(project.submissionDate).toLocaleDateString()}
                </span>
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
        console.error('Error loading projects for review:', error);
        showNotification('Failed to load projects. Please try again.', 'error');
    }
}

// Filter Faculty Projects
function filterFacultyProjects(status) {
    document.querySelectorAll('.project-filters .btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`.project-filters button[onclick*="${status}"]`).classList.add('active');

    const projects = document.querySelectorAll('.project-card');
    projects.forEach(project => {
        if (status === 'all' || project.dataset.status.toLowerCase() === status) {
            project.style.display = 'block';
        } else {
            project.style.display = 'none';
        }
    });
}

// Project Review Actions
async function approveProject(projectId) {
    try {
        // Simulate API call success
        showNotification('Project approved successfully!', 'success');
        loadProjectsForReview();
        loadStatistics();
    } catch (error) {
        console.error('Error approving project:', error);
        showNotification('Failed to approve project. Please try again.', 'error');
    }
}

async function rejectProject(projectId) {
    try {
        // Simulate API call success
        showNotification('Project rejected', 'success');
        loadProjectsForReview();
        loadStatistics();
    } catch (error) {
        console.error('Error rejecting project:', error);
        showNotification('Failed to reject project. Please try again.', 'error');
    }
}

function provideFeedback(projectId) {
    // Show feedback modal
    const modal = new bootstrap.Modal(document.getElementById('feedbackModal'));
    document.getElementById('projectIdForFeedback').value = projectId;
    modal.show();
}

// Faculty Dashboard Sections
function showStudentProgress() {
    console.log('Showing student progress...');
    // Implement student progress view
}

function showAnnouncementManager() {
    console.log('Showing announcement manager...');
    // Implement announcement management
}

function showCategoryManager() {
    console.log('Showing category manager...');
    // Implement category management
}

function showReports() {
    console.log('Showing reports...');
    // Implement reports view
}

function showFacultySettings() {
    console.log('Showing faculty settings...');
    // Implement faculty settings
}

// Submit Feedback
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
        const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/projects/${projectId}/feedback`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: feedbackType,
                comment: comment
            })
        });

        if (response.ok) {
            const modal = bootstrap.Modal.getInstance(document.getElementById('feedbackModal'));
            modal.hide();
            showNotification('Feedback submitted successfully!', 'success');
            loadProjectsForReview();
        } else {
            throw new Error('Failed to submit feedback');
        }
    } catch (error) {
        console.error('Error submitting feedback:', error);
        showNotification('Failed to submit feedback. Please try again.', 'error');
    }
} 