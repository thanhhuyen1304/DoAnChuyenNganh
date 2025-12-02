import { Request, Response } from 'express';
import { Favorite } from '../models/favorite.model';
import Challenge from '../models/challenge.model';
import mongoose from 'mongoose';

export const favoriteController = {
  // Get all favorites for current user
  async getFavorites(req: Request, res: Response): Promise<Response | void> {
    try {
      console.log('[favorites] GET called - req.user:', req.user && ({ id: (req.user as any).id, _id: (req.user as any)._id, email: (req.user as any).email }));
      const userId = req.user?._id || (req.user as any)?.id;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      // Query using your DB field names
      const favorites = await Favorite.find({ user_id: userId })
        .populate('exercise_id')
        .sort({ favorited_on: -1 });

      // Return just the exercise IDs for simplicity
      const exerciseIds = favorites.map((f: any) => {
        if (f.exercise_id && f.exercise_id._id) return f.exercise_id._id.toString();
        return f.exercise_id ? f.exercise_id.toString() : null;
      }).filter(Boolean as any);

      res.json(exerciseIds);
    } catch (error) {
      console.error('Error getting favorites:', error);
      res.status(500).json({ message: 'Error getting favorites' });
    }
  },

  // Update favorites for current user
  async updateFavorites(req: Request, res: Response): Promise<Response | void> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      console.log('[favorites] POST called - req.user:', req.user && ({ id: (req.user as any).id, _id: (req.user as any)._id, email: (req.user as any).email }));
      console.log('[favorites] POST body:', req.body);
      const userId = req.user?._id || (req.user as any)?.id;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      const { favoriteIds } = req.body;

      if (!Array.isArray(favoriteIds)) {
        return res.status(400).json({ message: 'favoriteIds must be an array' });
      }

      // Delete existing favorites for the user
      await Favorite.deleteMany({ user_id: userId }, { session });

      // Fetch challenge details for all favoriteIds to get title and language
      const challenges = await Challenge.find({
        _id: { $in: favoriteIds.map((id: string) => new mongoose.Types.ObjectId(String(id))) }
      }).select('_id title language').lean();

      // Create a map for quick lookup
      const challengeMap = new Map(
        challenges.map((ch: any) => [ch._id.toString(), { title: ch.title, language: ch.language }])
      );

      // Insert new favorites with title and language
      const toInsert = favoriteIds
        .map((exerciseId: string) => {
          const challengeInfo = challengeMap.get(exerciseId);
          if (!challengeInfo) {
            console.warn(`Challenge ${exerciseId} not found, skipping...`);
            return null;
          }
          return {
            user_id: new mongoose.Types.ObjectId(String(userId)),
            exercise_id: new mongoose.Types.ObjectId(String(exerciseId)),
            title: challengeInfo.title,
            language: challengeInfo.language,
            favorited_on: new Date()
          };
        })
        .filter((item: any) => item !== null);

      if (toInsert.length > 0) {
        await Favorite.insertMany(toInsert, { session });
      }

      await session.commitTransaction();
      res.json({ message: 'Favorites updated successfully' });
    } catch (error: any) {
      await session.abortTransaction();
      console.error('Error updating favorites:', error);
      // If duplicate key error may occur because of unique index, handle gracefully
      if (error && error.code === 11000) {
        return res.status(409).json({ message: 'Duplicate favorite entry' });
      }
      res.status(500).json({ message: 'Error updating favorites' });
    } finally {
      session.endSession();
    }
  },

  // Toggle favorite for a specific exercise (add or remove)
  async toggleFavorite(req: Request, res: Response): Promise<Response | void> {
    try {
      const userId = req.user?._id || (req.user as any)?.id;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });

      const { exerciseId } = req.body;

      if (!exerciseId) {
        return res.status(400).json({ message: 'exerciseId is required' });
      }

      // Check if favorite already exists
      const existingFavorite = await Favorite.findOne({
        user_id: userId,
        exercise_id: exerciseId
      });

      if (existingFavorite) {
        // Remove favorite
        await Favorite.deleteOne({ _id: existingFavorite._id });
        res.json({ 
          message: 'Favorite removed successfully',
          isFavorite: false 
        });
      } else {
        // Fetch challenge details to get title and language
        const challenge = await Challenge.findById(exerciseId).select('title language').lean();
        
        if (!challenge) {
          return res.status(404).json({ message: 'Challenge not found' });
        }

        // Add favorite with title and language
        const challengeData = challenge as { title: string; language: string };
        const newFavorite = new Favorite({
          user_id: new mongoose.Types.ObjectId(String(userId)),
          exercise_id: new mongoose.Types.ObjectId(String(exerciseId)),
          title: challengeData.title,
          language: challengeData.language,
          favorited_on: new Date()
        });
        await newFavorite.save();
        res.json({ 
          message: 'Favorite added successfully',
          isFavorite: true 
        });
      }
    } catch (error: any) {
      console.error('Error toggling favorite:', error);
      // If duplicate key error may occur because of unique index, handle gracefully
      if (error && error.code === 11000) {
        return res.status(409).json({ message: 'Duplicate favorite entry' });
      }
      res.status(500).json({ message: 'Error toggling favorite' });
    }
  }
};