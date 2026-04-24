import { Router } from 'express';
import { pool } from '../db';
import { verifyToken, AuthRequest } from '../middleware/auth';

export const regionsRouter = Router();

// GET /api/regions
regionsRouter.get('/', async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, slug, name, intensity, active_hubs, connectivity,
              description, image_url, map_image_url, emergency_contact, updated_at
       FROM regions
       ORDER BY
         CASE intensity WHEN 'CRITICAL' THEN 1 WHEN 'HIGH' THEN 2 WHEN 'ALERT' THEN 3 ELSE 4 END,
         name ASC`
    );
    return res.json(result.rows.map(mapRegion));
  } catch (err) {
    console.error('GET /regions error', err);
    return res.status(500).json({ error: 'Database error' });
  }
});

// GET /api/regions/:slug
regionsRouter.get('/:slug', async (req, res) => {
  try {
    const regionRes = await pool.query(
      `SELECT id, slug, name, intensity, active_hubs, connectivity,
              description, image_url, map_image_url, emergency_contact, updated_at
       FROM regions WHERE slug = $1`,
      [req.params.slug]
    );
    if (!regionRes.rows[0]) return res.status(404).json({ error: 'Region not found' });

    const region = regionRes.rows[0];
    const [zones, resources] = await Promise.all([
      pool.query(
        'SELECT id, name, description FROM region_safe_zones WHERE region_id = $1',
        [region.id]
      ),
      pool.query(
        'SELECT id, title, category, location FROM region_resources WHERE region_id = $1 ORDER BY category',
        [region.id]
      ),
    ]);

    return res.json({
      ...mapRegion(region),
      safeZones: zones.rows,
      resources: resources.rows,
    });
  } catch (err) {
    console.error('GET /regions/:slug error', err);
    return res.status(500).json({ error: 'Database error' });
  }
});

// POST /api/regions/:slug/join
regionsRouter.post('/:slug/join', verifyToken, async (req: AuthRequest, res) => {
  try {
    const userRes = await pool.query('SELECT id FROM users WHERE google_uid = $1', [req.firebaseUid]);
    if (!userRes.rows[0]) return res.status(404).json({ error: 'User not found' });
    const userId = userRes.rows[0].id;

    const regionRes = await pool.query('SELECT id FROM regions WHERE slug = $1', [req.params.slug]);
    if (!regionRes.rows[0]) return res.status(404).json({ error: 'Region not found' });
    const regionId = regionRes.rows[0].id;

    await pool.query(
      `INSERT INTO user_regions (user_id, region_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, region_id) DO NOTHING`,
      [userId, regionId]
    );
    return res.json({ joined: true });
  } catch (err) {
    console.error('POST /regions/:slug/join error', err);
    return res.status(500).json({ error: 'Database error' });
  }
});

// GET /api/regions/:slug/members
regionsRouter.get('/:slug/members', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT COUNT(ur.id)                                              AS total,
              COUNT(ur.id) FILTER (WHERE ur.role = 'moderator')        AS moderators,
              COUNT(ur.id) FILTER (WHERE ur.role = 'hub_coordinator')  AS coordinators
       FROM user_regions ur
       JOIN regions r ON r.id = ur.region_id
       WHERE r.slug = $1`,
      [req.params.slug]
    );
    return res.json(result.rows[0]);
  } catch (err) {
    console.error('GET /regions/:slug/members error', err);
    return res.status(500).json({ error: 'Database error' });
  }
});

function mapRegion(r: Record<string, unknown>) {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    intensity: r.intensity,
    activeHubs: r.active_hubs,
    connectivity: r.connectivity,
    description: r.description,
    imageUrl: r.image_url,
    mapImageUrl: r.map_image_url,
    emergencyContact: r.emergency_contact,
    updatedAt: r.updated_at,
  };
}
