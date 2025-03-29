// import { Metadata } from 'next';
import Link from 'next/link';
import dbConnect from '../../lib/db/connection';
import { Room, Question, Participant, Reward, Redemption, Answer } from '../../lib/db/models';
import { getCurrentUser } from '../../lib/auth/session';
import { formatCurrency } from '../../lib/utils';
import React from 'react';
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth/authOptions";
import {
  ArrowRightIcon,
  CheckCircleIcon,
  PencilIcon,
  UserGroupIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import ThrDistributionChart from "../../components/admin/ThrDistributionChart";
import CountUp from "../../components/shared/CountUp";

// export const metadata: Metadata = {
//   title: 'Admin Dashboard - Islamic Trivia THR',
//   description: 'Overview of your Islamic Trivia THR games and statistics',
// };

export const dynamic = "force-dynamic";

interface AdminDashboardCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  href: string;
  linkText: string;
}

function AdminDashboardCard({
  title,
  value,
  icon,
  href,
  linkText
}: AdminDashboardCardProps) {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0 bg-[#E7F5F3] p-3 rounded-md">
            {icon}
          </div>
          <div className="ml-5 w-0 flex-1">
            <dt className="text-sm font-medium text-gray-500 truncate">
              {title}
            </dt>
            <dd className="flex items-baseline">
              <div className="text-2xl font-semibold text-gray-900">
                {value.toLocaleString()}
              </div>
            </dd>
          </div>
        </div>
      </div>
      <div className="bg-gray-50 px-4 py-4 sm:px-6">
        <div className="text-sm">
          <Link
            href={href}
            className="font-medium text-[#128C7E] hover:text-[#0e6b5e] flex items-center"
          >
            {linkText}
            <ArrowRightIcon className="ml-1 h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default async function AdminDashboard() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      redirect("/login");
    }

    if (session?.user?.role !== "admin") {
      redirect("/");
    }

    await dbConnect();
  
    // Get current user
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      redirect("/login");
    }
  
    // Get counts for dashboard stats filtered by current user
    const roomsCount = await Room.countDocuments({ createdBy: currentUser.id });
    const questionsCount = await Question.countDocuments({ createdBy: currentUser.id });
    
    // Get rooms created by current user
    const userRooms = await Room.find({ createdBy: currentUser.id });
    const userRoomIds = userRooms.map(room => room._id);
    
    // Get participants count from user's rooms
    const participantsCount = await Participant.countDocuments({ roomId: { $in: userRoomIds } });
    
    // Get rewards created by current user
    const rewardsCount = await Reward.countDocuments({ createdBy: currentUser.id });
  
    // Get recent rooms created by the current user
    const recentRooms = await Room.find({ createdBy: currentUser.id }).sort({ createdAt: -1 }).limit(5);
  
    // Get claims stats for participants in user's rooms
    const claimedCount = await Participant.countDocuments({ 
      roomId: { $in: userRoomIds }, 
      thrClaimStatus: 'claimed' 
    });
    
    const processingCount = await Participant.countDocuments({ 
      roomId: { $in: userRoomIds }, 
      thrClaimStatus: 'processing' 
    });
    
    const unclaimedCount = await Participant.countDocuments({ 
      roomId: { $in: userRoomIds }, 
      thrClaimStatus: 'unclaimed' 
    });
  
    // Get total THR earned by all participants in user's rooms
    const totalThrEarned = await Participant.aggregate([
      { $match: { roomId: { $in: userRoomIds } } },
      { $group: { _id: null, total: { $sum: '$totalRupiah' } } }
    ]);
  
    // Get total THR distributed through redemptions for participants in user's rooms
    const totalThrDistributed = await Redemption.aggregate([
      { 
        $lookup: {
          from: "participants",
          localField: "participantId",
          foreignField: "_id",
          as: "participant"
        }
      },
      { $unwind: "$participant" },
      { 
        $match: { 
          status: 'fulfilled',
          "participant.roomId": { $in: userRoomIds },
          "participant.thrClaimStatus": 'claimed'
        } 
      },
      { $group: { _id: null, total: { $sum: '$rupiahSpent' } } }
    ]);
  
    // Get THR distribution by room (only user's rooms)
    const thrByRoom = await Room.aggregate([
      { $match: { _id: { $in: userRoomIds } } },
      {
        $lookup: {
          from: "participants",
          localField: "_id",
          foreignField: "roomId",
          as: "participants"
        }
      },
      {
        $project: {
          name: 1,
          totalParticipants: { $size: "$participants" },
          totalThrEarned: { $sum: "$participants.totalRupiah" },
        }
      },
      { $sort: { totalThrEarned: -1 } },
      { $limit: 5 }
    ]);
  
    // Get THR distribution by day (last 7 days) for user's participants
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
    const thrByDay = await Redemption.aggregate([
      {
        $lookup: {
          from: "participants",
          localField: "participantId",
          foreignField: "_id",
          as: "participant"
        }
      },
      { $unwind: "$participant" },
      { 
        $match: { 
          createdAt: { $gte: sevenDaysAgo },
          status: "fulfilled",
          "participant.roomId": { $in: userRoomIds },
          "participant.thrClaimStatus": 'claimed'
        } 
      },
      {
        $group: {
          _id: { 
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } 
          },
          total: { $sum: "$rupiahSpent" },
          count: { $sum: 1 }
        }
      },
      { 
        $project: {
          _id: 0,
          date: "$_id",
          total: 1,
          count: 1
        }
      },
      { $sort: { date: 1 } }
    ]);
  
    // Get system vs reward redemptions count and amount for user's participants
    const redemptionTypeStats = await Redemption.aggregate([
      {
        $lookup: {
          from: "participants",
          localField: "participantId",
          foreignField: "_id",
          as: "participant"
        }
      },
      { $unwind: "$participant" },
      { 
        $match: { 
          status: 'fulfilled',
          "participant.roomId": { $in: userRoomIds },
          "participant.thrClaimStatus": 'claimed'
        } 
      },
      { 
        $group: {
          _id: { $cond: [{ $eq: ["$rewardId", null] }, "system", "reward"] },
          total: { $sum: '$rupiahSpent' },
          count: { $sum: 1 }
        }
      }
    ]);
  
    // Process the data
    const earnedRupiah = totalThrEarned.length > 0 ? totalThrEarned[0].total : 0;
    const distributedRupiah = totalThrDistributed.length > 0 ? totalThrDistributed[0].total : 0;
    const remainingRupiah = earnedRupiah - distributedRupiah;
  
    // Format room data
    const roomData = await Promise.all(
      thrByRoom.map(async (item) => {
        const room = await Room.findById(item._id);
        return {
          id: item._id.toString(),
          name: room ? room.name : 'Unknown Room',
          total: item.totalThrEarned || 0,
          count: item.totalParticipants
        };
      })
    );
  
    // Format redemption type data
    const redemptionTypes: {
      system?: { total: number; count: number };
      reward?: { total: number; count: number };
    } = {};
    
    redemptionTypeStats.forEach(type => {
      redemptionTypes[type._id as 'system' | 'reward'] = {
        total: type.total || 0,
        count: type.count || 0
      };
    });
    
    // Ensure all dates in the last 7 days are represented
    const dailyData = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      const dateString = date.toISOString().split('T')[0];
      
      // Find data for this date or use zero values
      const dayData = thrByDay.find(d => d.date === dateString) || { 
        date: dateString,
        total: 0,
        count: 0
      };
      
      dailyData.push(dayData);
    }

    const totalEarned = totalThrEarned[0]?.total || 0;
    const totalDistributed = totalThrDistributed[0]?.total || 0;
    const remainingThr = totalEarned - totalDistributed;
    const distributionPercentage = totalEarned > 0 
      ? Math.round((totalDistributed / totalEarned) * 100) 
      : 0;

    return (
      <div>
        <div className="mb-8 bg-white rounded-lg shadow p-6 border border-gray-100">
          <h1 className="text-2xl font-bold mb-4 text-gray-800">Welcome, {currentUser?.name || 'Admin'}</h1>
          <div className="flex items-center space-x-6">
            <div className="flex-shrink-0">
              <div className="h-20 w-20 rounded-full bg-[#128C7E] flex items-center justify-center text-white text-2xl font-semibold">
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'A'}
              </div>
            </div>
            <div>
              <h2 className="text-xl font-semibold">{currentUser?.name || 'Admin User'}</h2>
              <p className="text-gray-600">{currentUser?.email || 'No email provided'}</p>
              <div className="mt-2 flex space-x-3">
                <Link 
                  href="/dashboard"
                  className="text-sm px-3 py-1 bg-gray-100 rounded-md text-gray-700 cursor-not-allowed opacity-50"
                  // onClick={(e) => e.preventDefault()} // Prevent click action
                >
                  Edit Profile
                </Link>
                <Link 
                  href="/api/auth/signout" 
                  className="text-sm px-3 py-1 bg-red-50 rounded-md text-red-600 hover:bg-red-100"
                >
                  Sign Out
                </Link>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-2 mb-8">
          {/* Stats Cards */}
          <AdminDashboardCard
            title="Your Rooms"
            value={roomsCount}
            icon={
              <UsersIcon className="h-6 w-6 text-[#075E54]" />
            }
            href="/dashboard/rooms"
            linkText="Manage Rooms"
          />
          
          <AdminDashboardCard
            title="Your Participants"
            value={participantsCount}
            icon={
              <UserGroupIcon className="h-6 w-6 text-[#075E54]" />
            }
            href="/dashboard/participants"
            linkText="Manage Participants"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* THR Status */}
          <div className="bg-white shadow rounded-lg p-4">
            <h2 className="text-lg font-medium mb-4">Your THR Distribution</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-500">Total THR Earned</p>
                <p className="text-2xl font-bold text-[#128C7E]">
                  <CountUp
                    value={totalEarned}
                    formatted={formatCurrency(totalEarned)}
                  />
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-500">Total THR Distributed</p>
                <p className="text-2xl font-bold text-[#128C7E]">
                  <CountUp
                    value={totalDistributed}
                    formatted={formatCurrency(totalDistributed)}
                  />
                </p>
              </div>
            </div>
            
            {/* Distribution Progress */}
            <div className="mb-4">
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-500">Distribution Progress</span>
                <span className="text-sm font-medium">{distributionPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-[#128C7E] h-2.5 rounded-full" 
                  style={{ width: `${distributionPercentage}%` }}
                ></div>
              </div>
              <div className="mt-1 text-sm text-gray-500">
                Remaining: {formatCurrency(remainingThr)}
              </div>
            </div>
            
            {/* Redemption Types */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Redemption Types</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-50 p-2 rounded">
                  <p className="text-xs text-gray-500">System Redemptions</p>
                  <p className="font-medium">
                    {redemptionTypes.system?.count || 0} ({formatCurrency(redemptionTypes.system?.total || 0)})
                  </p>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <p className="text-xs text-gray-500">Reward Redemptions</p>
                  <p className="font-medium">
                    {redemptionTypes.reward?.count || 0} ({formatCurrency(redemptionTypes.reward?.total || 0)})
                  </p>
                </div>
              </div>
            </div>
            
            {/* Daily Distribution Chart */}
            <ThrDistributionChart dailyData={dailyData} />
          </div>

          {/* THR Claim Status */}
          <div className="bg-white shadow rounded-lg p-4">
            <h2 className="text-lg font-medium mb-4">Your THR Claim Status</h2>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium">Unclaimed</span>
                  <span className="text-sm font-medium text-gray-500">
                    {unclaimedCount} Participants
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gray-400 h-2 rounded-full"
                    style={{
                      width: `${
                        participantsCount > 0
                          ? (unclaimedCount / participantsCount) * 100
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium">Processing</span>
                  <span className="text-sm font-medium text-gray-500">
                    {processingCount} Participants
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{
                      width: `${
                        participantsCount > 0
                          ? (processingCount / participantsCount) * 100
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium">Claimed</span>
                  <span className="text-sm font-medium text-gray-500">
                    {claimedCount} Participants
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{
                      width: `${
                        participantsCount > 0
                          ? (claimedCount / participantsCount) * 100
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
            
            {/* Top rooms by THR */}
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Your Top Rooms by THR</h3>
              {roomData.length > 0 ? (
                <div className="space-y-3">
                  {roomData.map((room, index) => (
                    <div key={index} className="bg-gray-50 p-2 rounded flex justify-between items-center">
                      <div>
                        <p className="font-medium">{room.name}</p>
                        <p className="text-xs text-gray-500">{room.count} participants</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-[#128C7E]">{formatCurrency(room.total)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No room data available</p>
              )}
            </div>
            
            <div className="mt-6">
              <Link
                href="/participants"
                className="flex items-center text-[#128C7E] font-medium hover:underline"
              >
                View your participants
                <ArrowRightIcon className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </div>
        </div>
        
        {/* Recent Game Rooms */}
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Your Recent Game Rooms</h2>
        <div className="bg-white shadow-sm rounded-lg border border-gray-100">
          {recentRooms.length > 0 ? (
            <ul className="divide-y divide-gray-100">
              {recentRooms.map((room) => (
                <li key={room._id.toString()} className="px-6 py-4 hover:bg-[#f0f2f5] transition-colors duration-150">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{room.name}</h3>
                      <p className="text-sm text-gray-500">
                        Access Code: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{room.accessCode}</span>
                      </p>
                      <p className="text-sm text-gray-500">
                        Created: {new Date(room.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 text-xs rounded-full ${
                        room.isActive 
                          ? 'bg-[#25D366] text-white' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {room.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <Link
                        href={`/dashboard/rooms/${room._id}`}
                        className="text-[#128C7E] hover:text-[#0e6b5e] text-sm"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-6 py-4 text-center text-gray-500">
              No game rooms created yet. Create your first game room to get started.
            </div>
          )}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
            <Link 
              href="/dashboard/rooms"
              className="text-sm text-[#128C7E] hover:text-[#0e6b5e] font-medium"
            >
              View All Your Rooms →
            </Link>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Dashboard Error:", error);
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Dashboard Error</h1>
        <p>An error occurred while loading the dashboard.</p>
      </div>
    );
  }
} 