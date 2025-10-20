import express from 'express';
import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';
import { asyncHandler, createError } from '@/middleware/errorHandler';

const router = express.Router();

// GET /api/records - List all records
router.get('/', asyncHandler(async (_req: express.Request, res: express.Response) => {
  const collection = mongoose.connection.collection('records');
  const result = await collection.find({}).toArray();
  res.status(200).json({ success: true, data: { records: result } });
}));

// GET /api/records/:id - Get a single record by id
router.get('/:id', asyncHandler(async (req: express.Request, res: express.Response) => {
  const { id } = req.params;
  if (!ObjectId.isValid(id)) {
    throw createError('Invalid ID format', 400);
  }

  const collection = mongoose.connection.collection('records');
  const result = await collection.findOne({ _id: new ObjectId(id) });

  if (!result) {
    throw createError('Record not found', 404);
  }

  res.status(200).json({ success: true, data: { record: result } });
}));

// POST /api/records - Create a new record
router.post('/', asyncHandler(async (req: express.Request, res: express.Response) => {
  const { name, position, level } = req.body || {};

  if (!name || !position || !level) {
    throw createError('name, position and level are required', 400);
  }

  const newDocument = { name, position, level };
  const collection = mongoose.connection.collection('records');
  const result = await collection.insertOne(newDocument);

  res.status(201).json({ success: true, message: 'Record created', data: { insertedId: result.insertedId } });
}));

// PATCH /api/records/:id - Update a record by id
router.patch('/:id', asyncHandler(async (req: express.Request, res: express.Response) => {
  const { id } = req.params;
  if (!ObjectId.isValid(id)) {
    throw createError('Invalid ID format', 400);
  }

  const updates: Record<string, unknown> = {};
  if (req.body?.name !== undefined) updates.name = req.body.name;
  if (req.body?.position !== undefined) updates.position = req.body.position;
  if (req.body?.level !== undefined) updates.level = req.body.level;

  const collection = mongoose.connection.collection('records');
  const result = await collection.updateOne({ _id: new ObjectId(id) }, { $set: updates });

  res.status(200).json({ success: true, message: 'Record updated', data: { matchedCount: result.matchedCount, modifiedCount: result.modifiedCount } });
}));

// DELETE /api/records/:id - Delete a record by id
router.delete('/:id', asyncHandler(async (req: express.Request, res: express.Response) => {
  const { id } = req.params;
  if (!ObjectId.isValid(id)) {
    throw createError('Invalid ID format', 400);
  }

  const collection = mongoose.connection.collection('records');
  const result = await collection.deleteOne({ _id: new ObjectId(id) });

  res.status(200).json({ success: true, message: 'Record deleted', data: { deletedCount: result.deletedCount } });
}));

export default router;


