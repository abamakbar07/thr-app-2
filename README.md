# Islamic Trivia Game for Eid al-Fitr with THR Rewards

A full-stack application that allows administrators to create Islamic trivia game rooms and distribute THR (Tunjangan Hari Raya / Eid monetary gifts) to children based on their performance. This application is designed to make learning about Islam fun and interactive during the Eid al-Fitr celebration.

## Features

### For Admins
- Create and manage game rooms
- Generate unique access codes for participants
- Create, update, and categorize Islamic trivia questions
- Set reward tiers (bronze, silver, gold)
- Track participant progress and reward redemptions

### For Participants (Children)
- Join rooms with access codes
- Select questions from different difficulties
- Answer questions within time limits
- Earn points based on correct answers and speed
- Redeem points for real THR rewards

## Tech Stack

- **Frontend & Backend**: Next.js 14+ with App Router
- **Database**: MongoDB (with Mongoose ODM)
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS
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

## Application Structure

- `/src/app` - Next.js App Router pages and API routes
- `/src/components` - React components
- `/src/lib/db` - Database models and connection
- `/src/lib/auth` - Authentication utilities

## Data Models

- **User** - Admin users who create and manage game rooms
- **Room** - Game rooms created by admins
- **Question** - Trivia questions for each room
- **Participant** - Children playing the game
- **Answer** - Record of answers given by participants
- **Reward** - THR rewards that can be claimed
- **Redemption** - Record of rewards claimed by participants

## Real-time Updates

The application uses polling to update question states and leaderboard data in real-time, which ensures compatibility with Vercel deployment.

## Deployment

This application is designed to be deployed on Vercel. You can deploy directly from GitHub:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/git/external?repository-url=https://github.com/yourusername/islamic-trivia-thr)

Make sure to add the environment variables in the Vercel dashboard.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
