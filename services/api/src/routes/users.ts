import { Router, Response } from "express";
import bcrypt from "bcryptjs";
import { User } from "../models";
import { authenticate, requireRole, AuthRequest } from "../middleware/auth";

const router = Router();
router.use(authenticate);

router.get("/", async (_req: AuthRequest, res: Response): Promise<void> => {
  const users = await User.findAll({ attributes: { exclude: ["password"] } });
  res.json(users);
});

router.post("/", requireRole("admin"), async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, email, password, role, department } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password: hashed, role, department });
  const { password: _p, ...safe } = user.toJSON() as any;
  res.status(201).json(safe);
});

router.put("/:id", async (req: AuthRequest, res: Response): Promise<void> => {
  if (req.user!.role !== "admin" && req.user!.id !== parseInt(req.params.id)) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  const user = await User.findByPk(req.params.id);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  if (req.body.password) req.body.password = await bcrypt.hash(req.body.password, 10);
  await user.update(req.body);
  const { password: _p, ...safe } = user.toJSON() as any;
  res.json(safe);
});

export default router;
