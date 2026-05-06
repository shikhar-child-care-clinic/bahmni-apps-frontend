import { Header } from '@bahmni/design-system';
import { HeaderGlobalBar, HeaderName } from '@carbon/react';
import React from 'react';
import { LocationSelector } from '../LocationSelector';
import { UserProfileMenu } from '../UserProfileMenu';
import styles from './styles/HomePageHeader.module.scss';

export const HomePageHeader: React.FC = () => (
  <Header
    ariaLabel="Bahmni"
    className={styles.header}
    extraContent={
      <>
        <HeaderName href="/" prefix="Home" />
        <HeaderGlobalBar>
          <div className={styles.locationSelector}>
            <LocationSelector />
          </div>
          <div className={styles.userMenu}>
            <UserProfileMenu />
          </div>
        </HeaderGlobalBar>
      </>
    }
  />
);
