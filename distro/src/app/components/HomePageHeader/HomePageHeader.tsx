import {
  fetchWhiteLabelConfig,
  stripHeaderHtml,
  type WhiteLabelConfig,
} from '@bahmni/services';
import {
  Header as CarbonHeader,
  HeaderGlobalBar,
  HeaderName,
} from '@carbon/react';
import React, { useEffect, useState } from 'react';
import { LocationSelector } from '../LocationSelector';
import { UserProfileMenu } from '../UserProfileMenu';
import styles from './styles/HomePageHeader.module.scss';

export const HomePageHeader: React.FC = () => {
  const [whitelabel, setWhitelabel] = useState<WhiteLabelConfig>({});

  useEffect(() => {
    let mounted = true;
    fetchWhiteLabelConfig().then((cfg) => {
      if (mounted) setWhitelabel(cfg);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const clinicName = stripHeaderHtml(whitelabel.homePage?.header_text);
  const subtitle = whitelabel.homePage?.title_text ?? '';
  const logo = whitelabel.homePage?.logo;

  return (
    <CarbonHeader
      aria-label={clinicName || 'Bahmni'}
      data-testid="home-page-header"
      className={styles.header}
    >
      <HeaderName href="/" prefix="Home">
        {logo && (
          <img
            src={logo}
            alt=""
            className={styles.logo}
            data-testid="clinic-logo"
          />
        )}
        {clinicName && (
          <span className={styles.clinicName} data-testid="clinic-name">
            {clinicName}
          </span>
        )}
        {subtitle && (
          <span className={styles.subtitle} data-testid="clinic-subtitle">
            {subtitle}
          </span>
        )}
      </HeaderName>
      <HeaderGlobalBar>
        <div className={styles.locationSelector}>
          <LocationSelector />
        </div>
        <div className={styles.userMenu}>
          <UserProfileMenu />
        </div>
      </HeaderGlobalBar>
    </CarbonHeader>
  );
};
