# MASAT - eMAG Marketplace Analytics Tool

MASAT is a Next.js application designed to help eMAG marketplace sellers analyze their sales data, calculate profitability, and optimize their business operations.

## Features

- **Authentication**: Secure login with email/password, Google, and Facebook OAuth
- **eMAG Integration**: Connect your eMAG seller account to fetch orders and product data
- **Sales Calculator**: Calculate profitability for your products including all fees and costs
- **Order Analytics**: View and analyze your eMAG marketplace orders
- **Commission Estimator**: Estimate eMAG commissions for different product categories

## Tech Stack

- **Frontend**: Next.js, React, Material-UI
- **Backend**: Next.js API Routes
- **Database**: MongoDB
- **Authentication**: NextAuth.js
- **Storage**: AWS S3
- **Email**: AWS SES
- **Deployment**: Docker, Terraform

## Getting Started

### Prerequisites

- Node.js 16+ and npm/yarn
- MongoDB database
- AWS account (for S3 and SES)
- eMAG seller account (for marketplace integration)

### Database Management

The project includes a utility script for managing the MongoDB database:

```bash
# List all collections and their document counts
npm run clean-db -- --list

# Clean all collections (with confirmation prompt)
npm run clean-db -- --clean

# Clean all collections (without confirmation)
npm run clean-db -- --clean --force
```

⚠️ **Warning**: The clean operation will delete ALL data in ALL collections. Use with caution.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/masat-nextjs.git
   cd masat-nextjs
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env.local` file in the root directory with the required environment variables (see Environment Variables section below).

4. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```
# Authentication
NEXTAUTH_SECRET=your-nextauth-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# OAuth Providers
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FACEBOOK_CLIENT_ID=your-facebook-client-id
FACEBOOK_CLIENT_SECRET=your-facebook-client-secret

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority

# AWS Services
AWS_REGION=eu-central-1
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
S3_BUCKET_NAME=masat-dev-bucket
SES_SOURCE_EMAIL=contact@shiftcrowd.eu

# Encryption
ENCRYPTION_KEY=your-encryption-key-here
NEXT_PUBLIC_RESPONSE_ENCRYPTION_KEY=your-response-encryption-key-here

# Environment
NODE_ENV=development
```

## API Documentation

The application provides several API endpoints for various functionalities:

### Authentication API

- `POST /api/auth/check-email`: Check if an email exists in the system
- `POST /api/auth/send-registration-otp`: Send OTP for registration
- `POST /api/auth/verify-registration-otp`: Verify OTP for registration
- `POST /api/auth/set-password`: Set password for a new account
- `POST /api/auth/forgot-password`: Initiate password reset
- `POST /api/auth/verify-reset-otp`: Verify OTP for password reset
- `POST /api/auth/reset-password`: Reset password

### Integration API

- `GET /api/integrations`: Get all integrations for the current user
- `POST /api/integrations`: Create a new integration
- `PUT /api/integrations/:id`: Update an existing integration
- `DELETE /api/integrations/:id`: Delete an integration
- `POST /api/integrations/validate`: Validate integration credentials
- `GET /api/integrations/:id/orders`: Get orders for an integration
- `GET /api/integrations/:id/order-count`: Get order count for an integration
- `GET /api/integrations/:id/product-offers`: Get product offers for an integration

### Calculator API

- `GET /api/calculations`: Get all saved calculations
- `POST /api/calculations`: Save a new calculation
- `GET /api/calculations/:id`: Get a specific calculation
- `PUT /api/calculations/:id`: Update a calculation
- `DELETE /api/calculations/:id`: Delete a calculation

### Commission API

- `GET /api/v1/commission/estimate/:categoryId`: Get commission estimate for a product category

## Docker Deployment

The application can be deployed using Docker:

```bash
# Build the Docker image
docker build -t masat-nextjs .

# Run the container
docker run -p 3000:3000 --env-file .env.production masat-nextjs
```

## Terraform Deployment

The `terraform` directory contains infrastructure as code for deploying the application to AWS.

### Environments

The application supports multiple deployment environments:

- **Development (dev)**: The default environment for testing and development
- **Production (prod)**: The environment for production use

### Deployment Process

#### Development Environment

The development environment is automatically deployed when changes are pushed to the `develop` branch.

#### Production Environment

To deploy to the production environment:

1. Push changes to the `main` branch, or
2. Manually trigger the production deployment workflow in GitHub Actions

The production environment uses separate infrastructure resources and configuration to ensure stability and security.

## Improvement List

See the [TODO.md](./doc/TODO.md) file for a comprehensive list of planned improvements and tasks.

Key completed items:
- [x] Implement authentication with NextAuth.js
- [x] Create eMAG API integration
- [x] Develop sales calculator
- [x] Add order analytics

Key pending items:
- [ ] Implement product performance metrics
- [ ] Add multi-marketplace support
- [ ] Create advanced reporting features
- [ ] Implement user roles and permissions
- [ ] Add notification system

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.
