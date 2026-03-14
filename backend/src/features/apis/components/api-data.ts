// --- Types for live provider status ---

export interface ProviderStatus {
  name: string;
  status: 'online' | 'degraded' | 'offline';
  latency: number;
  modelsCount?: number;
  endpoint: string;
  tier: 'Free' | 'Paid';
  limit: string;
  dailyTokens?: string;
  monthlyTokens?: string;
  rateLimit?: string;
  topModels?: string[];
  monthlyCost: number;
  creditUsage?: number;
  creditLimit?: number;
  creditRemaining?: number;
}

export interface ProvidersResponse {
  providers: ProviderStatus[];
  timestamp: number;
  cached: boolean;
}

// --- Static chart data (kept for historical charts) ---

export const apiCallsOverTime = [
  { date: 'Jan 26', calls: 120 },
  { date: 'Jan 27', calls: 185 },
  { date: 'Jan 28', calls: 210 },
  { date: 'Jan 29', calls: 165 },
  { date: 'Jan 30', calls: 240 },
  { date: 'Jan 31', calls: 195 },
  { date: 'Feb 01', calls: 280 },
  { date: 'Feb 02', calls: 220 },
  { date: 'Feb 03', calls: 310 },
  { date: 'Feb 04', calls: 265 },
  { date: 'Feb 05', calls: 340 },
  { date: 'Feb 06', calls: 290 },
  { date: 'Feb 07', calls: 380 },
  { date: 'Feb 08', calls: 320 },
  { date: 'Feb 09', calls: 275 },
  { date: 'Feb 10', calls: 410 },
  { date: 'Feb 11', calls: 355 },
  { date: 'Feb 12', calls: 445 },
  { date: 'Feb 13', calls: 390 },
  { date: 'Feb 14', calls: 480 },
  { date: 'Feb 15', calls: 420 },
  { date: 'Feb 16', calls: 365 },
  { date: 'Feb 17', calls: 510 },
  { date: 'Feb 18', calls: 455 },
  { date: 'Feb 19', calls: 530 },
  { date: 'Feb 20', calls: 490 },
  { date: 'Feb 21', calls: 560 },
  { date: 'Feb 22', calls: 520 },
  { date: 'Feb 23', calls: 475 },
  { date: 'Feb 24', calls: 590 }
];
