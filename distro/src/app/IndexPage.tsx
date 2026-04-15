import React from 'react';
import { HomePageGrid } from './components/HomePageGrid';
import { HomePageHeader } from './components/HomePageHeader';

export const IndexPage: React.FC = () => {
  return (
    <>
      <HomePageHeader />
      <main>
        <HomePageGrid />
      </main>
    </>
  );
};
