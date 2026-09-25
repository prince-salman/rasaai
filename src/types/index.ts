export type QualityStatus = 'NORMAL' | 'WARNING' | 'DEVIATION';

export interface Branch {
  id: string;
  name: string;
  location: string;
  lastScore: number;
  status: QualityStatus;
  lastUpdate: string;
  activeBatchesToday: number;
  recentDeviationsCount: number;
}

export interface LabValues {
  l: number; // L* Lightness [0..100]
  a: number; // a* Green-Red [-128..127]
  b: number; // b* Blue-Yellow [-128..127]
}

export interface VisionAnalysisResult {
  cielab: LabValues;
  deltaE: number;
  fractalDimension: number; // Df
  porosityScore: number; // Percentage 0..100
  browningIndex: number;
  infraredTempC: number;
  hardnessNewtons: number; // TPA mechanical equivalent
  crispnessIndex: number; // 0..100
  qualityStatus: QualityStatus;
  feedback: string;
  prescriptions: string[];
  executionTimeMs: number;
  sniStandardName: string;
  cppobClause: string;
}

export interface BatchRecord {
  id: string;
  branchId: string;
  branchName: string;
  timestamp: string;
  sampleName: string;
  category: string;
  crispnessScore: number;
  hardnessN: number;
  deltaE: number;
  df: number;
  tempC: number;
  browningIndex: number;
  status: QualityStatus;
  operator: string;
  imageUrl?: string;
  feedback?: string;
}

export interface FoodProfile {
  id: string;
  name: string;
  category: string;
  subtitle: string;
  targetHardnessN: number;
  hardnessMinN: number;
  hardnessMaxN: number;
  targetCrispness: number;
  targetDf: number;
  goldenLab: LabValues;
  optimalOilTempC: number;
  cookingTimeMins: number;
  sniStandard: string;
  description: string;
  sampleImage: string;
}

export interface NotificationItem {
  id: string;
  type: QualityStatus | 'INFO';
  title: string;
  message: string;
  timestamp: string;
  branchName?: string;
  score?: number;
  read?: boolean;
}

export interface FoodValidationResult {
  isValid: boolean;
  errorType?: 'FACE_DETECTED' | 'NOT_FOOD_COLOR' | 'TOO_DARK' | 'TOO_BRIGHT' | 'BLANK_TEXTURE';
  title?: string;
  reason?: string;
  suggestion?: string;
}

