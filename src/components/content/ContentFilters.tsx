import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '@stores/app-store';
import {
  FunnelIcon,
  PhotoIcon,
  FilmIcon,
  GifIcon,
  EyeSlashIcon,
  TagIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  XMarkIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import type { MediaType } from '@types';

interface ContentFiltersProps {
  className?: string;
}

interface FilterPreset {
  id: string;
  name: string;
  description: string;
  filters: {
    mediaTypes: MediaType[];
    showNSFW: boolean;
    minScore: number;
    keywords?: string[];
  };
}

const defaultPresets: FilterPreset[] = [
  {
    id: 'all-content',
    name: 'All Content',
    description: 'Show all types of content',
    filters: {
      mediaTypes: ['image', 'video', 'gif'],
      showNSFW: false,
      minScore: 0,
    },
  },
  {
    id: 'images-only',
    name: 'Images Only',
    description: 'Show only static images',
    filters: {
      mediaTypes: ['image'],
      showNSFW: false,
      minScore: 0,
    },
  },
  {
    id: 'high-quality',
    name: 'High Quality',
    description: 'Show only highly-rated content',
    filters: {
      mediaTypes: ['image', 'video', 'gif'],
      showNSFW: false,
      minScore: 100,
    },
  },
  {
    id: 'safe-content',
    name: 'Safe Content',
    description: 'Family-friendly content only',
    filters: {
      mediaTypes: ['image', 'video', 'gif'],
      showNSFW: false,
      minScore: 10,
    },
  },
];

const ContentFilters: React.FC<ContentFiltersProps> = ({ className = '' }) => {
  const { content, setFilters } = useAppStore();
  const { filters } = content;

  const [searchKeywords, setSearchKeywords] = useState<string>('');
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const mediaTypeIcons: Record<MediaType, React.ComponentType<any>> = {
    image: PhotoIcon,
    video: FilmIcon,
    gif: GifIcon,
    unknown: TagIcon, // Generic icon for unknown types
  };

  const mediaTypeLabels: Record<MediaType, string> = {
    image: 'Images',
    video: 'Videos',
    gif: 'GIFs',
    unknown: 'Other',
  };

  const handleMediaTypeToggle = (mediaType: MediaType) => {
    const newTypes = filters.mediaTypes.includes(mediaType)
      ? filters.mediaTypes.filter((type) => type !== mediaType)
      : [...filters.mediaTypes, mediaType];

    setFilters({ mediaTypes: newTypes });
    setActivePreset(null);
  };

  const handleScoreChange = (minScore: number) => {
    setFilters({ minScore });
    setActivePreset(null);
  };

  const handleNSFWToggle = () => {
    setFilters({ showNSFW: !filters.showNSFW });
    setActivePreset(null);
  };

  const applyPreset = (preset: FilterPreset) => {
    setFilters(preset.filters);
    setActivePreset(preset.id);
  };

  const handleKeywordSearch = () => {
    if (searchKeywords.trim()) {
      const keywords = searchKeywords
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean);
      setFilters({ ...filters, keywords });
    }
  };

  const clearAllFilters = () => {
    setFilters({
      mediaTypes: ['image', 'video', 'gif'],
      showNSFW: false,
      minScore: 0,
    });
    setSearchKeywords('');
    setActivePreset('all-content');
  };

  return (
    <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
      {/* Navigation Header */}
      <div className='bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex items-center justify-between h-16'>
            <div className='flex items-center space-x-4'>
              <Link
                to='/'
                className='flex items-center space-x-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors'
              >
                <ArrowLeftIcon className='h-5 w-5' />
                <span>Back to Slideshow</span>
              </Link>
              <div className='h-6 border-l border-gray-300 dark:border-gray-600' />
              <h1 className='text-xl font-semibold text-gray-900 dark:text-white'>
                Content Filters
              </h1>
            </div>
            <div className='flex items-center space-x-4'>
              <Link
                to='/content'
                className='text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors'
              >
                Content Browser
              </Link>
              <Link
                to='/settings'
                className='text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors'
              >
                Settings
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className='max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8'>
        <div
          className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 ${className}`}
        >
          {/* Header */}
          <div className='p-4 border-b border-gray-200 dark:border-gray-700'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-3'>
                <div className='p-2 bg-purple-100 dark:bg-purple-900 rounded-lg'>
                  <FunnelIcon className='h-6 w-6 text-purple-600 dark:text-purple-400' />
                </div>
                <div>
                  <h2 className='text-lg font-semibold text-gray-900 dark:text-white'>
                    Content Filters
                  </h2>
                  <p className='text-sm text-gray-600 dark:text-gray-400'>
                    Customize what content appears in your slideshow
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className='p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors'
                title='Advanced Filters'
              >
                <AdjustmentsHorizontalIcon className='h-5 w-5' />
              </button>
            </div>
          </div>

          {/* Filter Presets */}
          <div className='p-4 border-b border-gray-200 dark:border-gray-700'>
            <h3 className='text-sm font-medium text-gray-700 dark:text-gray-300 mb-3'>
              Quick Presets
            </h3>
            <div className='grid grid-cols-2 gap-2'>
              {defaultPresets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => applyPreset(preset)}
                  className={`p-3 text-left rounded-lg border transition-colors ${
                    activePreset === preset.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <div className='font-medium text-sm'>{preset.name}</div>
                  <div className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
                    {preset.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Media Type Filters */}
          <div className='p-4 border-b border-gray-200 dark:border-gray-700'>
            <h3 className='text-sm font-medium text-gray-700 dark:text-gray-300 mb-3'>
              Media Types
            </h3>
            <div className='flex flex-wrap gap-2'>
              {(['image', 'video', 'gif'] as MediaType[]).map((mediaType) => {
                const Icon = mediaTypeIcons[mediaType];
                const isSelected = filters.mediaTypes.includes(mediaType);

                return (
                  <button
                    key={mediaType}
                    onClick={() => handleMediaTypeToggle(mediaType)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <Icon className='h-4 w-4' />
                    <span className='text-sm font-medium'>
                      {mediaTypeLabels[mediaType]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content Quality */}
          <div className='p-4 border-b border-gray-200 dark:border-gray-700'>
            <h3 className='text-sm font-medium text-gray-700 dark:text-gray-300 mb-3'>
              Content Quality
            </h3>
            <div className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                  Minimum Score: {filters.minScore}
                </label>
                <input
                  type='range'
                  min='0'
                  max='1000'
                  step='10'
                  value={filters.minScore}
                  onChange={(e) => handleScoreChange(parseInt(e.target.value))}
                  className='w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700'
                />
                <div className='flex justify-between text-xs text-gray-500 mt-1'>
                  <span>0</span>
                  <span>500</span>
                  <span>1000+</span>
                </div>
              </div>

              <div className='flex items-center'>
                <input
                  type='checkbox'
                  checked={filters.showNSFW}
                  onChange={handleNSFWToggle}
                  className='h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded'
                />
                <div className='ml-3 flex items-center space-x-2'>
                  <EyeSlashIcon className='h-4 w-4 text-gray-500' />
                  <span className='text-sm text-gray-700 dark:text-gray-300'>
                    Show NSFW content
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Advanced Filters */}
          {showAdvanced && (
            <div className='p-4 border-b border-gray-200 dark:border-gray-700'>
              <h3 className='text-sm font-medium text-gray-700 dark:text-gray-300 mb-3'>
                Advanced Filters
              </h3>

              {/* Keyword Search */}
              <div className='mb-4'>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                  Keywords (comma-separated)
                </label>
                <div className='flex space-x-2'>
                  <div className='flex-1 relative'>
                    <input
                      type='text'
                      value={searchKeywords}
                      onChange={(e) => setSearchKeywords(e.target.value)}
                      placeholder='e.g., nature, landscape, technology'
                      className='w-full px-3 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                    />
                    <MagnifyingGlassIcon className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                  </div>
                  <button
                    onClick={handleKeywordSearch}
                    className='px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors'
                  >
                    Apply
                  </button>
                </div>
              </div>

              {/* Current Keywords */}
              {filters.keywords && filters.keywords.length > 0 && (
                <div className='mb-4'>
                  <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                    Active Keywords
                  </label>
                  <div className='flex flex-wrap gap-2'>
                    {filters.keywords.map((keyword, index) => (
                      <span
                        key={index}
                        className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                      >
                        <TagIcon className='h-3 w-3 mr-1' />
                        {keyword}
                        <button
                          onClick={() => {
                            const newKeywords = filters.keywords?.filter(
                              (_, i) => i !== index
                            );
                            setFilters({ ...filters, keywords: newKeywords });
                          }}
                          className='ml-1 text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-200'
                        >
                          <XMarkIcon className='h-3 w-3' />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className='p-4'>
            <div className='flex justify-between items-center'>
              <button
                onClick={clearAllFilters}
                className='px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors'
              >
                Clear All Filters
              </button>

              <div className='text-sm text-gray-500 dark:text-gray-400'>
                {filters.mediaTypes.length} type
                {filters.mediaTypes.length !== 1 ? 's' : ''} • Score ≥
                {filters.minScore} •
                {filters.showNSFW ? 'NSFW allowed' : 'SFW only'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentFilters;
