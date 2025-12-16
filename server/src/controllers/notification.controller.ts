import { Request, Response } from 'express';
import { Notification } from '../models/notification.model';
import mongoose from 'mongoose';

export const notificationController = {
  // GET /api/notifications - Get all notifications for current user
  async getNotifications(req: Request, res: Response): Promise<Response | void> {
    try {
      const userId = req.user?._id || (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const { page = 1, limit = 20, unreadOnly = false } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const filter: any = { user_id: userId };
      if (unreadOnly === 'true') {
        filter.read = false;
      }

      const notifications = await Notification.find(filter)
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip(skip)
        .lean();

      const total = await Notification.countDocuments(filter);
      const unreadCount = await Notification.countDocuments({ user_id: userId, read: false });

      res.json({
        success: true,
        data: {
          notifications,
          pagination: {
            current: Number(page),
            pages: Math.ceil(total / Number(limit)),
            total,
          },
          unreadCount,
        },
      });
    } catch (error) {
      console.error('Error getting notifications:', error);
      res.status(500).json({ success: false, message: 'Error getting notifications' });
    }
  },

  // GET /api/notifications/unread-count - Get unread count only
  async getUnreadCount(req: Request, res: Response): Promise<Response | void> {
    try {
      const userId = req.user?._id || (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const unreadCount = await Notification.countDocuments({ user_id: userId, read: false });

      res.json({
        success: true,
        data: {
          unreadCount,
        },
      });
    } catch (error) {
      console.error('Error getting unread count:', error);
      res.status(500).json({ success: false, message: 'Error getting unread count' });
    }
  },

  // PATCH /api/notifications/:id/read - Mark notification as read
  async markAsRead(req: Request, res: Response): Promise<Response | void> {
    try {
      const userId = req.user?._id || (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const { id } = req.params;

      const notification = await Notification.findOneAndUpdate(
        { _id: id, user_id: userId },
        { read: true, readAt: new Date() },
        { new: true }
      );

      if (!notification) {
        return res.status(404).json({ success: false, message: 'Notification not found' });
      }

      res.json({
        success: true,
        data: notification,
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ success: false, message: 'Error marking notification as read' });
    }
  },

  // PATCH /api/notifications/read-all - Mark all notifications as read
  async markAllAsRead(req: Request, res: Response): Promise<Response | void> {
    try {
      const userId = req.user?._id || (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const result = await Notification.updateMany(
        { user_id: userId, read: false },
        { read: true, readAt: new Date() }
      );

      res.json({
        success: true,
        data: {
          modifiedCount: result.modifiedCount,
        },
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({ success: false, message: 'Error marking all notifications as read' });
    }
  },

  // DELETE /api/notifications/:id - Delete notification
  async deleteNotification(req: Request, res: Response): Promise<Response | void> {
    try {
      const userId = req.user?._id || (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const { id } = req.params;

      const notification = await Notification.findOneAndDelete({ _id: id, user_id: userId });

      if (!notification) {
        return res.status(404).json({ success: false, message: 'Notification not found' });
      }

      res.json({
        success: true,
        message: 'Notification deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      res.status(500).json({ success: false, message: 'Error deleting notification' });
    }
  },

  // POST /api/notifications - Create a new notification
  async createNotification(req: Request, res: Response): Promise<Response | void> {
    try {
      const userId = req.user?._id || (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const { title, message, type = 'info', link } = req.body;

      if (!title || !message) {
        return res.status(400).json({ 
          success: false, 
          message: 'Title and message are required' 
        });
      }

      const notification = new Notification({
        user_id: userId,
        title,
        message,
        type: type || 'info',
        read: false,
        link: link || undefined,
      });

      await notification.save();

      res.json({
        success: true,
        data: notification,
      });
    } catch (error) {
      console.error('Error creating notification:', error);
      res.status(500).json({ success: false, message: 'Error creating notification' });
    }
  },
};

