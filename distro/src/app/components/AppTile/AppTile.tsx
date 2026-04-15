import { Tile, Icon, ICON_SIZE } from '@bahmni/design-system';
import { useTranslation } from '@bahmni/services';
import { useHasPrivilege } from '@bahmni/widgets';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './styles/AppTile.module.scss';

interface AppTileProps {
  id: string;
  label: string;
  icon: string;
  url: string;
  privileges?: string[];
}

export const AppTile: React.FC<AppTileProps> = ({
  id,
  label,
  icon,
  url,
  privileges,
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const hasAccess = useHasPrivilege(privileges);

  if (!hasAccess) {
    return null;
  }

  const handleClick = () => {
    navigate(url);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  const translatedLabel = t(label);

  return (
    <Tile
      className={styles.tile}
      role="button"
      tabIndex={0}
      aria-label={translatedLabel}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      data-testid={`app-tile-${id}`}
    >
      <div className={styles.content}>
        <Icon name={icon} id={id} size={ICON_SIZE.LG} aria-hidden="true" />
        <p className={styles.label} aria-hidden="true">
          {translatedLabel}
        </p>
      </div>
    </Tile>
  );
};
