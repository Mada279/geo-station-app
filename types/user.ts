export type UserRole = 'admin' | 'provider' | 'customer';
export type UserStatus = 'active' | 'pending' | 'suspended';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  organization?: string;
  phone?: string;
  createdAt: string;
}

export type CreateUserInput = Omit<User, 'id' | 'createdAt'> & {
  password?: string;
};

export type UpdateUserInput = Partial<Omit<User, 'id' | 'createdAt'>>;
