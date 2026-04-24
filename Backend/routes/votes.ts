import { Router } from 'express';
import { pool } from '../db';
import { verifyToken, AuthRequest } from '../middleware/auth';

export const votesRouter = Router();

// POST /api/posts/:id/vote   body: { voteType: 'upvote' | 'downvote' | null }
// null removes the existing vote
votesRouter.post('/:id/vote', verifyToken, async (req: AuthRequest, res) => {
  const { voteType } = req.body as { voteType: 'upvote' | 'downvote' | null };

  if (voteType !== null && voteType !== 'upvote' && voteType !== 'downvote') {
    return res.status(400).json({ error: 'voteType must be "upvote", "downvote", or null' });
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

    const postRes = await client.query('SELECT id FROM posts WHERE id = $1', [req.params.id]);
    if (!postRes.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Post not found' });
    }

    if (voteType === null) {
      await client.query(
        'DELETE FROM post_votes WHERE post_id = $1 AND voter_id = $2',
        [req.params.id, userId]
      );
    } else {
      await client.query(
        `INSERT INTO post_votes (post_id, voter_id, vote_type)
         VALUES ($1, $2, $3)
         ON CONFLICT (post_id, voter_id) DO UPDATE SET vote_type = EXCLUDED.vote_type`,
        [req.params.id, userId, voteType]
      );
    }

    // DB trigger sync_vote_counts keeps upvote_count/downvote_count in sync
    const updated = await client.query(
      'SELECT upvote_count, downvote_count FROM posts WHERE id = $1',
      [req.params.id]
    );

    await client.query('COMMIT');
    return res.json({
      upvoteCount: updated.rows[0].upvote_count,
      downvoteCount: updated.rows[0].downvote_count,
      userVote: voteType,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('POST /posts/:id/vote error', err);
    return res.status(500).json({ error: 'Database error' });
  } finally {
    client.release();
  }
});

// GET /api/posts/:id/vote  – current user's vote on a post
votesRouter.get('/:id/vote', verifyToken, async (req: AuthRequest, res) => {
  try {
    const userRes = await pool.query('SELECT id FROM users WHERE google_uid = $1', [req.firebaseUid]);
    if (!userRes.rows[0]) return res.status(404).json({ error: 'User not found' });

    const result = await pool.query(
      'SELECT vote_type FROM post_votes WHERE post_id = $1 AND voter_id = $2',
      [req.params.id, userRes.rows[0].id]
    );
    return res.json({ voteType: result.rows[0]?.vote_type ?? null });
  } catch (err) {
    console.error('GET /posts/:id/vote error', err);
    return res.status(500).json({ error: 'Database error' });
  }
});
