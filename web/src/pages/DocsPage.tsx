import React from 'react';
import { AppShell } from '@mantine/core';
import Header from '../components/Header';
import DocsViewer from '../components/DocsViewer';

const DocsPage: React.FC = () => {
  return (
    <AppShell 
      header={{ height: 80 }}
      styles={{
        main: {
          background: 'linear-gradient(135deg, #0F0F23 0%, #1A1A2E 50%, #16213E 100%)',
          minHeight: '100vh',
          paddingTop: '80px',
          paddingLeft: 0,
          paddingRight: 0,
          paddingBottom: 0
        }
      }}
    >
      <AppShell.Header>
        <Header />
      </AppShell.Header>
      
      <AppShell.Main style={{ padding: 0 }}>
        <DocsViewer />
      </AppShell.Main>
    </AppShell>
  );
};

export default DocsPage;
