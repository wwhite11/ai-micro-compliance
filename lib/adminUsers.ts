// List of email addresses that have admin access
export const ADMIN_USERS = [
  'winstonrwhite@gmail.com',
  // Add more admin users here as needed
  // 'admin2@example.com',
  // 'admin3@example.com',
];

export const isAdminUser = (email: string | null | undefined): boolean => {
  if (!email) return false;
  return ADMIN_USERS.includes(email.toLowerCase());
}; 