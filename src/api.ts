import { auth } from './firebase';
import { Region, Post, PostType } from './types';

export async function apiFetch(path: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) ?? {}),
  };

  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(path, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }

  return res.json();
}

export async function apiUpload(file: File): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('Must be signed in to upload');

  const token = await user.getIdToken();
  const form = new FormData();
  form.append('image', file);

  const res = await fetch('/api/upload/image', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: form,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error ?? 'Upload failed');
  }

  const data = await res.json();
  return data.url;
}

// ── Region helpers ──

interface ApiRegion {
  id: string;
  slug: string;
  name: string;
  intensity: 'CRITICAL' | 'HIGH' | 'STABLE' | 'ALERT';
  activeHubs: number;
  connectivity: number;
  description: string;
  imageUrl: string | null;
  mapImageUrl: string | null;
  emergencyContact: string | null;
}

interface ApiRegionDetail extends ApiRegion {
  safeZones: { id: string; name: string; description: string | null }[];
  resources: { id: string; title: string; category: string; location: string | null }[];
}

function mapApiRegion(r: ApiRegion): Region {
  return {
    id: r.slug,
    slug: r.slug,
    name: r.name,
    intensity: r.intensity,
    activeHubs: r.activeHubs,
    connectivity: r.connectivity,
    description: r.description ?? '',
    image: r.imageUrl ?? '',
    mapImage: r.mapImageUrl ?? '',
    localInfo: {
      emergencyContact: r.emergencyContact ?? '',
      safeZones: [],
      resources: [],
    },
  };
}

function mapApiRegionDetail(r: ApiRegionDetail): Region {
  const region = mapApiRegion(r);
  region.localInfo.safeZones = r.safeZones.map(z => z.name);
  region.localInfo.resources = r.resources.map(r => r.title);
  return region;
}

export async function fetchRegions(): Promise<Region[]> {
  const data: ApiRegion[] = await apiFetch('/api/regions');
  return data.map(mapApiRegion);
}

export async function fetchRegionDetail(slug: string): Promise<Region> {
  const data: ApiRegionDetail = await apiFetch(`/api/regions/${slug}`);
  return mapApiRegionDetail(data);
}

// ── Post helpers ──

interface ApiPost {
  id: string;
  title: string;
  description: string;
  type: PostType;
  imageUrl: string | null;
  upvoteCount: number;
  downvoteCount: number;
  status: string;
  region: { slug: string; name: string };
  author: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    isVerified: boolean;
  };
  tags: string[];
  createdAt: string;
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'Just Now';
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function mapApiPost(p: ApiPost): Post {
  return {
    id: p.id,
    regionId: p.region.slug,
    time: formatTime(p.createdAt),
    title: p.title,
    description: p.description,
    type: p.type,
    image: p.imageUrl ?? undefined,
    tags: p.tags.length > 0 ? p.tags : undefined,
    upvoteCount: p.upvoteCount,
    downvoteCount: p.downvoteCount,
    author: p.author,
    createdAt: p.createdAt,
  };
}

export async function fetchPosts(regionSlug: string): Promise<Post[]> {
  const data: ApiPost[] = await apiFetch(`/api/posts?regionSlug=${encodeURIComponent(regionSlug)}&status=live`);
  return data.map(mapApiPost);
}

export async function createPost(params: {
  regionSlug: string;
  title: string;
  description: string;
  type: PostType;
  imageUrl?: string;
  tags?: string[];
}): Promise<{ id: string }> {
  return apiFetch('/api/posts', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function voteOnPost(postId: string, voteType: 'upvote' | 'downvote' | null): Promise<{
  upvoteCount: number;
  downvoteCount: number;
  userVote: 'upvote' | 'downvote' | null;
}> {
  return apiFetch(`/api/posts/${postId}/vote`, {
    method: 'POST',
    body: JSON.stringify({ voteType }),
  });
}

export async function joinRegion(slug: string): Promise<void> {
  await apiFetch(`/api/regions/${slug}/join`, { method: 'POST' });
}
