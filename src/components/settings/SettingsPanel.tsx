import React from 'react';

interface SettingsPanelProps {
  // Props will be added during implementation
}

const SettingsPanel: React.FC<SettingsPanelProps> = () => {
  return (
    <div className='min-h-screen bg-gray-100 dark:bg-gray-900 p-8'>
      <h1 className='text-3xl font-bold mb-6'>Settings</h1>
      <p className='text-gray-600 dark:text-gray-400'>
        Configure your slideshow preferences and accessibility options.
      </p>
    </div>
  );
};

export default SettingsPanel;
