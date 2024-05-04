import { Request, Response } from 'express';
import AuthService from '../services/authService';

class AuthController {
  authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  async signUp(req: Request, res: Response): Promise<void> {
    console.log(req.body)
    const { username, password, email } = req.body;
    try {
      const result = await this.authService.signUp(username, password, email);
      res.status(201).json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;
    try {
      const result = await this.authService.login(email, password);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
}

export default AuthController;
