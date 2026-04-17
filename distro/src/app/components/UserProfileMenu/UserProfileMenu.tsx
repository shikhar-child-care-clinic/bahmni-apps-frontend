<<<<<<< HEAD
import { MenuButton, MenuItem, MenuItemDivider } from '@bahmni/design-system';
import { useTranslation, logout } from '@bahmni/services';
=======
import {
  useTranslation,
  logout,
  notificationService,
  getFormattedError,
} from '@bahmni/services';
>>>>>>> 55c72293 (BAH-4519|Replace MenuButton with OverflowMenu for icon-based trigger)
import { useActivePractitioner } from '@bahmni/widgets';
import { UserAvatar } from '@carbon/icons-react';
import { OverflowMenu, OverflowMenuItem } from '@carbon/react';
import React, { useState } from 'react';
import styles from './styles/UserProfileMenu.module.scss';

export const UserProfileMenu: React.FC = () => {
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
      window.location.href = '/bahmni/home/index.html#/login';
    } catch (error) {
      setIsLoggingOut(false);
      // eslint-disable-next-line no-console
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className={styles.profileContainer}>
      <OverflowMenu
        renderIcon={UserAvatar}
        size="sm"
        flipped
        iconDescription={t('HOME_USER_MENU')}
        className={styles.overflowMenu}
        data-testid="user-profile-menu"
      >
        <OverflowMenuItem
          itemText={t('HOME_CHANGE_PASSWORD')}
          onClick={() => {
            window.location.href = '/bahmni/home/index.html#/changePassword';
          }}
          data-testid="change-password-option"
        />
        <OverflowMenuItem
          itemText={t('HOME_LOGOUT')}
          onClick={handleLogout}
          disabled={isLoggingOut}
          data-testid="logout-option"
          hasDivider
        />
      </OverflowMenu>
      <span className={styles.greeting}>Hi, {user.display}</span>
    </div>
  );
};
