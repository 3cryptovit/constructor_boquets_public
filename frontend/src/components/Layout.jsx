import React from 'react';
import Header from './Header';
import '../styles/Layout.css';

const Layout = ({ children }) => {
  return (
    <div className="layout-container">
      <div className="background-blur" />
      <Header />
      <div className="content">
        {children}
      </div>
    </div>
  );
};

export default Layout; 