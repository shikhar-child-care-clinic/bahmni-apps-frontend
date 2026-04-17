import {
  useTranslation,
  logout,
  notificationService,
  getFormattedError,
} from '@bahmni/services';
import { useActivePractitioner } from '@bahmni/widgets';
import { UserAvatar } from '@carbon/icons-react';
import { OverflowMenu, OverflowMenuItem } from '@carbon/react';
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
    return (
      <div className={styles.loading} role="status">
        {t('LOADING')}
      </div>
    );
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
      const { title } = getFormattedError(error);
      notificationService.showError(title, t('HOME_ERROR_LOGOUT_FAILED'));
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
          onClick={onChangePassword}
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
