export interface Permission {
  inventory: 'full' | 'les' | 'skjult';
  mission: 'full' | 'les' | 'skjult';
  calendar: 'full' | 'les' | 'skjult';
  history: 'full' | 'les' | 'skjult';
  personnel: 'full' | 'les' | 'skjult';
  settings?: 'full' | 'les' | 'skjult';
  isAdmin: boolean;
}

export interface Group {
  id: string;
  name: string;
  isAdmin: boolean;
  permissions: Permission;
}

export interface Personnel {
  id: string;
  name: string;
  groupId: string;
  phone?: string;
  email?: string;
}

export interface AccessoryOption {
  itemId: string;
  recommended: boolean;
  amount?: number;
}

export interface AccessoryGroup {
  id: string;
  label: string;
  type: 'required' | 'optional';
  options: AccessoryOption[];
}

export interface Item {
  id: string;
  name: string;
  category: string;
  price?: number;
  weight?: number;
  location?: string;
  stock?: number;
  itemType: 'unique' | 'bulk';
  accessoryGroups?: AccessoryGroup[];
  // Legacy fields
  requiredGroups?: any[];
  optionalItems?: string[];
}

export interface MissionItem {
  instanceId: string;
  id: string;
  name: string;
  basePrice: number;
  baseWeight: number;
  quantity: number;
  itemType: 'unique' | 'bulk';
  selections: {
    required: Record<string, string>;
    optional: string[];
  };
  rawSelections?: any[];
}

export interface Mission {
  id: string;
  title: string;
  client: string;
  startDate: string;
  endDate: string;
  location: string;
  items: MissionItem[];
  responsibleId?: string;
  lastUpdated?: number;
  color?: string;
  status?: string;
}

export interface AppSettings {
  stockThreshold: number;
  svvApiKey?: string;
}

export interface AppError {
  id: string;
  timestamp: any; // Firestore timestamp or string
  context?: string;
  message: string;
  type: string;
  source?: string;
  line?: number;
  details?: any;
}
export interface Vehicle {
  id: string;
  regnr: string;
  type: string;
  weight: number;
  payload: number;
  length: number;
  height: number;
}
