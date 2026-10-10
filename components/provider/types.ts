export interface EquipmentItem {
  id: string;
  title: string;
  category: string;
  dailyRate: string;
  monthlyRate: string;
  salePrice?: string;
  status: 'متاح للإيجار' | 'قيد الصيانة' | 'محجوز' | 'pending' | string;
  photo: string;
  serial_number?: string;
  is_flagged_stolen?: boolean;
  created_at?: string;
}

export interface StolenItem {
  id: string;
  provider_id?: string;
  serial_number: string;
  equipment_model: string;
  proof_document_url?: string;
  status: string;
  notes?: string;
  created_at?: string;
}

export interface ProviderServiceItem {
  id: string;
  provider_id?: string;
  title: string;
  category: string;
  description?: string;
  created_at?: string;
}

export interface ProviderProfileData {
  id?: string;
  name: string;
  organization: string;
  phone: string;
  location: string;
  email: string;
  status: string;
}
