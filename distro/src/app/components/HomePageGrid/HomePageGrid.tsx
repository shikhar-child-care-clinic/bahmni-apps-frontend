import { Grid, Column } from '@bahmni/design-system';
import React, { useEffect, useState } from 'react';
import { Module, getVisibleModules } from '../../../services/moduleService';
import { AppTile } from '../AppTile';
import styles from './styles/HomePageGrid.module.scss';

export const HomePageGrid: React.FC = () => {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadModules = async () => {
      try {
        setLoading(true);
        setError(null);

        const visibleModules = await getVisibleModules(
          'org.bahmni.home.dashboard',
        );

        setModules(visibleModules);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to load modules';
        setError(message);
        // eslint-disable-next-line no-console
        console.error('Error loading modules:', err);
      } finally {
        setLoading(false);
      }
    };

    loadModules();
  }, []);

  if (loading) {
    return (
      <div className={styles.container}>
        <Grid>
          {[...Array(6)].map(() => (
            <Column
              key={Math.random()}
              lg={4}
              md={4}
              sm={4}
              className={styles.tileColumn}
            >
              <div className={styles.skeletonTile} />
            </Column>
          ))}
        </Grid>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  if (modules.length === 0) {
    return <div className={styles.emptyState}>No modules available</div>;
  }

  return (
    <div className={styles.container}>
      <Grid>
        {modules.map((module) => (
          <Column
            key={module.id}
            lg={4}
            md={4}
            sm={4}
            className={styles.tileColumn}
          >
            <AppTile
              id={module.id}
              label={module.translationKey ?? module.label}
              icon={module.icon}
              url={module.url}
              privileges={
                module.requiredPrivilege
                  ? [module.requiredPrivilege]
                  : undefined
              }
            />
          </Column>
        ))}
      </Grid>
    </div>
  );
};
