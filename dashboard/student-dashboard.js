const API_BASE_URL = 'http://localhost:8080';

// Check if user is logged in when the page loads
document.addEventListener('DOMContentLoaded', async () => {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    const studentId = sessionStorage.getItem('studentId');
    const token = sessionStorage.getItem('token');
    const userType = sessionStorage.getItem('userType');

    console.log('Session Storage Items:', {
        isLoggedIn,
        studentId,
        token,
        userType
    });

    if (!isLoggedIn || !studentId || !token || userType !== 'student') {
        console.error('Authentication check failed');
        sessionStorage.clear();
        window.location.href = '../login/index.html';
        return;
    }

    // Update UI with user info
    updateUserInfo();

    // Load the appropriate section based on URL parameters or default to myProjects
    const urlParams = new URLSearchParams(window.location.search);
    const section = urlParams.get('section') || 'myProjects';
    showDashboardSection(section);

    // Initialize event listeners
    initializeEventListeners();
    
    // Load initial data
    loadMyProjects();
    loadProgressStats();
});

// Update user information in the navbar
function updateUserInfo() {
    const userName = sessionStorage.getItem('userName');
    document.getElementById('userName').textContent = userName || 'Student';
    document.getElementById('userRole').textContent = 'Student';
}

// Initialize event listeners for the dashboard
function initializeEventListeners() {
    // Project search
    const searchInput = document.getElementById('searchProjects');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleProjectSearch, 300));
    }

    // Category filter
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', handleCategoryFilter);
    }

    // Sort filter
    const sortFilter = document.getElementById('sortFilter');
    if (sortFilter) {
        sortFilter.addEventListener('change', handleSortFilter);
    }

    // File drop zone
    const fileDropZone = document.getElementById('fileDropZone');
    if (fileDropZone) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            fileDropZone.addEventListener(eventName, preventDefaults);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            fileDropZone.addEventListener(eventName, highlight);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            fileDropZone.addEventListener(eventName, unhighlight);
        });

        fileDropZone.addEventListener('drop', handleDrop);
        fileDropZone.addEventListener('click', () => document.getElementById('projectFiles').click());
    }

    // Project files input
    const projectFiles = document.getElementById('projectFiles');
    if (projectFiles) {
        projectFiles.addEventListener('change', handleFileSelect);
    }

    // Tech input
    const techInput = document.getElementById('techInput');
    if (techInput) {
        techInput.addEventListener('keydown', handleTechInput);
    }
}

// Show the selected dashboard section
function showDashboardSection(sectionId) {
    // Hide all sections
    const sections = document.querySelectorAll('.dashboard-section');
    sections.forEach(section => section.style.display = 'none');

    // Show the selected section
    const selectedSection = document.getElementById(`${sectionId}Section`);
    if (selectedSection) {
        selectedSection.style.display = 'block';
    }

    // Update active menu item
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => item.classList.remove('active'));
    const activeItem = document.querySelector(`.menu-item[onclick*="${sectionId}"]`);
    if (activeItem) {
        activeItem.classList.add('active');
    }

    // Load section-specific data
    switch (sectionId) {
        case 'myProjects':
            loadMyProjects();
            break;
        case 'browseProjects':
            loadBrowseProjects();
            break;
        case 'myProgress':
            loadProgressStats();
            break;
        case 'projectFeedback':
            loadProjectFeedback();
            break;
        case 'settings':
            loadUserSettings();
            break;
    }
}

// Make an authenticated API request
async function makeAuthenticatedRequest(endpoint, options = {}) {
    const token = sessionStorage.getItem('token');
    const defaultOptions = {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    };

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API request failed:', error);
        showNotification('An error occurred while fetching data', 'error');
        return null;
    }
}

// Load user's projects
async function loadMyProjects() {
    const studentId = sessionStorage.getItem('studentId');
    const projects = await makeAuthenticatedRequest(`/api/students/${studentId}/projects`);
    
    if (!projects) {
        // Use sample data if API call fails
        displayProjects(getSampleProjects(), 'myProjectsList');
        return;
    }

    displayProjects(projects, 'myProjectsList');
}

// Load projects for browsing
async function loadBrowseProjects() {
    const projects = await makeAuthenticatedRequest('/api/projects');
    
    if (!projects) {
        // Use sample data if API call fails
        displayProjects(getSampleProjects(), 'browseProjectsList');
        return;
    }

    displayProjects(projects, 'browseProjectsList');
}

// Display projects in the specified container
function displayProjects(projects, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = projects.map(project => `
        <div class="project-card">
            <div class="project-title">
                <h4>${project.title}</h4>
                <span class="project-status status-${project.status.toLowerCase()}">${project.status}</span>
            </div>
            <div class="project-category">${project.category}</div>
            <p class="project-description">${project.description}</p>
            <div class="project-tech-stack">
                ${project.technologies.map(tech => `
                    <span class="tech-badge">${tech}</span>
                `).join('')}
            </div>
            <div class="project-links">
                ${project.githubLink ? `
                    <a href="${project.githubLink}" target="_blank">
                        <i class="fab fa-github"></i>View Code
                    </a>
                ` : ''}
                <a href="#" onclick="viewProjectDetails('${project.id}')">
                    <i class="fas fa-info-circle"></i>View Details
                </a>
                ${project.status === 'Approved' ? `
                    <a href="#" onclick="viewFeedback('${project.id}')">
                        <i class="fas fa-comments"></i>View Feedback
                    </a>
                ` : ''}
            </div>
        </div>
    `).join('');
}

// Load progress statistics
async function loadProgressStats() {
    const studentId = sessionStorage.getItem('studentId');
    const stats = await makeAuthenticatedRequest(`/api/students/${studentId}/stats`);
    
    if (!stats) {
        // Use sample data if API call fails
        updateProgressStats(getSampleStats());
        return;
    }

    updateProgressStats(stats);
}

// Update progress statistics in the UI
function updateProgressStats(stats) {
    // Update count cards
    document.getElementById('totalProjectsCount').textContent = stats.totalProjects;
    document.getElementById('approvedProjectsCount').textContent = stats.approvedProjects;
    document.getElementById('pendingProjectsCount').textContent = stats.pendingProjects;
    document.getElementById('rejectedProjectsCount').textContent = stats.rejectedProjects;

    // Update category progress bars
    const progressContainer = document.getElementById('categoryProgressBars');
    if (progressContainer) {
        progressContainer.innerHTML = stats.categoryProgress.map(category => `
            <div class="category-progress-item mb-3">
                <div class="d-flex justify-content-between mb-1">
                    <span>${category.name}</span>
                    <span>${category.count} projects</span>
                </div>
                <div class="progress">
                    <div class="progress-bar" role="progressbar" 
                         style="width: ${(category.count / stats.totalProjects * 100)}%">
                    </div>
                </div>
            </div>
        `).join('');
    }
}

// Handle project submission
async function handleProjectSubmit() {
    const form = document.getElementById('projectUploadForm');
    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return;
    }

    const formData = new FormData();
    formData.append('title', document.getElementById('projectTitle').value);
    formData.append('category', document.getElementById('projectCategory').value);
    formData.append('description', document.getElementById('projectDescription').value);
    formData.append('githubLink', document.getElementById('githubLink').value);
    
    const technologies = Array.from(document.getElementById('selectedTechs').children)
        .map(tech => tech.textContent.trim());
    formData.append('technologies', JSON.stringify(technologies));

    const fileInput = document.getElementById('projectFiles');
    Array.from(fileInput.files).forEach(file => {
        formData.append('files', file);
    });

    try {
        const response = await makeAuthenticatedRequest('/api/projects', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${sessionStorage.getItem('token')}`
            },
            body: formData
        });

        if (response) {
            showNotification('Project submitted successfully!', 'success');
            form.reset();
            showDashboardSection('myProjects');
        }
    } catch (error) {
        console.error('Project submission failed:', error);
        showNotification('Failed to submit project. Please try again.', 'error');
    }
}

// Handle file drop
function handleDrop(e) {
    preventDefaults(e);
    unhighlight(e);
    
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
}

// Handle selected files
function handleFiles(files) {
    const fileList = document.getElementById('fileList');
    Array.from(files).forEach(file => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <i class="fas fa-file"></i>
            <span>${file.name}</span>
            <button type="button" class="btn btn-sm btn-danger" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        fileList.appendChild(fileItem);
    });
}

// Handle technology input
function handleTechInput(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        const tech = e.target.value.trim();
        if (tech) {
            const techSpan = document.createElement('span');
            techSpan.className = 'tech-badge';
            techSpan.innerHTML = `${tech}<i class="fas fa-times ms-2" onclick="this.parentElement.remove()"></i>`;
            document.getElementById('selectedTechs').appendChild(techSpan);
            e.target.value = '';
        }
    }
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification alert alert-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Utility functions
function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function highlight(e) {
    e.target.classList.add('dragover');
}

function unhighlight(e) {
    e.target.classList.remove('dragover');
}

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

// Handle logout
function handleLogout() {
    sessionStorage.clear();
    window.location.href = '../login/index.html';
}

// Sample data for testing
function getSampleProjects() {
    return [
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
    ];
}

function getSampleStats() {
    return {
        totalProjects: 5,
        approvedProjects: 2,
        pendingProjects: 2,
        rejectedProjects: 1,
        categoryProgress: [
            { name: 'AI & Machine Learning', count: 2 },
            { name: 'Web Development', count: 2 },
            { name: 'Mobile Applications', count: 1 }
        ]
    };
} 