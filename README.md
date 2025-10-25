# AI Micro-Compliance Tool

An AI-powered compliance checking tool for freelancers and startups. Upload documents, get instant compliance analysis, and export improved versions.

## ✨ Features

### 🔍 **Smart Document Analysis**
- **7 Document Types**: NDA, Freelance Contract, Privacy Policy, Invoice, Offer Letter, Marketing Email, Terms of Service
- **CUAD-Based Prompts**: Specialized AI prompts for each document type
- **Real-time Analysis**: Instant compliance checking with GPT-4o

### 📝 **Rich Text Editor**
- **Grammarly-style Highlighting**: Issues highlighted in red within the document
- **Inline Editing**: Edit text directly in the rich editor
- **Apply Suggestions**: One-click to apply all AI suggestions
- **Rerun Analysis**: Check compliance again after editing

### 📁 **File Support**
- **Multiple Formats**: PDF, DOCX, TXT file uploads
- **Text Extraction**: Automatic text extraction from PDFs
- **Clean Upload**: Professional file upload interface

### 📤 **Export Options**
- **Multiple Formats**: Export as PDF, DOCX, or TXT
- **Preserve Formatting**: Maintain document structure
- **One-click Export**: Quick download buttons

### 🔐 **User Management**
- **Authentication**: Google OAuth integration
- **Subscription Plans**: Starter ($15), Growth ($49), Pro ($99)
- **Usage Tracking**: Document count limits per plan
- **Stripe Integration**: Secure payment processing

### 📊 **Admin & Analytics**
- **MongoDB Logging**: Every contract check is logged with versioned schema
- **Admin Review Panel**: Review and approve contract analysis logs
- **Fine-tuning Export**: Export approved logs for AI model fine-tuning
- **Version Tracking**: Track prompt versions and improvements over time

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- OpenAI API key
- Stripe account (for payments)
- Google OAuth credentials

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-micro-compliance
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Add your API keys:
   ```
   OPENAI_API_KEY=your_openai_key
   STRIPE_SECRET_KEY=your_stripe_secret
   STRIPE_PUBLISHABLE_KEY=your_stripe_publishable
   NEXTAUTH_SECRET=your_nextauth_secret
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   MONGODB_URI=mongodb://localhost:27017/ai-micro-compliance
   ```

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:3000`

## 🎯 Usage

### 1. **Upload or Paste Text**
   - Select document type from dropdown
   - Paste text directly or upload a file (PDF, DOCX, TXT)
   - Click "Check Compliance"

### 2. **Review Issues**
   - Issues are highlighted in red within the document
   - View detailed issue descriptions in the sidebar
   - Edit text directly in the rich editor

### 3. **Apply Improvements**
   - Click "Apply All Suggestions" to use AI improvements
   - Or manually edit the highlighted sections
   - Click "Rerun Compliance Check" to verify fixes

### 4. **Export Final Document**
   - Choose export format: PDF, DOCX, or TXT
   - Download your improved document

### 5. **Admin Review (Admin Users)**
   - Access `/admin/review` to view all contract check logs
   - Review and approve/reject AI analysis results
   - Add admin notes for quality control
   - Export approved logs for fine-tuning data

## 🏗️ Architecture

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **TipTap**: Rich text editor with highlighting
- **NextAuth.js**: Authentication

### Backend
- **Next.js API Routes**: Serverless API endpoints
- **OpenAI GPT-4o**: AI compliance analysis
- **Stripe**: Payment processing
- **Prisma**: Database ORM
- **PostgreSQL**: Database
- **MongoDB**: Contract check logging and analytics
- **Mongoose**: MongoDB ODM for admin features

### Key Components
- `RichTextEditor`: Enhanced text editor with highlighting
- `UploadForm`: File upload and document type selection
- `checkCompliance`: AI analysis API endpoint
- `extract-text`: PDF/DOCX text extraction

## 📊 API Endpoints

### `POST /api/checkCompliance`
Analyzes document for compliance issues.

**Request:**
```json
{
  "text": "document content",
  "docType": "NDA"
}
```

**Response:**
```json
{
  "issues": ["issue 1", "issue 2"],
  "suggested_text": "improved version"
}
```

### `POST /api/extract-text`
Extracts text from uploaded files.

**Request:** FormData with file

**Response:**
```json
{
  "text": "extracted text content"
}
```

### `GET /api/admin/logs`
Fetches all contract check logs for admin review.

**Response:**
```json
[
  {
    "_id": "log_id",
    "userId": "user@example.com",
    "contractTypeDetected": "Freelance Contract",
    "inputContract": "original text",
    "outputIssues": [...],
    "outputRecommendations": [...],
    "outputImprovedContract": "improved text",
    "approved": true,
    "adminNotes": "Admin review notes",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### `POST /api/admin/approve`
Approves or rejects a contract check log.

**Request:**
```json
{
  "logId": "log_id",
  "approved": true,
  "adminNotes": "Optional admin notes"
}
```

### `GET /api/admin/export`
Exports approved logs for fine-tuning data.

**Response:** JSON file download with fine-tuning format

## 🔧 Customization

### Adding New Document Types
1. Add to `promptByDocType` in `/api/checkCompliance.ts`
2. Add option to dropdown in `UploadForm.tsx`
3. Define specific compliance criteria

### Modifying Prompts
Edit the prompts in `/api/checkCompliance.ts` to adjust:
- Compliance criteria
- Analysis depth
- Output format

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository
2. Add environment variables
3. Deploy automatically

### Other Platforms
- **Railway**: Easy PostgreSQL + Node.js deployment
- **Render**: Free tier available
- **DigitalOcean**: App Platform

## 📈 Roadmap

- [ ] **Advanced Highlighting**: More precise issue location
- [ ] **Collaborative Editing**: Multi-user document review
- [ ] **Template Library**: Pre-built document templates
- [ ] **API Access**: Public API for integrations
- [ ] **Mobile App**: React Native companion app
- [ ] **Bulk Processing**: Multiple documents at once

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

This tool provides general information and AI-suggested edits. It is not a substitute for professional legal advice. Always consult a qualified attorney for complex legal matters.
