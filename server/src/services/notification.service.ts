import { Notification } from '../models/notification.model';
import mongoose from 'mongoose';

export interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  link?: string;
}

/**
 * Create a notification for a user
 */
export const createNotification = async (params: CreateNotificationParams): Promise<void> => {
  try {
    const notification = new Notification({
      user_id: new mongoose.Types.ObjectId(params.userId),
      title: params.title,
      message: params.message,
      type: params.type,
      read: false,
      link: params.link,
    });
    await notification.save();
    console.log(`[NotificationService] Created notification for user ${params.userId}: ${params.title}`);
  } catch (error) {
    console.error('[NotificationService] Error creating notification:', error);
  }
};

/**
 * Create notification when user completes a challenge and earns XP
 */
export const notifyChallengeCompleted = async (
  userId: string,
  challengeTitle: string,
  xpEarned: number,
  score: number,
  totalPoints: number,
  challengeId: string,
  isFirstTime: boolean = false
): Promise<void> => {
  const scorePercentage = Math.round((score / totalPoints) * 100);
  
  let title: string;
  let message: string;
  
  if (isFirstTime && score === totalPoints) {
    // First time perfect score
    title = '🎉 Hoàn thành bài tập!';
    message = `Chúc mừng! Bạn đã hoàn thành "${challengeTitle}" với điểm tối đa và nhận được +${xpEarned} XP!`;
  } else if (isFirstTime) {
    // First time but not perfect
    title = '✅ Hoàn thành bài tập!';
    message = `Bạn đã hoàn thành "${challengeTitle}" với ${score}/${totalPoints} điểm (${scorePercentage}%) và nhận được +${xpEarned} XP!`;
  } else if (score === totalPoints) {
    // Improved to perfect score
    title = '🌟 Cải thiện điểm số!';
    message = `Tuyệt vời! Bạn đã đạt điểm tối đa cho "${challengeTitle}" và nhận được +${xpEarned} XP!`;
  } else {
    // Improved score
    title = '📈 Cải thiện điểm số!';
    message = `Bạn đã cải thiện điểm số cho "${challengeTitle}" lên ${score}/${totalPoints} điểm (${scorePercentage}%) và nhận được +${xpEarned} XP!`;
  }

  await createNotification({
    userId,
    title,
    message,
    type: 'success',
    link: `/challenge/${challengeId}`,
  });
};

/**
 * Create notification when user wins a PvP match and earns XP
 */
export const notifyPvPWin = async (
  userId: string,
  opponentUsername: string,
  xpEarned: number,
  matchId: string,
  difficulty: string
): Promise<void> => {
  const title = '🏆 Chiến thắng PvP!';
  const message = `Chúc mừng! Bạn đã đánh bại ${opponentUsername} trong trận đấu ${difficulty} và nhận được +${xpEarned} XP!`;

  await createNotification({
    userId,
    title,
    message,
    type: 'success',
    link: `/pvp`,
  });
};

/**
 * Create notification when user loses a PvP match
 */
export const notifyPvPLoss = async (
  userId: string,
  winnerUsername: string,
  matchId: string
): Promise<void> => {
  const title = '💪 Trận đấu kết thúc';
  const message = `Bạn đã thua ${winnerUsername} trong trận đấu PvP. Hãy tiếp tục luyện tập để cải thiện!`;

  await createNotification({
    userId,
    title,
    message,
    type: 'info',
    link: `/pvp`,
  });
};

/**
 * Create notification when user ranks up
 */
export const notifyRankUp = async (
  userId: string,
  oldRank: string,
  newRank: string
): Promise<void> => {
  const title = '⭐ Lên hạng!';
  const message = `Chúc mừng! Bạn đã lên hạng từ ${oldRank} lên ${newRank}!`;

  await createNotification({
    userId,
    title,
    message,
    type: 'success',
    link: `/profile`,
  });
};

/**
 * Create notification when user achieves a milestone
 */
export const notifyMilestone = async (
  userId: string,
  milestone: string,
  description: string,
  link?: string
): Promise<void> => {
  const title = `🎯 ${milestone}`;
  const message = description;

  await createNotification({
    userId,
    title,
    message,
    type: 'info',
    link,
  });
};

