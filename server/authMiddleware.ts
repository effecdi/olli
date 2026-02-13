import type { Request, Response, NextFunction } from "express";
import { supabase } from "./supabaseClient";
import { storage } from "./storage";

export interface AuthRequest extends Request {
  userId?: string;
  supabaseUser?: any;
}

export async function isAuthenticated(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    req.userId = data.user.id;
    req.supabaseUser = data.user;

    await storage.ensureUser({
      id: data.user.id,
      email: data.user.email || null,
      firstName: data.user.user_metadata?.full_name?.split(" ")[0] || data.user.user_metadata?.name?.split(" ")[0] || null,
      lastName: data.user.user_metadata?.full_name?.split(" ").slice(1).join(" ") || null,
      profileImageUrl: data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture || null,
    });

    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    return res.status(401).json({ message: "Authentication failed" });
  }
}
