import React from 'react';
import HomeHeader from './HomeHeader';
import HomeMain from './HomeMain';

export const HomePage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <HomeHeader />
      <HomeMain />
    </div>
  );
};
