const API_BASE_URL = 'http://localhost:30001';

document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in and has valid student ID
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    const studentId = sessionStorage.getItem('studentId');
    const token = sessionStorage.getItem('token');

    if (!isLoggedIn || !studentId || !token) {
        console.error('Missing authentication data:', { isLoggedIn, hasStudentId: !!studentId, hasToken: !!token });
        sessionStorage.clear(); // Clear any partial session data
        window.location.href = '../login/login.html';
        return;
    }

    // Get user info
    const userName = sessionStorage.getItem('studentName');
    
    // Update UI with user info
    document.getElementById('userName').textContent = userName || 'Student';
    document.getElementById('userRole').textContent = 'Student';

    // Check for URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const section = urlParams.get('section');
    
    // Load initial section
    if (section) {
        showDashboardSection(section);
    } else {
        showDashboardSection('myProjects');
    }

    // Initialize event listeners
    initializeEventListeners();
});

// Initialize Event Listeners
function initializeEventListeners() {
    // File Drop Zone
    const fileDropZone = document.getElementById('fileDropZone');
    const fileInput = document.getElementById('projectFiles');
    
    if (fileDropZone && fileInput) {
        fileDropZone.addEventListener('click', () => fileInput.click());
        fileDropZone.addEventListener('dragover', handleDragOver);
        fileDropZone.addEventListener('dragleave', handleDragLeave);
        fileDropZone.addEventListener('drop', handleDrop);
        fileInput.addEventListener('change', handleFileSelect);
    }

    // Technology Input
    const techInput = document.getElementById('techInput');
    if (techInput) {
        techInput.addEventListener('keydown', handleTechInput);
    }

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
        case 'myProjects':
            document.getElementById('myProjectsSection').style.display = 'block';
            loadMyProjects();
            break;
        case 'submitProject':
            document.getElementById('submitProjectSection').style.display = 'block';
            initializeSubmitForm();
            break;
        case 'browseProjects':
            document.getElementById('browseProjectsSection').style.display = 'block';
            loadAllProjects();
            break;
        case 'myProgress':
            document.getElementById('myProgressSection').style.display = 'block';
            loadProgress();
            break;
        case 'projectFeedback':
            document.getElementById('projectFeedbackSection').style.display = 'block';
            loadProjectFeedback();
            break;
        case 'settings':
            document.getElementById('settingsSection').style.display = 'block';
            loadUserSettings();
            break;
    }
}

// Submit Project Functions
let selectedFiles = [];
let technologies = [];

function initializeSubmitForm() {
    // Clear previous data
    selectedFiles = [];
    technologies = [];
    document.getElementById('projectUploadForm').reset();
    document.getElementById('fileList').innerHTML = '';
    document.getElementById('selectedTechs').innerHTML = '';

    // Set category if coming from home page
    const selectedCategory = sessionStorage.getItem('selectedCategory');
    if (selectedCategory) {
        document.getElementById('projectCategory').value = selectedCategory;
        sessionStorage.removeItem('selectedCategory');
    }
}

function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('dragover');
}

function handleDragLeave(e) {
    e.currentTarget.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
}

function handleFileSelect(e) {
    handleFiles(e.target.files);
}

function handleFiles(files) {
    selectedFiles = Array.from(files);
    updateFileList();
}

function updateFileList() {
    const fileList = document.getElementById('fileList');
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

function removeFile(fileName) {
    selectedFiles = selectedFiles.filter(file => file.name !== fileName);
    updateFileList();
}

function handleTechInput(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        const tech = e.target.value.trim();
        if (tech && !technologies.includes(tech)) {
            technologies.push(tech);
            updateTechList();
            e.target.value = '';
        }
    }
}

function updateTechList() {
    const selectedTechs = document.getElementById('selectedTechs');
    selectedTechs.innerHTML = technologies.map(tech => `
        <span class="tech-tag">
            ${tech}
            <i class="fas fa-times" onclick="removeTech('${tech}')"></i>
        </span>
    `).join('');
}

function removeTech(tech) {
    technologies = technologies.filter(t => t !== tech);
    updateTechList();
}

async function makeAuthenticatedRequest(url, options = {}) {
    const token = sessionStorage.getItem('token');
    const studentId = sessionStorage.getItem('studentId');

    if (!token || !studentId) {
        console.error('Missing authentication data:', { hasToken: !!token, hasStudentId: !!studentId });
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

async function handleProjectSubmit() {
    const form = document.getElementById('projectUploadForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    try {
        // Show loading state
        const submitButton = form.querySelector('button[type="button"]');
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Submitting...';
        submitButton.disabled = true;

        // Get form values
        const projectTitle = document.getElementById('projectTitle').value.trim();
        const projectCategory = document.getElementById('projectCategory').value.trim();
        const projectDescription = document.getElementById('projectDescription').value.trim();
        const githubLink = document.getElementById('githubLink').value.trim();
        const studentId = sessionStorage.getItem('studentId');

        // Validate required fields
        if (!projectTitle || !projectCategory || !projectDescription) {
            throw new Error('Please fill in all required fields (Title, Category, and Description)');
        }

        // Create the project data
        const formData = new FormData();
        formData.append('title', projectTitle);
        formData.append('category', projectCategory);
        formData.append('description', projectDescription);
        formData.append('technologies', JSON.stringify(technologies));
        formData.append('githubLink', githubLink || '');
        formData.append('studentId', studentId);

        // Append files if any
        if (selectedFiles.length > 0) {
            selectedFiles.forEach(file => {
                formData.append('files', file);
                console.log('Appending file:', file.name);
            });
        }

        console.log('Submitting project with data:', {
            title: projectTitle,
            category: projectCategory,
            description: projectDescription,
            technologies,
            githubLink,
            studentId
        });

        const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/projects`, {
            method: 'POST',
            body: formData
        });

        const responseData = await response.json();
        console.log('Server response:', responseData);

        if (!response.ok) {
            throw new Error(responseData.message || 'Failed to submit project');
        }

        showNotification('Project submitted successfully!', 'success');
        showDashboardSection('myProjects');
    } catch (error) {
        console.error('Error submitting project:', error);
        showNotification(error.message || 'Failed to submit project. Please try again.', 'error');
    } finally {
        // Reset loading state
        const submitButton = form.querySelector('button[type="button"]');
        submitButton.innerHTML = '<i class="fas fa-upload me-2"></i>Submit Project';
        submitButton.disabled = false;
    }
}

// Browse Projects Functions
let allProjects = [];

async function loadAllProjects() {
    try {
        const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/projects`);
        if (!response.ok) throw new Error('Failed to fetch projects');
        
        allProjects = await response.json();
        displayProjects(allProjects);
    } catch (error) {
        console.error('Error loading projects:', error);
        if (error.message.includes('Authentication')) {
            sessionStorage.clear();
            window.location.href = '../login/login.html';
        } else {
            showNotification('Failed to load projects. Please try again.', 'error');
        }
    }
}

function displayProjects(projects) {
    const projectsList = document.getElementById('browseProjectsList');
    projectsList.innerHTML = projects.map(project => `
        <div class="project-card">
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
            sortedProjects.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            break;
        case 'oldest':
            sortedProjects.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
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
        const studentId = sessionStorage.getItem('studentId');
        if (!studentId) {
            throw new Error('Student ID not found');
        }

        const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/projects/student/${studentId}`);
        const projects = await response.json();

        // Debug log to see what we're getting
        console.log('Projects received:', projects);
        console.log('Project statuses:', projects.map(p => p.status));

        // Calculate statistics
        const stats = {
            total: projects.length,
            approved: projects.filter(p => p.status === 'APPROVED').length,
            pending: projects.filter(p => p.status === 'PENDING' || p.status === 'pending').length,
            rejected: projects.filter(p => p.status === 'REJECTED' || p.status === 'rejected' || p.status === 'NEEDS_REVISION').length
        };

        // Debug log for stats
        console.log('Calculated stats:', stats);

        // Update statistics cards
        document.getElementById('totalProjectsCount').textContent = stats.total;
        document.getElementById('approvedProjectsCount').textContent = stats.approved;
        document.getElementById('pendingProjectsCount').textContent = stats.pending;
        document.getElementById('rejectedProjectsCount').textContent = stats.rejected;

        // Calculate category statistics
        const categoryStats = projects.reduce((acc, project) => {
            acc[project.category] = acc[project.category] || { total: 0, approved: 0 };
            acc[project.category].total++;
            if (project.status === 'APPROVED') {
                acc[project.category].approved++;
            }
            return acc;
        }, {});

        // Update category progress bars
        const categoryProgressBars = document.getElementById('categoryProgressBars');
        categoryProgressBars.innerHTML = Object.entries(categoryStats)
            .map(([category, stats]) => {
                const percentage = (stats.approved / stats.total) * 100;
                return `
                    <div class="progress-item mb-3">
                        <div class="d-flex justify-content-between mb-1">
                            <span class="category-name">${category}</span>
                            <span class="progress-text">${stats.approved}/${stats.total} Approved</span>
                        </div>
                        <div class="progress">
                            <div class="progress-bar" role="progressbar" 
                                 style="width: ${percentage}%" 
                                 aria-valuenow="${percentage}" 
                                 aria-valuemin="0" 
                                 aria-valuemax="100">
                                ${Math.round(percentage)}%
                            </div>
                        </div>
                    </div>
                `;
            })
            .join('');

        // Create activity timeline
        const activityTimeline = document.getElementById('activityTimeline');
        const sortedProjects = [...projects].sort((a, b) => 
            new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
        );

        activityTimeline.innerHTML = sortedProjects
            .slice(0, 5) // Show last 5 activities
            .map(project => {
                const date = new Date(project.updatedAt || project.createdAt).toLocaleDateString();
                let statusClass = '';
                let statusIcon = '';
                
                switch(project.status) {
                    case 'APPROVED':
                        statusClass = 'text-success';
                        statusIcon = 'fa-check-circle';
                        break;
                    case 'REJECTED':
                        statusClass = 'text-danger';
                        statusIcon = 'fa-times-circle';
                        break;
                    default:
                        statusClass = 'text-warning';
                        statusIcon = 'fa-clock';
                }

                return `
                    <div class="timeline-item">
                        <div class="timeline-icon ${statusClass}">
                            <i class="fas ${statusIcon}"></i>
                        </div>
                        <div class="timeline-content">
                            <div class="timeline-date">${date}</div>
                            <h6>${project.title}</h6>
                            <p class="mb-0">
                                Category: ${project.category}<br>
                                Status: <span class="badge bg-${statusClass}">${project.status}</span>
                            </p>
                        </div>
                    </div>
                `;
            })
            .join('');

    } catch (error) {
        console.error('Error loading progress:', error);
        showNotification('Failed to load progress data. Please try again.', 'error');
    }
}

// Feedback Functions
async function loadProjectFeedback() {
    const studentId = sessionStorage.getItem('studentId');
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/feedback/student/${studentId}`);
        if (!response.ok) throw new Error('Failed to fetch feedback');
        
        const feedback = await response.json();
        displayFeedback(feedback);
    } catch (error) {
        console.error('Error loading feedback:', error);
        showNotification('Failed to load feedback. Please try again.', 'error');
    }
}

function displayFeedback(feedbackList) {
    const feedbackContainer = document.getElementById('feedbackList');
    feedbackContainer.innerHTML = feedbackList.map(feedback => `
        <div class="feedback-item">
            <div class="feedback-header">
                <span class="feedback-project">${feedback.projectTitle}</span>
                <span class="feedback-date">${new Date(feedback.date).toLocaleDateString()}</span>
            </div>
            <div class="feedback-content">${feedback.content}</div>
            <div class="feedback-actions">
                <button class="btn btn-sm btn-outline-primary" onclick="viewProjectDetails('${feedback.projectId}')">
                    <i class="fas fa-eye me-1"></i>View Project
                </button>
                ${feedback.status === 'REJECTED' ? `
                    <button class="btn btn-sm btn-outline-danger" onclick="editProject('${feedback.projectId}')">
                        <i class="fas fa-edit me-1"></i>Edit Project
                    </button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

// Settings Functions
async function loadUserSettings() {
    const studentId = sessionStorage.getItem('studentId');
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/students/${studentId}`);
        if (!response.ok) throw new Error('Failed to fetch user settings');
        
        const settings = await response.json();
        populateSettingsForm(settings);
    } catch (error) {
        console.error('Error loading settings:', error);
        showNotification('Failed to load settings. Please try again.', 'error');
    }
}

function populateSettingsForm(settings) {
    document.getElementById('fullName').value = settings.name || '';
    document.getElementById('email').value = settings.email || '';
    document.getElementById('githubUsername').value = settings.githubUsername || '';
    document.getElementById('emailNotifications').checked = settings.notifications?.email || false;
    document.getElementById('projectUpdates').checked = settings.notifications?.projects || false;
    document.getElementById('feedbackNotifications').checked = settings.notifications?.feedback || false;
}

async function saveSettings() {
    const studentId = sessionStorage.getItem('studentId');
    const settings = {
        name: document.getElementById('fullName').value,
        email: document.getElementById('email').value,
        githubUsername: document.getElementById('githubUsername').value,
        notifications: {
            email: document.getElementById('emailNotifications').checked,
            projects: document.getElementById('projectUpdates').checked,
            feedback: document.getElementById('feedbackNotifications').checked
        }
    };

    try {
        const response = await fetch(`${API_BASE_URL}/api/students/${studentId}`, {
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
        showNotification('Failed to save settings. Please try again.', 'error');
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

// Load My Projects
async function loadMyProjects() {
    const projectsList = document.getElementById('myProjectsList');
    const studentId = sessionStorage.getItem('studentId');
    
    if (!studentId) {
        console.error('Student ID not found in session');
        showNotification('Authentication error. Please log in again.', 'error');
        sessionStorage.clear();
        window.location.href = '../login/login.html';
        return;
    }

    try {
        const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/projects/student/${studentId}`);
        if (!response.ok) {
            if (response.status === 404) {
                // No projects found - show empty state
                projectsList.innerHTML = `
                    <div class="text-center text-muted py-5">
                        <i class="fas fa-folder-open fa-3x mb-3"></i>
                        <p>No projects submitted yet</p>
                        <button class="btn btn-primary" onclick="showDashboardSection('submitProject')">
                            <i class="fas fa-plus me-2"></i>Submit Your First Project
                        </button>
                    </div>
                `;
                return;
            }
            throw new Error('Failed to fetch projects');
        }
        
        const projects = await response.json();
        
        if (!projects || projects.length === 0) {
            projectsList.innerHTML = `
                <div class="text-center text-muted py-5">
                    <i class="fas fa-folder-open fa-3x mb-3"></i>
                    <p>No projects submitted yet</p>
                    <button class="btn btn-primary" onclick="showDashboardSection('submitProject')">
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
        if (error.message.includes('Authentication')) {
            sessionStorage.clear();
            window.location.href = '../login/login.html';
        } else {
            showNotification('Failed to load projects. Please try again.', 'error');
        }
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

// Show Submit Project Form
function showSubmitProject() {
    const modal = new bootstrap.Modal(document.getElementById('projectUploadModal'));
    modal.show();
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