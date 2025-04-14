# AI Reseller Backend

## Overview
This is a backend application for an AI API reseller platform, providing management of DeepAI accounts, user authentication, and API service routing.

## Features
- User Authentication & Authorization
- DeepAI Account Management
- API Usage Tracking
- Credit System
- Secure API Endpoints
- Rate Limiting
- Logging

## Prerequisites
- Node.js (v16+ recommended)
- MongoDB
- npm or Yarn

## Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/ai-reseller-backend.git
cd ai-reseller-backend
```

2. Install dependencies
```bash
npm install
```

3. Create a `.env` file
- Copy the `.env.example` to `.env`
- Fill in the required environment variables

4. Set up MongoDB
- Ensure MongoDB is running
- Update the `MONGO_URI` in `.env`

## Environment Variables
- `PORT`: Server port
- `MONGO_URI`: MongoDB connection string
- `JWT_SECRET`: Secret for JWT token generation
- `DEEPAI_API_BASE_URL`: Base URL for DeepAI API
- `ENCRYPTION_KEY`: 32-character hex encryption key

## Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register`: Register new user
- `POST /api/auth/login`: User login
- `GET /api/auth/me`: Get current user info

### User Management
- `GET /api/users`: Get all users (admin)
- `PUT /api/users/update`: Update user profile
- `POST /api/users/add-credits`: Add credits to user (admin)

### DeepAI Accounts
- `GET /api/accounts`: List DeepAI accounts
- `POST /api/accounts`: Add new DeepAI account
- `PUT /api/accounts/:id`: Update account
- `DELETE /api/accounts/:id`: Delete account

### Services
- `GET /api/services/endpoints`: List available AI services
- `POST /api/services/text-to-image`: Generate images
- `POST /api/services/process-image`: Process images

## Security Features
- JWT Authentication
- Password Hashing
- API Key Encryption
- Rate Limiting
- Comprehensive Logging

## Monitoring & Logging
Logs are stored in the `logs/` directory:
- `combined.log`: All logs
- `error.log`: Error logs
- `exceptions.log`: Unhandled exceptions

## Contributing
1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License
[Your License Here]

## Support
For issues or questions, please open a GitHub issue or contact support@yourcompany.com