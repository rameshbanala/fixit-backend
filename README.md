# FixIt Backend

> A comprehensive service booking platform backend built with Node.js, Express, and MySQL


## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Folder Structure](#folder-structure)
- [Security](#security)
- [Contributing](#contributing)
- [License](#license)
- [Support](#support)

## Overview

FixIt is a service booking platform that connects users with skilled workers across various professions. The platform enables users to book services, workers to manage their applications and bookings, and administrators to oversee the entire ecosystem.

### Key Objectives

- **User Management**: Secure registration and authentication system for users and workers
- **Service Booking**: Seamless booking system with real-time status tracking
- **Worker Verification**: Admin-controlled verification system for service providers
- **Communication**: Automated email notifications for all booking lifecycle events
- **Admin Dashboard**: Comprehensive administrative controls and analytics

## Features

### Authentication & Security
- JWT-based authentication system
- Secure password hashing with bcrypt
- OTP-based email verification
- Password reset functionality
- Role-based access control (User, Worker, Admin)

### User Management
- User registration and profile management
- Worker application system with document upload
- Admin verification workflow
- Profile update capabilities

### Booking System
- Real-time service booking
- Booking status tracking (In Progress, Active, Completed, Cancelled)
- Bill generation and payment tracking
- Booking history and details

### Communication
- Automated email notifications
- OTP-based verification
- Booking confirmation emails
- Status update notifications

### Admin Features
- Comprehensive dashboard
- Worker verification/rejection system
- User and booking analytics
- Feedback management

## Architecture

The application follows a **modular MVC architecture** with clear separation of concerns:

- **Controllers**: Handle business logic and HTTP requests
- **Services**: Reusable business operations (email, OTP)
- **Middleware**: Authentication and request processing
- **Routes**: HTTP endpoint definitions
- **Config**: Database and application configuration
- **Utils**: Common utility functions

## Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (v14.x or higher)
- **npm** (v6.x or higher)
- **MySQL** (v8.0 or higher)
- **Git**

## Installation

### 1. Clone the Repository
```bash
git clone https://github.com/rameshbanala/fixit-backend.git
cd fixit-backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Database Setup
Create a MySQL database and run the necessary table creation scripts:

```sql
-- Create database
CREATE DATABASE fixit_db;

-- Use the database
USE fixit_db;

-- Create required tables (see Database Schema section)
```

### 4. Environment Configuration
Create a `.env` file in the root directory:

```bash
cp .env.sample .env
```

Fill in the required environment variables (see [Configuration](#configuration) section).

### 5. Create Required Directories
```bash
mkdir -p worker_proofs
```

## Configuration

Create a `.env` file with the following variables:

```env
# Server Configuration
PORT=8000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=fixit_db

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here

# Email Configuration (Gmail SMTP)
APP_MAIL=your_email@gmail.com
APP_PASSWORD=your_app_specific_password

# File Upload Configuration
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=jpeg,jpg,png,gif,pdf
```

### Environment Variables Description

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port number | Yes |
| `DB_HOST` | MySQL host address | Yes |
| `DB_USER` | MySQL username | Yes |
| `DB_PASSWORD` | MySQL password | Yes |
| `DB_NAME` | MySQL database name | Yes |
| `JWT_SECRET` | JWT signing secret | Yes |
| `APP_MAIL` | Email address for sending notifications | Yes |
| `APP_PASSWORD` | App-specific password for email | Yes |

## Usage

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:8000` (or your specified PORT).

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start the production server |
| `npm run dev` | Start development server with nodemon |
| `npm test` | Run test suite |
| `npm run lint` | Run ESLint |

## API Documentation

### Base URL
```
http://localhost:8000
```

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/send-otp` | Send OTP for verification | No |
| POST | `/verify-otp` | Verify OTP | No |
| POST | `/user-signup` | User registration | No |
| POST | `/worker-application` | Worker application with file upload | No |
| POST | `/login` | User/Worker/Admin login | No |
| POST | `/forgot-password` | Request password reset | No |
| POST | `/reset-password` | Reset password with OTP | No |

### User Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/get-user-data` | Get user profile data | Yes |
| GET | `/user-worker-options` | Get available workers by profession | Yes |
| GET | `/worker-profile-details/:id` | Get worker profile details | Yes |
| PUT | `/update-profile` | Update user profile | Yes |

### Worker Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/get-worker-data` | Get worker profile data | Yes |

### Admin Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/admin-page-details` | Get admin dashboard data | Yes |
| POST | `/verify-the-worker` | Verify worker application | Yes |
| POST | `/reject-the-worker` | Reject worker application | Yes |

### Booking Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/booking-worker` | Create new booking | Yes |
| GET | `/booking-details` | Get booking details | Yes |
| PUT | `/cancel-booking` | Cancel booking | Yes |
| POST | `/generate-bill` | Generate bill for booking | Yes (Worker) |
| PUT | `/complete-booking` | Complete booking | Yes (User) |

### Feedback Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/feedback` | Submit feedback | Yes |

### Request/Response Examples

#### User Registration
```bash
POST /user-signup
Content-Type: application/json

{
  "name": "John Doe",
  "dob": "1990-01-01",
  "email": "john@example.com",
  "phone_no": "1234567890",
  "password": "securepassword",
  "address": "123 Main St",
  "city": "New York",
  "pincode": "10001"
}
```

#### Worker Booking
```bash
POST /booking-worker
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "worker_id": "worker-uuid-here",
  "work_type": "plumbing"
}
```

## Database Schema

### Key Tables

#### users
```sql
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  dob DATE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone_no VARCHAR(15) NOT NULL,
  password VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  pincode VARCHAR(10) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### worker_applications
```sql
CREATE TABLE worker_applications (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  dob DATE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone_no VARCHAR(15) NOT NULL,
  password VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  pincode VARCHAR(10) NOT NULL,
  types_of_professions TEXT NOT NULL,
  file_name VARCHAR(255),
  file_path VARCHAR(255),
  is_verified ENUM('true', 'false') DEFAULT 'false',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### booking
```sql
CREATE TABLE booking (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  worker_id VARCHAR(36) NOT NULL,
  b_status ENUM('IN PROGRESS', 'ACTIVE', 'COMPLETED', 'CANCELLED') NOT NULL,
  work_type VARCHAR(255) NOT NULL,
  booked_at TIMESTAMP NOT NULL,
  status_changed_by VARCHAR(255) NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (worker_id) REFERENCES worker_applications(id)
);
```

## Folder Structure

```
fixit-backend/
├── src/
│   ├── config/
│   │   ├── database.js          # Database configuration
│   │   └── multer.js            # File upload configuration
│   ├── controllers/
│   │   ├── authController.js    # Authentication logic
│   │   ├── userController.js    # User management logic
│   │   ├── workerController.js  # Worker management logic
│   │   ├── adminController.js   # Admin operations logic
│   │   ├── bookingController.js # Booking management logic
│   │   └── feedbackController.js# Feedback handling logic
│   ├── middleware/
│   │   └── auth.js              # JWT authentication middleware
│   ├── routes/
│   │   ├── authRoutes.js        # Authentication routes
│   │   ├── userRoutes.js        # User routes
│   │   ├── workerRoutes.js      # Worker routes
│   │   ├── adminRoutes.js       # Admin routes
│   │   ├── bookingRoutes.js     # Booking routes
│   │   └── feedbackRoutes.js    # Feedback routes
│   ├── services/
│   │   ├── emailService.js      # Email sending service
│   │   └── otpService.js        # OTP management service
│   ├── utils/
│   │   ├── helpers.js           # Utility functions
│   │   └── constants.js         # Application constants
│   └── app.js                   # Express app configuration
├── worker_proofs/               # Uploaded worker documents
├── .env                         # Environment variables
├── .env.sample                  # Environment variables template
├── .gitignore                   # Git ignore rules
├── package.json                 # Project dependencies
├── server.js                    # Application entry point
└── README.md                    # Project documentation
```

## Security

### Authentication
- JWT tokens for stateless authentication
- Password hashing using bcrypt with salt rounds
- OTP-based email verification

### Data Protection
- Input validation and sanitization
- SQL injection prevention through parameterized queries
- File upload restrictions (type and size)

### Access Control
- Role-based access control (RBAC)
- Route-level authentication middleware
- Admin-only endpoints protection

## Testing

Run the test suite:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Generate test coverage report:
```bash
npm run test:coverage
```

## Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Guidelines

- Follow the existing code style and structure
- Write clear, concise commit messages
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR

## 🆘 Support

If you encounter any issues or have questions:

1. **Check the [Issues](https://github.com/rameshbanala/fixit-backend/issues)** page
2. **Create a new issue** if your problem isn't already reported
3. **Contact us** at rameshbanalab@gmail.com

### 📧 Contact Information

- **Email**: rameshbanalab@gmail.com
- **GitHub**: [@rameshbanala](https://github.com/rameshbanala)
- **Project Link**: [https://github.com/rameshbanala/fixit-backend](https://github.com/rameshbanala/fixit-backend)

***

## 🙏 Acknowledgments

- Built with [Express.js](https://expressjs.com/)
- Database powered by [MySQL](https://www.mysql.com/)
- Email services using [Nodemailer](https://nodemailer.com/)
- File uploads handled by [Multer](https://github.com/expressjs/multer)

***

<div align="center">
  <sub>Built with ❤️ by the FixIt Team</sub>
</div>