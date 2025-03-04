# IdeaVault - Project Management System

IdeaVault is a web-based project management system designed for educational institutions, allowing students to submit projects and faculty members to review and provide feedback.

## Features

### For Students
- Submit new project proposals
- Track project status
- Receive feedback from faculty
- View project history and progress
- Browse other projects for inspiration
- Update personal settings and preferences

### For Faculty
- Review submitted projects
- Provide feedback and evaluations
- Track student progress
- View project statistics and analytics
- Manage project categories
- Customize notification preferences

## Tech Stack

- Frontend: HTML, CSS, JavaScript, Bootstrap 5
- Backend: Node.js, Express.js
- Database: MongoDB
- Authentication: JWT (JSON Web Tokens)
- Real-time Updates: WebSocket

## Prerequisites

- Node.js (v18.x or higher)
- MongoDB
- npm or yarn package manager

## Installation

1. Clone the repository:
```bash
git clone https://github.com/Ragnar890/IdeaVault.git
cd IdeaVault
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory and add:
```env
PORT=8080
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

4. Start the development servers:
```bash
npm run dev:all
```

This will start both the frontend server at `http://localhost:8080` and the backend server at `http://localhost:30001`.

## Usage

### Login Credentials

For testing purposes, use these credentials:

**Student Account:**
- Email: student@example.com
- Password: password123

**Faculty Account:**
- Email: faculty@example.com
- Password: password123

### Key URLs
- Homepage: `http://localhost:8080/home/index.html`
- Login page: `http://localhost:8080/login/login.html`
- Student Dashboard: `http://localhost:8080/dashboard/student-dashboard.html`
- Faculty Dashboard: `http://localhost:8080/dashboard/faculty-dashboard.html`

## Project Structure

```
IdeaVault/
├── backend/             # Backend server files
├── dashboard/           # Dashboard components
│   ├── faculty/        # Faculty dashboard
│   └── student/        # Student dashboard
├── home/               # Homepage files
├── login/              # Authentication files
├── public/             # Static assets
└── server.js           # Main server file
```

## API Endpoints

### Authentication
- POST `/api/auth/login` - User login
- POST `/api/auth/register` - User registration

### Projects
- GET `/api/projects` - Get all projects
- POST `/api/projects` - Submit new project
- PUT `/api/projects/:id` - Update project
- DELETE `/api/projects/:id` - Delete project

### Feedback
- POST `/api/feedback` - Submit feedback
- GET `/api/feedback/:projectId` - Get project feedback

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Bootstrap for the UI components
- Chart.js for statistics visualization
- Font Awesome for icons 