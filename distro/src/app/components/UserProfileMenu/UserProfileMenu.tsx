import { MenuButton, MenuItem, MenuItemDivider } from '@bahmni/design-system';
import { useTranslation, logout } from '@bahmni/services';
import { useActivePractitioner } from '@bahmni/widgets';
import React, { useState } from 'react';
import styles from './styles/UserProfileMenu.module.scss';

interface UserProfileMenuProps {
  onChangePassword?: () => void;
}

export const UserProfileMenu: React.FC<UserProfileMenuProps> = ({
  onChangePassword,
}) => {
  const { t } = useTranslation();
  const { user, loading } = useActivePractitioner();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  if (loading) {
    return <div className={styles.loading}>{t('LOADING')}</div>;
  }

  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      window.location.href = '/';
    } catch (error) {
      setIsLoggingOut(false);
      // eslint-disable-next-line no-console
      console.error('Logout failed:', error);
    }
  };

  return (
    <MenuButton
      label={user.display}
      className={styles.menuButton}
      data-testid="user-profile-menu"
    >
      <MenuItem
        label={t('HOME_CHANGE_PASSWORD')}
        onClick={onChangePassword}
        data-testid="change-password-option"
      />
      <MenuItemDivider />
      <MenuItem
        label={t('HOME_LOGOUT')}
        onClick={handleLogout}
        disabled={isLoggingOut}
        data-testid="logout-option"
      />
    </MenuButton>
  );
};
