import { User, CreateUserInput, UpdateUserInput } from '@/types/user';

// Mock in-memory store for demo / development fallback
let MOCK_USERS: User[] = [
  {
    id: 'usr_01',
    name: 'م. محمد فرج',
    email: 'admin@survsta.com',
    role: 'admin',
    status: 'active',
    organization: 'Survsta Core Team',
    phone: '01001234567',
    createdAt: '2026-08-15T10:00:00Z',
  },
  {
    id: 'usr_02',
    name: 'م. أحمد النجار',
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
  {
    id: 'usr_04',
    name: 'دلتا جيوماتكس',
    email: 'contact@deltageo.eg',
    role: 'provider',
    status: 'pending',
    organization: 'دلتا جيوماتكس',
    phone: '01099887766',
    createdAt: '2026-09-05T14:40:00Z',
  },
];

/**
 * Fetch all users (filterable by role/query)
 */
export async function getUsers(): Promise<User[]> {
  await new Promise((res) => setTimeout(res, 200));
  return [...MOCK_USERS];
}

/**
 * Fetch a single user by ID for pre-filling the edit form
 */
export async function getUserById(id: string): Promise<User | null> {
  await new Promise((res) => setTimeout(res, 150));
  const user = MOCK_USERS.find((u) => u.id === id);
  return user ? { ...user } : null;
}

/**
 * Create a new user with assigned role
 */
export async function createUser(data: CreateUserInput): Promise<User> {
  await new Promise((res) => setTimeout(res, 300));
  const newUser: User = {
    ...data,
    id: `usr_${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  MOCK_USERS.unshift(newUser);
  return newUser;
}

/**
 * Update existing user details or role
 */
export async function updateUser(id: string, data: UpdateUserInput): Promise<User> {
  await new Promise((res) => setTimeout(res, 300));
  const index = MOCK_USERS.findIndex((u) => u.id === id);
  if (index === -1) throw new Error('User not found');
  MOCK_USERS[index] = { ...MOCK_USERS[index], ...data };
  return MOCK_USERS[index];
}

/**
 * Permanently delete a user
 */
export async function deleteUser(id: string): Promise<boolean> {
  await new Promise((res) => setTimeout(res, 250));
  MOCK_USERS = MOCK_USERS.filter((u) => u.id !== id);
  return true;
}
