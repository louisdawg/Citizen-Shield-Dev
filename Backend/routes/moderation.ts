import { Router } from 'express';
import { pool } from '../db';
import { verifyToken, AuthRequest } from '../middleware/auth';

export const moderationRouter = Router();

async function isModerator(userId: string): Promise<boolean> {
  const res = await pool.query(
    `SELECT 1 FROM user_regions
     WHERE user_id = $1 AND role IN ('moderator','hub_coordinator') LIMIT 1`,
    [userId]
  );
  return res.rows.length > 0;
}

// GET /api/moderation  – pending queue (moderators only)
moderationRouter.get('/', verifyToken, async (req: AuthRequest, res) => {
  try {
    const userRes = await pool.query('SELECT id FROM users WHERE google_uid = $1', [req.firebaseUid]);
    if (!userRes.rows[0]) return res.status(404).json({ error: 'User not found' });
    const userId = userRes.rows[0].id;

    if (!(await isModerator(userId))) {
      return res.status(403).json({ error: 'Moderator role required' });
    }

    const result = await pool.query(
      `SELECT mq.id, mq.reason, mq.distance_m, mq.status, mq.moderator_note,
              mq.created_at, mq.reviewed_at,
              p.id           AS post_id,
              p.title, p.description, p.type, p.image_url,
              p.created_at   AS post_created_at,
              u.display_name AS author_name,
              u.avatar_url   AS author_avatar,
              r.slug         AS region_slug,
              r.name         AS region_name
       FROM moderation_queue mq
       JOIN posts   p ON p.id   = mq.post_id
       JOIN users   u ON u.id   = p.author_id
       JOIN regions r ON r.id   = p.region_id
       WHERE mq.status = 'pending'
       ORDER BY mq.created_at ASC
       LIMIT 50`
    );

    return res.json(result.rows.map(row => ({
      id: row.id,
      reason: row.reason,
      distanceM: row.distance_m,
      status: row.status,
      moderatorNote: row.moderator_note,
      createdAt: row.created_at,
      reviewedAt: row.reviewed_at,
      post: {
        id: row.post_id,
        title: row.title,
        description: row.description,
        type: row.type,
        imageUrl: row.image_url,
        createdAt: row.post_created_at,
        author: { displayName: row.author_name, avatarUrl: row.author_avatar },
        region: { slug: row.region_slug, name: row.region_name },
      },
    })));
  } catch (err) {
    console.error('GET /moderation error', err);
    return res.status(500).json({ error: 'Database error' });
  }
});

// POST /api/moderation/:id/review  – approve or reject
moderationRouter.post('/:id/review', verifyToken, async (req: AuthRequest, res) => {
  const { decision, note } = req.body as { decision: 'approved' | 'rejected'; note?: string };

  if (decision !== 'approved' && decision !== 'rejected') {
    return res.status(400).json({ error: 'decision must be "approved" or "rejected"' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const userRes = await client.query('SELECT id FROM users WHERE google_uid = $1', [req.firebaseUid]);
    if (!userRes.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'User not found' });
    }
    const userId = userRes.rows[0].id;

    if (!(await isModerator(userId))) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Moderator role required' });
    }

    const queueRes = await client.query(
      `SELECT id, post_id FROM moderation_queue WHERE id = $1 AND status = 'pending'`,
      [req.params.id]
    );
    if (!queueRes.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Queue entry not found or already reviewed' });
    }
    const { post_id: postId } = queueRes.rows[0];
    const newPostStatus = decision === 'approved' ? 'live' : 'rejected';

    await client.query(
      `UPDATE moderation_queue
       SET status = $1, moderator_id = $2, moderator_note = $3, reviewed_at = now()
       WHERE id = $4`,
      [decision, userId, note ?? null, req.params.id]
    );

    await client.query(
      'UPDATE posts SET post_status = $1, moderation_note = $2 WHERE id = $3',
      [newPostStatus, note ?? null, postId]
    );

    await client.query('COMMIT');
    return res.json({ decision, postId, newPostStatus });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('POST /moderation/:id/review error', err);
    return res.status(500).json({ error: 'Database error' });
  } finally {
    client.release();
  }
});
