import { Request, Response } from 'express';
import { UniversityModel } from '../models/university.model';

export const createUniversity = async (req: Request, res: Response) => {
  const uni = await UniversityModel.create(req.body);
  res.status(201).json(uni);
};

export const listUniversities = async (_req: Request, res: Response) => {
  const list = await UniversityModel.find().sort({ name: 1 });
  res.json(list);
};

export const getUniversity = async (req: Request, res: Response) => {
  const uni = await UniversityModel.findById(req.params.id);
  if (!uni) return res.status(404).json({ message: 'University not found' });
  res.json(uni);
};

export const updateUniversity = async (req: Request, res: Response) => {
  const uni = await UniversityModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!uni) return res.status(404).json({ message: 'University not found' });
  res.json(uni);
};

export const deleteUniversity = async (req: Request, res: Response) => {
  const uni = await UniversityModel.findByIdAndDelete(req.params.id);
  if (!uni) return res.status(404).json({ message: 'University not found' });
  res.status(204).send();
};