# AI Lead Generation & Data Enrichment Platform

A powerful cloud-based AI platform that automatically fetches company details, website technology, social media activity, WhatsApp API status, and enriches data with AI-powered insights to score and prioritize leads.

## Features

### 🔍 Comprehensive Data Collection
- **Website Technology Detection**: Automatically detect CMS, e-commerce platforms, frameworks, analytics tools, and hosting providers using BuiltWith API or intelligent web scraping
- **Social Media Presence**: Fetch activity metrics, follower counts, and posting frequency from Instagram, Facebook, LinkedIn, TikTok, and Twitter using SerpAPI
- **WhatsApp Business API Check**: Verify if businesses use WhatsApp Business API and check verification status
- **Company Enrichment**: Gather detailed company information including size, funding, contacts, email, phone using Clearbit and Google Places APIs

### 🤖 AI-Powered Lead Scoring
- **Intelligent Scoring**: AI analyzes website quality, social activity, tech readiness, business maturity, and automation potential
- **Lead Classification**: Automatically categorizes leads as HIGH, MEDIUM, or LOW potential
- **Actionable Insights**: Generate pain points, automation opportunities, and recommended sales approaches using OpenAI GPT-4

### 📊 Advanced Data Management
- **Data Normalization**: Clean and standardize phone numbers, emails, URLs, and location data
- **Dashboard Analytics**: Visual dashboard with statistics, charts, and top lead rankings
- **Export Capabilities**: Export leads to CSV or PDF with customizable filters

### ⚡ Automation Features
- **Scheduled Updates**: Daily lead score updates and weekly automated reports
- **Email Notifications**: Automatically email top leads to your sales team
- **Batch Processing**: Process multiple leads simultaneously with concurrency control
- **Outreach Generation**: AI-generated personalized outreach messages

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: PostgreSQL with Prisma ORM
- **AI/ML**: OpenAI GPT-4 for lead scoring and insights
- **APIs**: BuiltWith, SerpAPI, Clearbit, WhatsApp Cloud API
- **Export**: jsPDF, CSV generation
- **Automation**: node-cron for scheduling

## Installation

### Prerequisites

- Node.js 18+ and npm/yarn
- PostgreSQL database
- API keys for:
  - OpenAI
  - BuiltWith (optional but recommended)
  - SerpAPI (optional but recommended)
  - Clearbit (optional but recommended)
  - WhatsApp Cloud API (optional)

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd upgraded-enigma
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**

   Copy `.env.example` to `.env` and fill in your configuration:
   ```bash
   cp .env.example .env
   ```

   Update the `.env` file with your credentials:
   ```env
   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/lead_generation_db"

   # OpenAI API (Required for AI scoring)
   OPENAI_API_KEY="sk-..."

   # Optional APIs (platform still works without these)
   BUILTWITH_API_KEY="your-builtwith-api-key"
   SERPAPI_KEY="your-serpapi-key"
   CLEARBIT_API_KEY="your-clearbit-api-key"
   WHATSAPP_API_KEY="your-whatsapp-api-key"
   WHATSAPP_BUSINESS_ID="your-whatsapp-business-id"

   # Email Configuration (for automation features)
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT="587"
   SMTP_USER="your-email@gmail.com"
   SMTP_PASS="your-app-password"

   # Application
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npm run db:generate

   # Push schema to database
   npm run db:push

   # Or run migrations
   npm run db:migrate
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

### Adding Leads

1. Click the **"Add Lead"** button in the navigation
2. Enter company information:
   - **Company Name** (required)
   - Website URL (optional but recommended)
   - Location (optional)
   - Industry (optional)
3. Click **"Create Lead"** to start processing

The platform will automatically:
- Detect website technology stack
- Find and analyze social media profiles
- Check WhatsApp Business API status
- Enrich company data
- Calculate lead score (0-100)
- Generate AI insights and recommendations

### Viewing Leads

1. Navigate to the **"Leads"** tab
2. Use filters to find specific leads:
   - Filter by potential (HIGH/MEDIUM/LOW)
   - Filter by status (COMPLETED/PROCESSING/FAILED)
   - Search by company name
3. Click on any lead to view detailed information

### Dashboard

The Dashboard provides:
- **Total leads count**
- **High potential leads**
- **Average lead score**
- **Completed leads**
- **Potential distribution chart**
- **Top 5 highest-scoring leads**

### Exporting Data

1. Go to the **"Leads"** tab
2. Apply any desired filters
3. Click **"Export CSV"** or **"Export PDF"**
4. The file will download automatically

## API Endpoints

### Lead Management

- `POST /api/leads` - Create and process a new lead
- `GET /api/leads` - Get all leads with optional filters
- `GET /api/leads/:id` - Get specific lead details
- `PUT /api/leads/:id` - Update lead score
- `DELETE /api/leads/:id` - Delete a lead

### Batch Processing

- `POST /api/leads/batch` - Process multiple leads at once

### Export

- `GET /api/leads/export?format=csv` - Export leads to CSV
- `GET /api/leads/export?format=pdf` - Export leads to PDF

## Data Processing Pipeline

The platform follows this automated workflow for each lead:

1. **Website Technology Detection**
   - Detect platform (WordPress, Shopify, Wix, etc.)
   - Identify frameworks, CMS, e-commerce solutions
   - Find analytics and tracking tools

2. **Social Media Presence**
   - Search for official profiles on major platforms
   - Extract follower counts and engagement metrics
   - Calculate social presence score

3. **WhatsApp Business Check**
   - Extract phone number from website
   - Verify WhatsApp Business API status
   - Check verification and API enablement

4. **Company Data Enrichment**
   - Fetch company description, size, employees
   - Extract contact information (email, phone)
   - Gather funding and revenue data

5. **Data Normalization**
   - Standardize phone numbers (E.164 format)
   - Validate and clean email addresses
   - Parse and structure location data
   - Categorize industry

6. **AI Lead Scoring**
   - Analyze 5 key factors (0-20 points each):
     - Website Quality
     - Social Activity
     - Tech Readiness
     - Business Maturity
     - Automation Potential
   - Generate total score (0-100)
   - Assign potential tag (HIGH/MEDIUM/LOW)

7. **AI Insights Generation**
   - Identify likely pain points
   - Suggest automation opportunities
   - Recommend sales approach
   - Generate next steps

## Automation Features

### Daily Updates
Automatically updates all lead scores every day at 2 AM.

### Weekly Reports
Sends a comprehensive weekly report every Monday at 9 AM including:
- New leads added
- Total leads and high-potential count
- Average lead score
- Top 10 leads

### Top Leads Emails
On-demand feature to email your sales team with the current top high-potential leads.

### Outreach Message Generation
AI-generated personalized outreach messages for each lead based on their data and insights.

## Architecture

```
upgraded-enigma/
├── app/
│   ├── api/
│   │   └── leads/
│   │       ├── route.ts           # Main leads endpoints
│   │       ├── [id]/route.ts      # Individual lead operations
│   │       ├── batch/route.ts     # Batch processing
│   │       └── export/route.ts    # CSV/PDF export
│   ├── layout.tsx
│   ├── page.tsx                   # Main dashboard page
│   └── globals.css
├── components/
│   ├── Dashboard.tsx              # Dashboard with stats
│   ├── LeadForm.tsx               # Add lead form
│   ├── LeadsList.tsx              # Leads table with filters
│   └── LeadDetails.tsx            # Detailed lead view
├── services/
│   ├── lead-processing.service.ts # Main orchestrator
│   ├── website-tech.service.ts    # Tech stack detection
│   ├── social-media.service.ts    # Social media scraping
│   ├── whatsapp.service.ts        # WhatsApp API checker
│   ├── company-enrichment.service.ts # Company data
│   ├── data-normalization.service.ts # Data cleaning
│   ├── ai-scoring.service.ts      # AI-powered scoring
│   ├── export.service.ts          # CSV/PDF generation
│   └── automation.service.ts      # Scheduled tasks
├── lib/
│   ├── prisma.ts                  # Prisma client
│   └── api-client.ts              # HTTP client utility
├── types/
│   └── index.ts                   # TypeScript interfaces
├── prisma/
│   └── schema.prisma              # Database schema
└── package.json
```

## Database Schema

### Lead Model
- Company information (name, website, location, industry)
- Processing status and stage tracking
- Enriched data (website tech, social media, company info)
- Lead scoring and potential tag
- AI-generated insights
- Timestamps

### LeadHistory Model
- Action tracking
- Score changes over time
- Audit trail

### AutomationTask Model
- Scheduled task management
- Task execution logs
- Error tracking

## Performance Considerations

- **Concurrency Control**: Batch processing limits to 3 concurrent requests
- **Rate Limiting**: Built-in rate limiter for API calls
- **Caching**: Consider adding Redis for API response caching
- **Timeouts**: 30-second timeout for external API calls
- **Error Handling**: Graceful degradation if APIs fail

## Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL is running
# Update DATABASE_URL in .env
npm run db:push
```

### API Rate Limits
If you hit API rate limits, the platform will:
- Fall back to web scraping for tech detection
- Use basic search for social media
- Continue processing without optional data

### Lead Processing Fails
- Check API keys in `.env`
- Verify database connection
- Check logs for specific error messages
- Use retry functionality for failed leads

## Future Enhancements

- [ ] LinkedIn Sales Navigator integration
- [ ] CRM integrations (Salesforce, HubSpot)
- [ ] Webhook support for real-time updates
- [ ] Advanced filtering and search
- [ ] Lead scoring customization
- [ ] Multi-user support with authentication
- [ ] API rate limit management dashboard
- [ ] Advanced analytics and reporting

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - feel free to use this project for commercial purposes.

## Support

For issues, questions, or feature requests, please open an issue on GitHub.

---

**Built with ❤️ using Next.js, TypeScript, and OpenAI GPT-4**
