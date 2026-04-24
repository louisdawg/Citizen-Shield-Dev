import { Router } from 'express';
import { pool } from '../db';
import { verifyToken, AuthRequest } from '../middleware/auth';

export const authRouter = Router();

// POST /api/auth/sync
// Called after Firebase login to create/update the user in Postgres
authRouter.post('/sync', verifyToken, async (req: AuthRequest, res) => {
  const { email, displayName, photoURL } = req.body;
  const googleUid = req.firebaseUid!;

  try {
    const result = await pool.query<{ id: string; is_verified: boolean }>(
      `INSERT INTO users (google_uid, email, display_name, avatar_url, last_active_at)
       VALUES ($1, $2, $3, $4, now())
       ON CONFLICT (google_uid) DO UPDATE
         SET display_name    = EXCLUDED.display_name,
             avatar_url      = EXCLUDED.avatar_url,
             last_active_at  = now()
       RETURNING id, is_verified`,
      [googleUid, email, displayName, photoURL ?? null]
    );

    const user = result.rows[0];
    return res.json({ id: user.id, isVerified: user.is_verified });
  } catch (err) {
    console.error('auth/sync error', err);
    return res.status(500).json({ error: 'Database error' });
  }
});

// GET /api/auth/me
authRouter.get('/me', verifyToken, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.google_uid, u.email, u.display_name, u.avatar_url, u.is_verified,
              u.created_at, u.last_active_at,
              vs.total_posts, vs.qualifying_posts,
              vs.total_upvotes_received, vs.total_downvotes_received
       FROM users u
       LEFT JOIN user_verification_stats vs ON vs.user_id = u.id
       WHERE u.google_uid = $1`,
      [req.firebaseUid]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'User not found' });

    const u = result.rows[0];
    return res.json({
      id: u.id,
      googleUid: u.google_uid,
      email: u.email,
      displayName: u.display_name,
      avatarUrl: u.avatar_url,
      isVerified: u.is_verified,
      createdAt: u.created_at,
      lastActiveAt: u.last_active_at,
      stats: {
        totalPosts: u.total_posts,
        qualifyingPosts: u.qualifying_posts,
        totalUpvotesReceived: u.total_upvotes_received,
        totalDownvotesReceived: u.total_downvotes_received,
      },
    });
  } catch (err) {
    console.error('auth/me error', err);
    return res.status(500).json({ error: 'Database error' });
  }
});
