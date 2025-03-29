import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import dbConnect from '@/lib/db/connection';
import { Question } from '@/lib/db/models';
import { getSession } from '@/lib/auth/session';

export const metadata: Metadata = {
  title: 'Question Details - Islamic Trivia THR',
  description: 'View details of a specific question',
};

interface QuestionViewPageProps {
  params: {
    questionId: string;
  };
}

export default async function QuestionViewPage({ params }: QuestionViewPageProps) {
  const { questionId } = await params;
  
  await dbConnect();
  const session = await getSession();
  
  // Fetch the question with populated room and creator info
  const question = await Question.findById(questionId)
    .populate('roomId', 'name createdBy')
    .populate({
      path: 'roomId',
      populate: {
        path: 'createdBy',
        model: 'User',
        select: 'name email'
      }
    });
  
  if (!question) {
    notFound();
  }
  
  // Check if the current user is the creator of this question
  const isCreator = question.roomId?.createdBy?._id.toString() === session?.user?.id;
  
  // Format date for display
  const createdAt = new Date(question.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Question Details</h1>
          <p className="text-gray-500">Viewing complete question information</p>
        </div>
        <div className="flex space-x-2">
          <Link 
            href="/dashboard/questions/browse"
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Back to Browse
          </Link>
          {isCreator && (
            <Link 
              href={`/dashboard/rooms/${question.roomId._id}/questions/${question._id}/edit`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Edit Question
            </Link>
          )}
        </div>
      </div>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 bg-gray-50">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Question Information</h3>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Question Text</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2">{question.text}</dd>
            </div>
            
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Category</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {question.category}
                </span>
              </dd>
            </div>
            
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Difficulty</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  question.difficulty === 'bronze' 
                    ? 'bg-amber-100 text-amber-800' 
                    : question.difficulty === 'silver'
                    ? 'bg-gray-200 text-gray-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
                </span>
              </dd>
            </div>
            
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Rupiah Value</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2">Rp {question.rupiah.toLocaleString()}</dd>
            </div>
            
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Options</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2">
                <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
                  {question.options.map((option: string, index: number) => (
                    <li 
                      key={index} 
                      className={`pl-3 pr-4 py-3 flex items-center justify-between text-sm ${
                        index === question.correctOptionIndex ? 'bg-green-50' : ''
                      }`}
                    >
                      <div className="w-0 flex-1 flex items-center">
                        {index === question.correctOptionIndex && (
                          <svg className="flex-shrink-0 h-5 w-5 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                        <span className={`ml-2 flex-1 w-0 truncate ${index === question.correctOptionIndex ? 'font-semibold' : ''}`}>
                          {option}
                        </span>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <span className="font-medium text-gray-500">
                          Option {index + 1}
                          {index === question.correctOptionIndex && (
                            <span className="ml-2 text-green-600">(Correct)</span>
                          )}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
            
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Explanation</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2">{question.explanation}</dd>
            </div>
            
            {question.imageUrl && (
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Image</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2">
                  <div className="border border-gray-200 rounded-md overflow-hidden w-full max-w-lg">
                    <img src={question.imageUrl} alt="Question" className="w-full h-auto" />
                  </div>
                </dd>
              </div>
            )}
            
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  question.isDisabled 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {question.isDisabled ? 'Disabled' : 'Active'}
                </span>
              </dd>
            </div>
            
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Room</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2">
                <Link 
                  href={`/dashboard/rooms/${question.roomId._id}`}
                  className="text-indigo-600 hover:text-indigo-900"
                >
                  {question.roomId.name}
                </Link>
              </dd>
            </div>
            
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Created By</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2">
                {question.roomId.createdBy.name}
                {isCreator && <span className="ml-2 text-sm text-gray-500">(You)</span>}
              </dd>
            </div>
            
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Created At</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2">{createdAt}</dd>
            </div>
          </dl>
        </div>
      </div>
      
      {isCreator && (
        <div className="mt-6 flex justify-end">
          <Link 
            href={`/dashboard/rooms/${question.roomId._id}/questions`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-3"
          >
            View All Room Questions
          </Link>
          <Link 
            href={`/dashboard/rooms/${question.roomId._id}/questions/${question._id}/edit`}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Edit Question
          </Link>
        </div>
      )}
    </div>
  );
} 