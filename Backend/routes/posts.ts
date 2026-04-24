import { Router } from 'express';
import { pool } from '../db';
import { verifyToken, optionalToken, AuthRequest } from '../middleware/auth';

export const postsRouter = Router();

// GET /api/posts?regionSlug=&status=live&limit=20&offset=0&tag=
postsRouter.get('/', optionalToken, async (req: AuthRequest, res) => {
  const {
    regionSlug,
    status = 'live',
    limit = '20',
    offset = '0',
    tag,
  } = req.query as Record<string, string>;

  const params: unknown[] = [parseInt(limit, 10), parseInt(offset, 10), status];
  const conditions: string[] = ['p.post_status = $3'];

  if (regionSlug) {
    params.push(regionSlug);
    conditions.push(`r.slug = $${params.length}`);
  }
  if (tag) {
    params.push(tag);
    conditions.push(`EXISTS (SELECT 1 FROM post_tags pt WHERE pt.post_id = p.id AND pt.tag = $${params.length})`);
  }

  const where = 'WHERE ' + conditions.join(' AND ');

  try {
    const result = await pool.query(
      `SELECT p.id, p.title, p.description, p.type, p.image_url,
              p.upvote_count, p.downvote_count, p.post_status,
              p.location_public_lat, p.location_public_lng, p.location_label, p.location_status,
              p.created_at, p.updated_at,
              r.slug  AS region_slug,
              r.name  AS region_name,
              u.id    AS author_id,
              u.display_name AS author_name,
              u.avatar_url   AS author_avatar,
              u.is_verified  AS author_verified,
              COALESCE(json_agg(DISTINCT pt.tag) FILTER (WHERE pt.tag IS NOT NULL), '[]') AS tags
       FROM posts p
       JOIN regions r ON r.id = p.region_id
       JOIN users  u ON u.id = p.author_id
       LEFT JOIN post_tags pt ON pt.post_id = p.id
       ${where}
       GROUP BY p.id, r.slug, r.name, u.id
       ORDER BY p.created_at DESC
       LIMIT $1 OFFSET $2`,
      params
    );
    return res.json(result.rows.map(mapPost));
  } catch (err) {
    console.error('GET /posts error', err);
    return res.status(500).json({ error: 'Database error' });
  }
});

// GET /api/posts/:id
postsRouter.get('/:id', optionalToken, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      `SELECT p.id, p.title, p.description, p.type, p.image_url,
              p.upvote_count, p.downvote_count, p.post_status, p.moderation_note,
              p.location_public_lat, p.location_public_lng, p.location_label, p.location_status,
              p.created_at, p.updated_at,
              r.slug  AS region_slug,
              r.name  AS region_name,
              u.id    AS author_id,
              u.display_name AS author_name,
              u.avatar_url   AS author_avatar,
              u.is_verified  AS author_verified,
              COALESCE(json_agg(DISTINCT pt.tag) FILTER (WHERE pt.tag IS NOT NULL), '[]') AS tags
       FROM posts p
       JOIN regions r ON r.id = p.region_id
       JOIN users  u ON u.id = p.author_id
       LEFT JOIN post_tags pt ON pt.post_id = p.id
       WHERE p.id = $1
       GROUP BY p.id, r.slug, r.name, u.id`,
      [req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Post not found' });
    return res.json(mapPost(result.rows[0]));
  } catch (err) {
    console.error('GET /posts/:id error', err);
    return res.status(500).json({ error: 'Database error' });
  }
});

// POST /api/posts
postsRouter.post('/', verifyToken, async (req: AuthRequest, res) => {
  const {
    regionSlug,
    title,
    description,
    type,
    imageUrl,
    tags,
    locationLat,
    locationLng,
    locationLabel,
  } = req.body as {
    regionSlug: string;
    title: string;
    description: string;
    type: 'critical' | 'info' | 'broadcast';
    imageUrl?: string;
    tags?: string[];
    locationLat?: number;
    locationLng?: number;
    locationLabel?: string;
  };

  if (!regionSlug || !title || !description || !type) {
    return res.status(400).json({ error: 'regionSlug, title, description, and type are required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const userRes = await client.query('SELECT id FROM users WHERE google_uid = $1', [req.firebaseUid]);
    if (!userRes.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'User not found — call /api/auth/sync first' });
    }
    const userId = userRes.rows[0].id;

    const regionRes = await client.query('SELECT id FROM regions WHERE slug = $1', [regionSlug]);
    if (!regionRes.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Region not found' });
    }
    const regionId = regionRes.rows[0].id;

    // Blur public coordinates to ~1.1 km (2 decimal places)
    const publicLat = locationLat != null ? Math.round(locationLat * 100) / 100 : null;
    const publicLng = locationLng != null ? Math.round(locationLng * 100) / 100 : null;

    const postRes = await client.query<{ id: string }>(
      `INSERT INTO posts
         (region_id, author_id, title, description, type, image_url,
          location_lat, location_lng, location_source,
          location_public_lat, location_public_lng, location_label, location_status,
          post_status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'live')
       RETURNING id`,
      [
        regionId, userId, title, description, type, imageUrl ?? null,
        locationLat ?? null, locationLng ?? null,
        locationLat != null ? 'manual' : null,
        publicLat, publicLng, locationLabel ?? null,
        locationLat != null ? 'verified' : 'none',
      ]
    );

    const postId = postRes.rows[0].id;

    if (tags?.length) {
      const tagValues = tags.map((_, i) => `($1, $${i + 2})`).join(', ');
      await client.query(
        `INSERT INTO post_tags (post_id, tag) VALUES ${tagValues} ON CONFLICT DO NOTHING`,
        [postId, ...tags]
      );
    }

    await client.query('COMMIT');
    return res.status(201).json({ id: postId });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('POST /posts error', err);
    return res.status(500).json({ error: 'Database error' });
  } finally {
    client.release();
  }
});

// DELETE /api/posts/:id  (author or moderator/hub_coordinator of that region)
postsRouter.delete('/:id', verifyToken, async (req: AuthRequest, res) => {
  try {
    const userRes = await pool.query('SELECT id FROM users WHERE google_uid = $1', [req.firebaseUid]);
    if (!userRes.rows[0]) return res.status(404).json({ error: 'User not found' });
    const userId = userRes.rows[0].id;

    const postRes = await pool.query('SELECT author_id, region_id FROM posts WHERE id = $1', [req.params.id]);
    if (!postRes.rows[0]) return res.status(404).json({ error: 'Post not found' });

    const { author_id: authorId, region_id: regionId } = postRes.rows[0];

    if (authorId !== userId) {
      const modRes = await pool.query(
        `SELECT 1 FROM user_regions
         WHERE user_id = $1 AND region_id = $2 AND role IN ('moderator','hub_coordinator')`,
        [userId, regionId]
      );
      if (!modRes.rows[0]) return res.status(403).json({ error: 'Not authorized to delete this post' });
    }

    await pool.query('DELETE FROM posts WHERE id = $1', [req.params.id]);
    return res.json({ deleted: true });
  } catch (err) {
    console.error('DELETE /posts/:id error', err);
    return res.status(500).json({ error: 'Database error' });
  }
});

function mapPost(r: Record<string, unknown>) {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    type: r.type,
    imageUrl: r.image_url,
    upvoteCount: r.upvote_count,
    downvoteCount: r.downvote_count,
    status: r.post_status,
    moderationNote: r.moderation_note ?? undefined,
    location: r.location_public_lat != null
      ? {
          lat: r.location_public_lat,
          lng: r.location_public_lng,
          label: r.location_label,
          status: r.location_status,
        }
      : null,
    region: { slug: r.region_slug, name: r.region_name },
    author: {
      id: r.author_id,
      displayName: r.author_name,
      avatarUrl: r.author_avatar,
      isVerified: r.author_verified,
    },
    tags: r.tags,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}
