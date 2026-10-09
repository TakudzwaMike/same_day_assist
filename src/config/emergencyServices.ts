export interface EmergencyServiceOption {
  id: string;
  name: string;
  category: string;
  description: string;
  iconName: string;
  badge: string;
}

export const EMERGENCY_CALL_OUT_FEE = 650.00;

export const EMERGENCY_SERVICES: EmergencyServiceOption[] = [
  {
    id: 'garage-gate',
    name: 'Garage & Gate Automation',
    category: 'Garage & Gate Automation',
    description: 'Motor breakdown, off-track garage doors, jammed gates, power supply failure, emergency manual override.',
    iconName: 'DoorClosed',
    badge: 'Popular'
  },
  {
    id: 'intercom-systems',
    name: 'Intercom Systems & Audio/Video Access',
    category: 'Intercoms',
    description: 'Gate station failure, video monitor no signal, gate release button dead, handset buzzing, wireless/GSM intercom offline.',
    iconName: 'PhoneCall',
    badge: 'Specialist'
  },
  {
    id: 'electric-fence',
    name: 'Electric Fence',
    category: 'Electric Fence',
    description: 'Cut perimeter wire, energizer fault, continuous arcing/tripping, perimeter security tampering.',
    iconName: 'Zap',
    badge: 'Urgent'
  },
  {
    id: 'alarm-armed-response',
    name: 'Alarm & Armed Response',
    category: 'Alarm',
    description: 'Continuous false alarms, siren tampering, partition trouble, communicator failure, armed patrol dispatch.',
    iconName: 'ShieldAlert',
    badge: 'Priority'
  },
  {
    id: 'cctv-monitoring',
    name: 'CCTV & Video Monitoring',
    category: 'CCTV',
    description: 'Surveillance recorder failure, power supply blowout, offline perimeter cameras, video loss.',
    iconName: 'Camera',
    badge: 'Essential'
  },
  {
    id: 'access-control',
    name: 'Access Control Systems',
    category: 'Access Control',
    description: 'Keypad offline, magnetic gate lock jammed, biometric reader faults, tag reader power failure, trapped entry/exit.',
    iconName: 'KeyRound',
    badge: 'Security'
  },
  {
    id: 'electrical-assistance',
    name: 'Electrical Assistance',
    category: 'Electrical Assistance',
    description: 'Severe power trips, burning smell at DB board, exposed live cables, total power failure.',
    iconName: 'Power',
    badge: 'Safety Hazard'
  },
  {
    id: 'plumbing-assistance',
    name: 'Plumbing Assistance',
    category: 'Plumbing Assistance',
    description: 'Burst water main, flooding, geyser failure/overflow, shut-off valve failure.',
    iconName: 'Droplets',
    badge: 'Damage Risk'
  },
  {
    id: 'locksmith-services',
    name: 'Locksmith Services',
    category: 'Locksmith Services',
    description: 'Urgent residential lockout, broken security key in cylinder, damaged high-security lock bolt.',
    iconName: 'Lock',
    badge: 'Access'
  },
  {
    id: 'security-services',
    name: 'Security Services',
    category: 'Security Services',
    description: 'Perimeter compromise, suspicious intrusion, static guarding emergency, immediate physical security.',
    iconName: 'Shield',
    badge: 'Rapid Response'
  }
];

export function isAllowedEmergencyService(serviceName: string): boolean {
  if (!serviceName) return false;
  const lower = serviceName.toLowerCase();
  if (lower.includes('roadside') || lower.includes('towing') || lower.includes('tyre') || lower.includes('flat battery')) {
    return false;
  }
  return EMERGENCY_SERVICES.some(s => 
    s.name.toLowerCase() === lower || 
    s.category.toLowerCase() === lower ||
    lower.includes(s.name.toLowerCase()) ||
    lower.includes(s.category.toLowerCase())
  );
}
