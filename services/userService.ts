import { User, CreateUserInput, UpdateUserInput } from '@/types/user';

// Mock in-memory store for demo / development fallback
export let MOCK_USERS: User[] = [
  {
    id: 'usr_admin',
    name: 'م. أحمد',
    email: 'ahmed@survsta.com',
    role: 'admin',
    status: 'active',
    organization: 'Survsta Core Team',
    phone: '01001234567',
    createdAt: '2026-08-15T10:00:00Z',
  },
  {
    id: 'usr_provider',
    name: 'م. أحمد النجار',
    email: 'provider@survsta.com',
    role: 'provider',
    status: 'active',
    organization: 'مكتب النخبة للمساحة',
    phone: '01112233445',
    createdAt: '2026-08-20T12:30:00Z',
  },
  {
    id: 'usr_02',
    name: 'م. أحمد النجار (النخبة)',
    email: 'ahmed@elitesurvey.eg',
    role: 'provider',
    status: 'active',
    organization: 'مكتب النخبة للمساحة',
    phone: '01112233445',
    createdAt: '2026-08-20T12:30:00Z',
  },
  {
    id: 'usr_03',
    name: 'شركة أوركيد للتطوير العقاري',
    email: 'procurement@orchid.com',
    role: 'customer',
    status: 'active',
    organization: 'أوركيد العقارية',
    phone: '01223344556',
    createdAt: '2026-09-01T09:15:00Z',
  },
];

/**
 * Explicit Authentication handler for Admin & Provider accounts
 */
export async function authenticateUser(email: string, password?: string): Promise<User> {
  await new Promise((res) => setTimeout(res, 150));
  const cleanEmail = email.toLowerCase().trim();
  const cleanPass = (password || '').trim();

  // Strict check for Admin
  if (cleanEmail === 'ahmed@survsta.com') {
    if (cleanPass !== 'Ahm@d242526') {
      throw new Error('كلمة المرور غير صحيحة لحساب مدير النظام.');
    }
    return MOCK_USERS[0];
  }

  // Check for Provider
  if (cleanEmail === 'provider@survsta.com' || cleanEmail === 'elite@provider.eg' || cleanEmail === 'ahmed@elitesurvey.eg') {
    if (cleanPass && cleanPass !== 'Provider@2026' && cleanPass !== 'provider') {
      throw new Error('كلمة المرور غير صحيحة لحساب مزوّد الخدمة.');
    }
    return MOCK_USERS[1];
  }

  const user = MOCK_USERS.find((u) => u.email.toLowerCase().trim() === cleanEmail);
  if (!user) {
    throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
  }

  return { ...user };
}

export async function getUsers(): Promise<User[]> {
  await new Promise((res) => setTimeout(res, 150));
  return [...MOCK_USERS];
}

export async function getUserById(id: string): Promise<User | null> {
  await new Promise((res) => setTimeout(res, 100));
  const user = MOCK_USERS.find((u) => u.id === id);
  return user ? { ...user } : null;
}

export async function createUser(data: CreateUserInput): Promise<User> {
  await new Promise((res) => setTimeout(res, 200));
  const newUser: User = {
    ...data,
    id: `usr_${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  MOCK_USERS.unshift(newUser);
  return newUser;
}

export async function updateUser(id: string, data: UpdateUserInput): Promise<User> {
  await new Promise((res) => setTimeout(res, 200));
  const index = MOCK_USERS.findIndex((u) => u.id === id);
  if (index === -1) throw new Error('User not found');
  MOCK_USERS[index] = { ...MOCK_USERS[index], ...data };
  return MOCK_USERS[index];
}

export async function deleteUser(id: string): Promise<boolean> {
  await new Promise((res) => setTimeout(res, 150));
  MOCK_USERS = MOCK_USERS.filter((u) => u.id !== id);
  return true;
}
