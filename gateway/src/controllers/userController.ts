import { Request, Response } from 'express';
import userService from '../services/userService';
import { NewUser, User } from '../models/user';
import { z } from 'zod';
import config from '../config/env';

const createUserSchema = z.object({
  username: z.string().min(10).max(50),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['rider', 'driver']).optional(),
});
const userController = {
  async createUser(req: Request, res: Response): Promise<void> {
    try {
      const result = createUserSchema.safeParse(req.body);
      if (!result.success) {
        res.status(400).json({ message: 'Invalid input', errors: result.error.errors });
        return;
      }
      const { username, email, password, role } = result.data;
      const newUser = await userService.createUser(username, email, password, role);
      res.status(201).json(newUser);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error creating user', error });
    }
  },

  async loginUser(req: Request, res: Response): Promise<void> {
    try {
      const { username, password } = req.body;
      const token = await userService.loginUser(username, password);
      if (token) {
        res.cookie('token', token, { httpOnly: true, secure: config.NODE_ENV === 'production' });
        const user = await userService.getUserByUsername(username);
        res.status(200).json({ username, id: user?.id, role: user?.role });
      } else {
        res.status(401).json({ message: 'Invalid credentials' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Error logging in', error });
    }
  },

  async getUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.id;
      const user = await userService.getUserById(userId);
      if (user) {
        res.status(200).json(user);
      } else {
        res.status(404).json({ message: 'User not found' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Error fetching user', error });
    }
  },

  async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.id;
      const result = await userService.deleteUser(userId);
      if (result) {
        res.status(204).send();
      } else {
        res.status(404).json({ message: 'User not found' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Error deleting user', error });
    }
  },

  async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const users = await userService.getAllUsers();
      res.status(200).json(users);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching users', error });
    }
  }
}

export default userController;