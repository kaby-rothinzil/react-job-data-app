import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Map, CloudUpload, Edit, Settings, TableChart } from '@mui/icons-material';

const Sidebar = () => {
    const location = useLocation();

    const isActive = (path) => {
        return location.pathname === path ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white';
    };

    const menuItems = [
        { path: '/', name: 'DataMapper', icon: <Map /> },
        { path: '/uploader', name: 'DataUploader', icon: <CloudUpload /> },
        { path: '/writer', name: 'DataWriter', icon: <Edit /> },
        { path: '/editor', name: 'DataEditor', icon: <TableChart /> },
        { path: '/settings', name: 'Settings', icon: <Settings /> },
    ];

    return (
        <div className="bg-gray-800 text-white w-64 space-y-6 py-7 px-2 absolute inset-y-0 left-0 transform -translate-x-full md:relative md:translate-x-0 transition duration-200 ease-in-out">
            <nav>
                {menuItems.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center space-x-2 py-2.5 px-4 rounded transition duration-200 ${isActive(item.path)}`}
                    >
                        {item.icon}
                        <span>{item.name}</span>
                    </Link>
                ))}
            </nav>
        </div>
    );
};

export default Sidebar;