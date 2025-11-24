import express, { Request, Response } from 'express';
import { favoriteController } from '../controllers/favorite.controller';
import { authenticate } from '../middleware/auth';
import { Favorite } from '../models/favorite.model';
import mongoose from 'mongoose';

const router = express.Router();

// --- Temporary debug routes (no auth) -------------------------------------------------
// These are for local debugging only: allow inserting/listing favorites by passing userId
// Remove or protect these in production.
router.post('/debug-insert', async (req: Request, res: Response): Promise<Response | void> => {
	try {
		const { userId, favoriteIds } = req.body;
		if (!userId || !Array.isArray(favoriteIds)) return res.status(400).json({ message: 'userId and favoriteIds required' });

		// simple operation: delete existing then insert
		const session = await mongoose.startSession();
		session.startTransaction();
		try {
			await Favorite.deleteMany({ user_id: userId }, { session });
			const toInsert = favoriteIds.map((id: string) => ({ user_id: new mongoose.Types.ObjectId(String(userId)), exercise_id: new mongoose.Types.ObjectId(String(id)), favorited_on: new Date() }));
			if (toInsert.length) await Favorite.insertMany(toInsert, { session });
			await session.commitTransaction();
			res.json({ message: 'debug insert ok' });
		} catch (err) {
			await session.abortTransaction();
			console.error('debug-insert err', err);
			res.status(500).json({ message: 'debug insert failed' });
		} finally {
			session.endSession();
		}
	} catch (err) {
		res.status(500).json({ message: 'server error' });
	}
});

router.get('/debug-list', async (req: Request, res: Response): Promise<Response | void> => {
	try {
		const userId = String(req.query.userId || '');
		if (!userId) return res.status(400).json({ message: 'userId query required' });
		const list = await Favorite.find({ user_id: userId }).limit(50).lean();
		res.json(list);
	} catch (err) {
		console.error('debug-list err', err);
		res.status(500).json({ message: 'server error' });
	}
});

// -------------------------------------------------------------------------------------

// All favorite routes require authentication
router.use(authenticate);

// Get all favorites for current user
router.get('/', favoriteController.getFavorites);

// Update favorites for current user
router.post('/', favoriteController.updateFavorites);

// Toggle favorite for a specific exercise
router.post('/toggle', favoriteController.toggleFavorite);

export default router;