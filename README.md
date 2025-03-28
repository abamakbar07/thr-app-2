# Islamic Trivia Game for Eid al-Fitr with THR Rewards

A full-stack Next.js application that allows administrators to create Islamic trivia game rooms and distribute THR (Tunjangan Hari Raya / Eid monetary gifts) to children based on their performance. This application is designed to make learning about Islam fun and interactive during the Eid al-Fitr celebration.

## Features

### For Admins
- Create and manage game rooms with customizable settings
- Generate unique access codes for participants
- Generate QR codes and direct access links for easy participant onboarding
- Create, update, and categorize Islamic trivia questions by difficulty
- Set reward tiers (bronze, silver, gold) with different point values
- Track participant progress and reward redemptions in real-time
- Monitor live leaderboards during game sessions

### For Participants (Children)
- Join rooms with access codes, direct links, or by scanning QR codes
- Simple and intuitive gameplay interface
- Select questions from different difficulty levels
- Answer questions within customizable time limits
- Earn points based on correct answers and response speed
- View leaderboards to track progress
- Redeem points for real THR rewards

## Tech Stack

- **Frontend & Backend**: Next.js 15+ with App Router
- **Database**: MongoDB (with Mongoose ODM)
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS
- **QR Code Generation**: react-qr-code
- **Notifications**: react-hot-toast
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ 
- MongoDB database (local or MongoDB Atlas)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/islamic-trivia-thr.git
   cd islamic-trivia-thr
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the root directory with the following variables:
   ```
   # MongoDB
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/neothrapp?retryWrites=true&w=majority

   # Authentication
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-secret-key-at-least-32-characters-long

   # Application
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```
   
5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Key Features in Detail

### QR Code and Direct Access Link Generation
- Administrators can generate unique QR codes for each participant access code
- QR codes can be displayed on screen or downloaded for printing
- Direct access links can be shared via email, messaging apps, or social media
- Participants can join games instantly by scanning QR codes or clicking links
- No need to manually enter room codes and access codes

### Room Management
- Create rooms with custom names, descriptions, and date/time settings
- Configure game settings like time per question and leaderboard visibility
- Generate and manage participant access codes
- Monitor active participants and their progress

### Question Management
- Create questions with multiple-choice answers
- Categorize questions by difficulty (bronze, silver, gold)
- Set point values for each question
- Include explanations for correct answers

### Participant Experience
- Simple and engaging user interface
- Real-time feedback on answers
- Leaderboard to track rankings
- Easy THR reward redemption process

## Application Structure

- `/src/app` - Next.js App Router pages and API routes
- `/src/components` - React components for UI elements
- `/src/lib/db` - Database models and connection utilities
- `/src/lib/auth` - Authentication utilities and configuration
- `/src/lib/utils` - Helper functions and utilities

## Data Models

- **User** - Admin users who create and manage game rooms
- **Room** - Game rooms created by admins with configuration settings
- **Question** - Trivia questions with multiple-choice answers and difficulty levels
- **AccessCode** - Unique codes for participant access with active/inactive status
- **Participant** - Children playing the game, linked to rooms and access codes
- **Answer** - Record of answers given by participants, including time taken
- **Reward** - THR rewards that can be claimed based on points earned
- **Redemption** - Record of rewards claimed by participants

## Real-time Updates

The application uses polling to update question states and leaderboard data in real-time, which ensures compatibility with Vercel deployment. Game sessions provide near-instant feedback and live leaderboard updates.

## Deployment

This application is designed to be deployed on Vercel. You can deploy directly from GitHub:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/git/external?repository-url=https://github.com/yourusername/islamic-trivia-thr)

Make sure to add the environment variables in the Vercel dashboard.

## Security Considerations

- Access codes are unique and can be deactivated by administrators
- Direct access links include validation to prevent unauthorized access
- Session management ensures participants can only access their assigned rooms
- Admin authentication protects sensitive operations

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
