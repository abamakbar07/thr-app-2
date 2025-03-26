'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-teal-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            Islamic Trivia Game
          </h1>
          <p className="mt-5 max-w-3xl mx-auto text-xl text-gray-500">
            Test your Islamic knowledge and win exciting Eid al-Fitr THR rewards!
          </p>
          <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
            <div className="rounded-md shadow">
              <Link 
                href="/join" 
                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 md:py-4 md:text-lg md:px-10"
              >
                Join a Game
              </Link>
            </div>
            <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
              <Link 
                href="/signin" 
                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-emerald-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
              >
                Admin Login
              </Link>
            </div>
          </div>
        </div>
        
        <div className="mt-16 sm:mt-24">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">How It Works</h2>
              <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                <div className="text-center">
                  <div className="flex items-center justify-center h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">1. Join a Game Room</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Enter the room access code provided by your teacher or event organizer.
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">2. Answer Islamic Trivia Questions</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Select questions from different difficulty levels and earn points for correct answers.
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">3. Redeem THR Rewards</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Use your earned points to claim real Eid al-Fitr THR rewards.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-16">
          <div className="bg-emerald-700 rounded-2xl shadow-xl overflow-hidden">
            <div className="px-4 py-8 sm:p-10 text-center">
              <h2 className="text-2xl font-bold text-white">Create Your Own Islamic Trivia Room</h2>
              <p className="mt-2 text-emerald-100">
                Are you a teacher or event organizer? Create your own trivia game for Eid al-Fitr.
              </p>
              <div className="mt-6">
                <Link 
                  href="/signin" 
                  className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-emerald-700 bg-white hover:bg-emerald-50 shadow-sm"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <footer className="bg-white">
        <div className="max-w-7xl mx-auto py-12 px-4 overflow-hidden sm:px-6 lg:px-8">
          <nav className="-mx-5 -my-2 flex flex-wrap justify-center">
            <div className="px-5 py-2">
              <Link href="/" className="text-base text-gray-500 hover:text-gray-900">
                Home
              </Link>
            </div>
            <div className="px-5 py-2">
              <Link href="/join" className="text-base text-gray-500 hover:text-gray-900">
                Join Game
              </Link>
            </div>
            <div className="px-5 py-2">
              <Link href="/signin" className="text-base text-gray-500 hover:text-gray-900">
                Admin Login
              </Link>
            </div>
            <div className="px-5 py-2">
              <Link href="/signup" className="text-base text-gray-500 hover:text-gray-900">
                Create Account
              </Link>
            </div>
          </nav>
          <p className="mt-8 text-center text-base text-gray-400">
            &copy; {new Date().getFullYear()} Islamic Trivia THR App. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
