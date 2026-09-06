import * as React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';

interface AuthProps {
  permission: string;
  children: React.ReactNode;
}
// 权限组件
const Auth: React.FC<AuthProps> = ({ permission, children }) => {
  const permissions = useSelector((state: RootState) => state.permission.permissions);
  if (!permissions.includes(permission)) {
    return null;
  }
  return <>{children}</>;
};
export default Auth;
