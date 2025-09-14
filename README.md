# My Blog App 📝

A full-stack blog project with **React** frontend and **Express + SQLite** backend.  
Users can register, login, create posts with cover images, and view posts by all users.
---

## Features
- User registration and login (JWT authentication)
- Create, update, and delete blog posts
- Upload cover images for posts
- Display author info and blog details
- RESTful API with protected routes

---

## Setup Instructions

### 1. Backend
```bash
cd backend
npm install
node server.js





A full-stack blog project with **React** frontend and **Express + SQLite** backend.  
Users can register, login, create posts with cover images, and view posts by all users.

---

## 🚀 Technologies

- **Frontend:** React, Axios, Material-UI  
- **Backend:** Node.js, Express.js, SQLite  
- **Authentication:** JWT (JSON Web Token), Bcrypt for password hashing  
- **File Uploads:** Multer  
- **CORS enabled** for frontend-backend communication

---

## 🗂 Project Structure

my-blog-app/
├── backend/
│ ├── blog.db
│ ├── index.js
│ ├── uploads/
│ └── package.json
├── frontend/
│ ├── src/
│ ├── public/
| ├── pakage/
│ └── package.json
└── README.md


---

## ⚡ Installation

### Backend
```bash
cd backend
npm install
node index.js

Frontend

cd frontend
npm install
npm start

    Backend runs on http://localhost:8000
    Frontend runs on http://localhost:3000

📌 API Endpoints

| Method | Endpoint          | Description                | Auth Required |
|--------|-------------------|----------------------------|---------------|
| GET    | /api              | Test API                   | ❌            |
| POST   | /api/register     | Register a new user        | ❌            |
| POST   | /api/login        | Login user                 | ❌            |
| POST   | /api/logout       | Logout user                | ✅            |
| GET    | /api/me           | Get user profile           | ✅            |
| PUT    | /api/update-profile | Update user profile      | ✅            |
| GET    | /api/blogs        | List all blogs             | ❌            |
| GET    | /api/my-blogs     | List current user's blogs  | ✅            |
| POST   | /api/blogs        | Create a new blog post     | ✅            |
| PUT    | /api/blogs/:id    | Update a blog post         | ✅            |
| DELETE | /api/blogs/:id    | Delete a blog post         | ✅            |

📸 Screenshots

Home Page: assets/blogs.png

Create Blog:createNewPost.png

Pagination:pagination.png

User Posts:userPosts.png

editPost:editPost.png

Login:login.png

Register:register.png

    You can replace these images with your own screenshots.

📝 Notes

    Make sure backend is running before starting the frontend

    All blog posts must have an associated user

    CORS is enabled for frontend at http://localhost:3000

    JWT tokens are valid for 1 hour by default

    File uploads are stored in backend/uploads/blogs/covers

⚖ License

This project is licensed under the MIT License.
