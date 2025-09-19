import React from 'react';

interface ContentBrowserProps {
  // Props will be added during implementation
}

const ContentBrowser: React.FC<ContentBrowserProps> = () => {
  return (
    <div className='min-h-screen bg-gray-100 dark:bg-gray-900 p-8'>
      <h1 className='text-3xl font-bold mb-6'>Content Browser</h1>
      <p className='text-gray-600 dark:text-gray-400'>
        Select communities and users to include in your slideshow.
      </p>
    </div>
  );
};

export default ContentBrowser;
