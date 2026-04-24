import { Region, Post } from './types';

export const INITIAL_REGIONS: Region[] = [
  {
    id: 'nepal',
    slug: 'nepal',
    name: 'NEPAL',
    intensity: 'CRITICAL',
    activeHubs: 14,
    connectivity: 62,
    description: 'Community-led support networks are active across the Kathmandu Valley. Stay connected for mutual aid updates and safe passage routes.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBBhc6g7InHjxlakizsKbeR1BiLvVqQYrSvqlw1d_ReDC7Kp-2vlrTdLg5ZhLnTxIuxHiktkrp3e3lYPOFl92bJ_Mqov7xfuoFAzcKPu7THTAmtbD2t-PZNNVMvzQn3-3x2dgATmO3eNu9mw9h7cR_ZwAGRdoB0eN7S25CNArc4J1qz0oFebM3KKIe8m1Cgqg0Ifyl5rIgAKiRdIGUxenxov4kXcrKiAGEA2kZpwg7Q1seNmQZYs5xsT9oTWJ7porIAlBrI71vT3hE',
    mapImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDp7zi6QfGT-cUrqzl4Jc3FOqG3jJ0AUdMTBrdh9suF2DKHFONvBtx4UXWKgdhjhs--jovsULyrvBwQvKbv7oPykJ9xDegpikcYRdZZAf0Niyar-rCo-xRgjbIMcqviH6t7b_WkT4dGr9JrFN1l5pxj1LRUEKZjw4wukRJWIkHdPEmnNBKwkH2_K4LH8AJMgoygJntzA7SSNb5J-SqlR902QYW3FqGfCSWazUjPTssh0OEz7TIGwOgcrvifr2NTcOCdSKUWRWUh--g',
    localInfo: {
      emergencyContact: '+977 1-4200105 (Community Hotline)',
      safeZones: ['Patan Durbar Square Hub', 'Lakeside Pokhara Node', 'Dharan Community Center'],
      resources: ['Medical Supplies (Patan)', 'Food Distribution (Baneshwor)', 'Legal Aid (Kathmandu)']
    }
  },
  {
    id: 'myanmar',
    slug: 'myanmar',
    name: 'MYANMAR',
    intensity: 'HIGH',
    activeHubs: 28,
    connectivity: 45,
    description: 'Civil Disobedience Movement (CDM) nodes are coordinating essential services. Mesh networks are critical for communication in Yangon and Mandalay.',
    image: 'https://picsum.photos/seed/myanmar/1920/1080',
    mapImage: 'https://picsum.photos/seed/myanmar-map/800/800',
    localInfo: {
      emergencyContact: 'Signal: @MyanmarAid_Bot',
      safeZones: ['Hlaing Tharyar Underground Hub', 'Mandalay University Safe Corridor', 'Shan State Border Nodes'],
      resources: ['Mesh Network Nodes (Yangon)', 'Encrypted Comms Support', 'Underground Medical Clinics']
    }
  },
  {
    id: 'sudan',
    slug: 'sudan',
    name: 'SUDAN',
    intensity: 'CRITICAL',
    activeHubs: 12,
    connectivity: 38,
    description: 'Resistance Committees are managing neighborhood-level aid distribution. Stay alert for updates on safe zones and medical supply drops.',
    image: 'https://picsum.photos/seed/sudan/1920/1080',
    mapImage: 'https://picsum.photos/seed/sudan-map/800/800',
    localInfo: {
      emergencyContact: 'WhatsApp: +249 912 345 678',
      safeZones: ['Omdurman Neighborhood Hub', 'Khartoum North Resistance Node', 'Port Sudan Logistics Center'],
      resources: ['Medical Supply Drops (Khartoum)', 'Neighborhood Kitchens', 'Satellite Internet Access']
    }
  },
  {
    id: 'iran',
    slug: 'iran',
    name: 'IRAN',
    intensity: 'HIGH',
    activeHubs: 42,
    connectivity: 55,
    description: 'Decentralized networks are providing critical updates on internet blackouts and safe zones. Community solidarity remains the backbone of the movement.',
    image: 'https://picsum.photos/seed/iran/1920/1080',
    mapImage: 'https://picsum.photos/seed/iran-map/800/800',
    localInfo: {
      emergencyContact: 'Telegram: @IranFreedom_Support',
      safeZones: ['Tehran University Perimeter Hub', 'Tabriz Solidarity Node', 'Shiraz Community Safehouse'],
      resources: ['VPN/Proxy Distribution', 'First Aid Training (Tehran)', 'Legal Defense Network']
    }
  },
  {
    id: 'georgia',
    slug: 'georgia',
    name: 'GEORGIA',
    intensity: 'ALERT',
    activeHubs: 18,
    connectivity: 88,
    description: 'Monitoring legislative developments and coordinating peaceful assemblies. Legal aid networks are fully operational across Tbilisi.',
    image: 'https://picsum.photos/seed/georgia/1920/1080',
    mapImage: 'https://picsum.photos/seed/georgia-map/800/800',
    localInfo: {
      emergencyContact: '+995 32 2 123 456',
      safeZones: ['Rustaveli Avenue Legal Hub', 'Tbilisi State University Node', 'Batumi Assembly Point'],
      resources: ['Legal Aid (Tbilisi)', 'Assembly Coordination', 'Human Rights Monitoring']
    }
  }
];

export const INITIAL_POSTS: Post[] = [
  {
    id: '1',
    regionId: 'nepal',
    time: '09:42 UTC - Now',
    title: 'Maitighar Mandala Intersection Occupied',
    description: 'Over 5,000 activists have successfully established a non-violent perimeter. State security forces are assembling at the southern gate. Avoid the Baneshwor route; secure corridor established through New Road.',
    type: 'critical',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBBhc6g7InHjxlakizsKbeR1BiLvVqQYrSvqlw1d_ReDC7Kp-2vlrTdLg5ZhLnTxIuxHiktkrp3e3lYPOFl92bJ_Mqov7xfuoFAzcKPu7THTAmtbD2t-PZNNVMvzQn3-3x2dgATmO3eNu9mw9h7cR_ZwAGRdoB0eN7S25CNArc4J1qz0oFebM3KKIe8m1Cgqg0Ifyl5rIgAKiRdIGUxenxov4kXcrKiAGEA2kZpwg7Q1seNmQZYs5xsT9oTWJ7porIAlBrI71vT3hE',
    upvoteCount: 0,
    downvoteCount: 0,
  },
  {
    id: '2',
    regionId: 'nepal',
    time: '07:15 UTC',
    title: 'Pokhara Regional Updates',
    description: 'Local coordination centers in Pokhara report 100% participation in the general strike. Public transport remains suspended. Secure mesh networks are active near the lakeside.',
    type: 'info',
    tags: ['RegionalStrike', 'ConnectivitySafe'],
    upvoteCount: 0,
    downvoteCount: 0,
  },
  {
    id: '3',
    regionId: 'myanmar',
    time: '11:20 UTC',
    title: 'Yangon Mesh Network Expansion',
    description: 'New nodes established in Hlaing Tharyar. Citizens are encouraged to connect to the "CDM-Secure" SSID for encrypted local communication.',
    type: 'info',
    tags: ['MeshNet', 'Yangon'],
    upvoteCount: 0,
    downvoteCount: 0,
  },
  {
    id: '4',
    regionId: 'sudan',
    time: '10:05 UTC',
    title: 'Khartoum Medical Supply Drop',
    description: 'Emergency supplies delivered to the Omdurman neighborhood hub. Volunteers needed for distribution. Contact your local coordinator.',
    type: 'critical',
    upvoteCount: 0,
    downvoteCount: 0,
  }
];
