import User from '../models/User';
import { Document } from 'mongoose';

/**
 * Get today's date in YYYY-MM-DD format (local time, not UTC)
 * This ensures dates match the user's timezone (EST)
 */
export function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get yesterday's date in YYYY-MM-DD format (local time, not UTC)
 */
export function getYesterdayString(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const year = yesterday.getFullYear();
  const month = String(yesterday.getMonth() + 1).padStart(2, '0');
  const day = String(yesterday.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculate and update user's streak based on yesterday's completion
 * Streak continues if user completed at least 1 task yesterday
 * Streak resets to 0 if user completed 0 tasks yesterday or didn't log in
 */
function calculateStreak(user: Document & any, yesterdayDate: string): void {
  // Get yesterday's completion count from daily_completion_summary
  // If no entry exists, it means user didn't log in or complete any tasks
  const yesterdayCompleted = user.daily_completion_summary.get(yesterdayDate) || 0;
  
  if (yesterdayCompleted > 0) {
    // User completed at least 1 task yesterday - streak continues
    user.current_streak += 1;
  } else {
    // User completed 0 tasks yesterday OR didn't log in - streak resets
    user.current_streak = 0;
  }
  
  // Update highest streak if current streak is higher
  if (user.current_streak > user.highest_streak) {
    user.highest_streak = user.current_streak;
  }
}

/**
 * Process daily rollover for a user
 * Checks if rollover is needed and updates streak accordingly
 * Should be called on user's first API call of the day
 */
export async function processDailyRollover(userId: string): Promise<void> {
  try {
    const user = await User.findOne({ user_id: userId });
    if (!user) {
      console.warn(`User not found for rollover: ${userId}`);
      return;
    }

    const today = getTodayString();
    const yesterday = getYesterdayString();

    // Check if rollover was already processed today
    if (user.last_rollover_date === today) {
      // Rollover already processed today, skip
      return;
    }

    // Process streak calculation based on yesterday
    calculateStreak(user, yesterday);

    // Update last rollover date to today
    user.last_rollover_date = today;

    // Save user
    await user.save();
  } catch (error) {
    console.error('Error processing daily rollover:', error);
    // Don't throw - rollover failure shouldn't break the API call
  }
}

