import React from 'react';

export type PostType = 'critical' | 'info' | 'broadcast';

export interface Post {
  id: string;
  regionId: string;
  time: string;
  title: string;
  description: string;
  type: PostType;
  image?: string;
  tags?: string[];
  icon?: React.ReactNode;
  upvoteCount: number;
  downvoteCount: number;
  author?: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    isVerified: boolean;
  };
  createdAt?: string;
}

export interface Region {
  id: string;
  slug: string;
  name: string;
  intensity: 'CRITICAL' | 'HIGH' | 'STABLE' | 'ALERT';
  activeHubs: number;
  connectivity: number;
  description: string;
  image: string;
  mapImage: string;
  localInfo: {
    emergencyContact: string;
    safeZones: string[];
    resources: string[];
  };
}
