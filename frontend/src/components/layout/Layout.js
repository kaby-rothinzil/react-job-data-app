import React from 'react';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 p-10 overflow-auto">
        {children}
      </div>
    </div>
  );
};

export default Layout;