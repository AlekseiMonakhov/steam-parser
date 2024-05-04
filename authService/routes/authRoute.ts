import express from 'express';
import { Router } from 'express';
import AuthController from '../controllers/authController';

const authRouter: Router = express.Router();
const authController = new AuthController();

authRouter.post('/sign-up', async (req, res) => {
  await authController.signUp(req, res);
});

authRouter.post('/login', async (req, res) => {
  await authController.login(req, res);
});


export default authRouter;
