import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '@stores/app-store';
import { createLemmyApiClient } from '@services/lemmy-api-client';
import { useCheckCommunityMedia } from '@hooks/useContent';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  ClockIcon,
  PaintBrushIcon,
  ShieldCheckIcon,
  KeyIcon,
  ArrowLeftIcon,
  UserGroupIcon,
  GlobeAltIcon,
  PlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface SettingsPanelProps {
  className?: string;
}

interface SettingsSectionProps {
  title: string;
  description?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({
  title,
  description,
  icon,
  children,
  defaultOpen = false,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className='border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 mb-4'>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className='w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors'
        aria-expanded={isOpen}
      >
        <div className='flex items-center space-x-3'>
          <div className='p-2 bg-blue-100 dark:bg-blue-900 rounded-lg'>
            {icon}
          </div>
          <div>
            <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
              {title}
            </h3>
            {description && (
              <p className='text-sm text-gray-600 dark:text-gray-400'>
                {description}
              </p>
            )}
          </div>
        </div>
        {isOpen ? (
          <ChevronDownIcon className='h-5 w-5 text-gray-500' />
        ) : (
          <ChevronRightIcon className='h-5 w-5 text-gray-500' />
        )}
      </button>
      {isOpen && (
        <div className='px-4 pb-4 border-t border-gray-200 dark:border-gray-700'>
          <div className='pt-4'>{children}</div>
        </div>
      )}
    </div>
  );
};

const SettingsPanel: React.FC<SettingsPanelProps> = ({ className = '' }) => {
  const {
    settings,
    updateSettings,
    resetSettings,
    content,
    addCommunity,
    removeCommunity,
    addUser,
    removeUser,
    setFilters,
    setTiming,
    toggleAutoAdvance,
    slideshow,
  } = useAppStore();
  const navigate = useNavigate();
  const checkCommunityMedia = useCheckCommunityMedia();

  // Local state for adding new communities/users
  const [newCommunityName, setNewCommunityName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [isAddingCommunity, setIsAddingCommunity] = useState(false);
  const [communitySearchError, setCommunitySearchError] = useState('');
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<
    string | null
  >(null);

  // Handle Escape key to close settings
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        navigate('/');
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [navigate]);

  // Handle adding a community by searching for it first
  const handleAddCommunity = async () => {
    if (!newCommunityName.trim() || isAddingCommunity) {
      return;
    }

    setIsAddingCommunity(true);
    setCommunitySearchError('');

    try {
      console.log(
        `Searching for communities with query: "${newCommunityName.trim()}"`
      );
      const lemmyApi = createLemmyApiClient(
        settings.server.instanceUrl,
        settings.server.customProxy
      );
      const communities = await lemmyApi.searchCommunities(
        newCommunityName.trim(),
        10
      );
      console.log(
        `Search returned ${communities.length} communities:`,
        communities
      );

      if (communities.length > 0) {
        // Find exact match only - don't fall back to partial matches
        const exactMatch = communities.find(
          (c) => c.name.toLowerCase() === newCommunityName.trim().toLowerCase()
        );

        if (!exactMatch) {
          setCommunitySearchError(
            `No exact match found for "${newCommunityName.trim()}". Found similar communities: ${communities.map((c) => c.name).join(', ')}`
          );
          return;
        }

        const communityToAdd = exactMatch;

        console.log(
          `Checking media availability for community: ${communityToAdd.name} (ID: ${communityToAdd.id})`
        );

        // Check if the community has media content
        try {
          const mediaCheck = await checkCommunityMedia.mutateAsync(
            communityToAdd.id
          );

          if (!mediaCheck.hasMedia) {
            setCommunitySearchError(
              `Community "${communityToAdd.name}" has no media content available. Found ${mediaCheck.totalPosts} posts but none contain images, videos, or GIFs.`
            );
            return;
          }

          console.log(
            `Community "${communityToAdd.name}" has ${mediaCheck.mediaCount} media posts out of ${mediaCheck.totalPosts} total posts`
          );
        } catch (mediaError) {
          console.error('Error checking community media:', mediaError);
          setCommunitySearchError(
            `Failed to check media availability for "${communityToAdd.name}". Please try again.`
          );
          return;
        }

        console.log(
          `Adding community: ${communityToAdd.name} (ID: ${communityToAdd.id})`
        );
        addCommunity(communityToAdd);
        setNewCommunityName('');
        console.log(
          `Successfully added community: ${communityToAdd.name} (ID: ${communityToAdd.id})`
        );
      } else {
        setCommunitySearchError(
          `No communities found for "${newCommunityName.trim()}"`
        );
      }
    } catch (error) {
      console.error('Error searching for community:', error);
      setCommunitySearchError(
        'Failed to search for community. Please try again.'
      );
    } finally {
      setIsAddingCommunity(false);
    }
  };

  // Test connection to the server
  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setConnectionTestResult(null);

    try {
      const testApi = createLemmyApiClient(
        settings.server.instanceUrl,
        settings.server.customProxy
      );
      await testApi.getSite();
      setConnectionTestResult('Connection successful! ✅');
    } catch (error) {
      console.error('Connection test failed:', error);
      setConnectionTestResult(
        'Connection failed! ❌ Please check the instance URL and try again.'
      );
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleResetToDefaults = () => {
    if (
      confirm(
        'Are you sure you want to reset all settings to their default values?'
      )
    ) {
      resetSettings();
    }
  };

  return (
    <div
      className={`fixed inset-0 bg-gray-50 dark:bg-gray-900 overflow-y-auto z-50 ${className}`}
    >
      <div className='max-w-4xl mx-auto p-6 min-h-full'>
        {/* Header */}
        <div className='mb-8'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-4'>
              <Link
                to='/'
                className='inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors'
                aria-label='Back to slideshow'
              >
                <ArrowLeftIcon className='h-4 w-4 mr-2' />
                Back to Slideshow
              </Link>
              <div>
                <h1 className='text-3xl font-bold text-gray-900 dark:text-white mb-2'>
                  Settings
                </h1>
                <p className='text-gray-600 dark:text-gray-400'>
                  Customize your slideshow experience, controls, and
                  accessibility options. Press{' '}
                  <kbd className='px-1 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 rounded'>
                    Esc
                  </kbd>{' '}
                  to return.
                </p>
              </div>
            </div>
            <button
              onClick={handleResetToDefaults}
              className='px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 border border-red-300 dark:border-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors'
            >
              Reset to Defaults
            </button>
          </div>
        </div>

        {/* Settings Sections */}
        <div className='space-y-4'>
          {/* Timing Settings */}
          <SettingsSection
            title='Timing & Playback'
            description='Control slideshow timing and auto-advance behavior'
            icon={
              <ClockIcon className='h-6 w-6 text-blue-600 dark:text-blue-400' />
            }
            defaultOpen={true}
          >
            <div className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                  Auto-advance
                </label>
                <div className='flex items-center'>
                  <input
                    type='checkbox'
                    checked={slideshow.autoAdvance}
                    onChange={toggleAutoAdvance}
                    className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                  />
                  <span className='ml-2 text-sm text-gray-700 dark:text-gray-300'>
                    Automatically advance to next slide
                  </span>
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                    Images (seconds)
                  </label>
                  <input
                    type='range'
                    min='5'
                    max='60'
                    value={settings.intervals.images}
                    onChange={(e) =>
                      setTiming('images', parseInt(e.target.value))
                    }
                    className='w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700'
                  />
                  <div className='flex justify-between text-xs text-gray-500 mt-1'>
                    <span>5s</span>
                    <span className='font-medium'>
                      {settings.intervals.images}s
                    </span>
                    <span>60s</span>
                  </div>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                    Videos (0 = until end)
                  </label>
                  <input
                    type='range'
                    min='0'
                    max='60'
                    value={settings.intervals.videos}
                    onChange={(e) =>
                      setTiming('videos', parseInt(e.target.value))
                    }
                    className='w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700'
                  />
                  <div className='flex justify-between text-xs text-gray-500 mt-1'>
                    <span>0s</span>
                    <span className='font-medium'>
                      {settings.intervals.videos === 0
                        ? 'Until end'
                        : `${settings.intervals.videos}s`}
                    </span>
                    <span>60s</span>
                  </div>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                    GIFs (seconds)
                  </label>
                  <input
                    type='range'
                    min='5'
                    max='60'
                    value={settings.intervals.gifs}
                    onChange={(e) =>
                      setTiming('gifs', parseInt(e.target.value))
                    }
                    className='w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700'
                  />
                  <div className='flex justify-between text-xs text-gray-500 mt-1'>
                    <span>5s</span>
                    <span className='font-medium'>
                      {settings.intervals.gifs}s
                    </span>
                    <span>60s</span>
                  </div>
                </div>
              </div>

              {/* Quick Presets */}
              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                  Quick Presets
                </label>
                <div className='flex flex-wrap gap-2'>
                  {[5, 10, 15, 30, 60].map((seconds) => (
                    <button
                      key={seconds}
                      onClick={() => {
                        setTiming('images', seconds);
                        setTiming(
                          'videos',
                          seconds === 60 ? 0 : Math.min(seconds, 30)
                        );
                        setTiming('gifs', seconds);
                      }}
                      className='px-3 py-1 text-sm font-medium text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-600 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors'
                    >
                      {seconds}s
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </SettingsSection>

          {/* Server Settings */}
          <SettingsSection
            title='Server Settings'
            description='Configure the Lemmy instance to connect to'
            icon={
              <GlobeAltIcon className='h-6 w-6 text-purple-600 dark:text-purple-400' />
            }
            defaultOpen={false}
          >
            <div className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                  Lemmy Instance URL
                </label>
                <div className='space-y-2'>
                  <input
                    type='text'
                    value={settings.server.instanceUrl}
                    onChange={(e) =>
                      updateSettings({
                        server: {
                          ...settings.server,
                          instanceUrl: e.target.value,
                        },
                      })
                    }
                    placeholder='lemmy.ml'
                    className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  />
                  <div className='flex flex-wrap gap-2'>
                    {[
                      'lemmy.ml',
                      'lemmy.world',
                      'beehaw.org',
                      'lemm.ee',
                      'sh.itjust.works',
                    ].map((instance) => (
                      <button
                        key={instance}
                        onClick={() =>
                          updateSettings({
                            server: {
                              ...settings.server,
                              instanceUrl: instance,
                            },
                          })
                        }
                        className={`px-2 py-1 text-xs rounded-md border transition-colors ${
                          settings.server.instanceUrl === instance
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {instance}
                      </button>
                    ))}
                  </div>
                </div>
                <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
                  Enter a Lemmy instance URL or click on one of the popular
                  instances above
                </p>

                {/* Test Connection Button */}
                <div className='flex items-center space-x-3 mt-3'>
                  <button
                    onClick={handleTestConnection}
                    disabled={
                      isTestingConnection || !settings.server.instanceUrl.trim()
                    }
                    className='px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 
                             text-white rounded-md transition-colors flex items-center space-x-2'
                  >
                    {isTestingConnection ? (
                      <>
                        <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                        <span>Testing...</span>
                      </>
                    ) : (
                      <span>Test Connection</span>
                    )}
                  </button>

                  {connectionTestResult && (
                    <span
                      className={`text-sm ${
                        connectionTestResult.includes('successful')
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {connectionTestResult}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className='flex items-center space-x-2'>
                  <input
                    type='checkbox'
                    checked={settings.server.customProxy}
                    onChange={(e) =>
                      updateSettings({
                        server: {
                          ...settings.server,
                          customProxy: e.target.checked,
                        },
                      })
                    }
                    className='rounded border-gray-300 dark:border-gray-600 
                             text-blue-600 focus:ring-2 focus:ring-blue-500'
                  />
                  <span className='text-sm text-gray-700 dark:text-gray-300'>
                    Use proxy (recommended for CORS issues)
                  </span>
                </label>
                <p className='text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6'>
                  Routes requests through a local proxy to avoid CORS
                  restrictions
                </p>
              </div>
            </div>
          </SettingsSection>

          {/* Content Sources */}
          <SettingsSection
            title='Content Sources'
            description='Choose communities and users to show content from'
            icon={
              <UserGroupIcon className='h-6 w-6 text-green-600 dark:text-green-400' />
            }
            defaultOpen={false}
          >
            <div className='space-y-6'>
              {/* Communities Section */}
              <div>
                <h4 className='text-lg font-medium text-gray-900 dark:text-white mb-3 flex items-center'>
                  <UserGroupIcon className='h-5 w-5 mr-2' />
                  Communities
                </h4>

                {/* Add Community */}
                <div className='mb-4'>
                  <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                    Add Community
                  </label>
                  <div className='flex gap-2'>
                    <input
                      type='text'
                      value={newCommunityName}
                      onChange={(e) => setNewCommunityName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCommunity();
                        }
                      }}
                      placeholder='e.g., pics, earthporn, aww'
                      className='flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400'
                    />
                    <button
                      onClick={handleAddCommunity}
                      disabled={isAddingCommunity || !newCommunityName.trim()}
                      className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                      {isAddingCommunity ? (
                        <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-white'></div>
                      ) : (
                        <PlusIcon className='h-5 w-5' />
                      )}
                    </button>
                  </div>
                  {communitySearchError && (
                    <p className='text-sm text-red-600 dark:text-red-400 mt-1'>
                      {communitySearchError}
                    </p>
                  )}
                </div>

                {/* Selected Communities List */}
                <div className='space-y-2'>
                  {content.selectedCommunities.length === 0 ? (
                    <p className='text-sm text-gray-500 dark:text-gray-400 italic'>
                      No communities selected. Add communities to filter content
                      from specific sources.
                    </p>
                  ) : (
                    content.selectedCommunities.map((community) => (
                      <div
                        key={community.id}
                        className='flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg'
                      >
                        <div className='flex items-center space-x-3'>
                          <div className='w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center'>
                            <UserGroupIcon className='h-4 w-4 text-blue-600 dark:text-blue-400' />
                          </div>
                          <div>
                            <p className='font-medium text-gray-900 dark:text-white'>
                              {community.name}
                            </p>
                            {community.title &&
                              community.title !== community.name && (
                                <p className='text-sm text-gray-500 dark:text-gray-400'>
                                  {community.title}
                                </p>
                              )}
                          </div>
                        </div>
                        <button
                          onClick={() => removeCommunity(community.id)}
                          className='p-1 text-gray-400 hover:text-red-500 transition-colors'
                          aria-label={`Remove ${community.name}`}
                        >
                          <XMarkIcon className='h-5 w-5' />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Users Section */}
              <div>
                <h4 className='text-lg font-medium text-gray-900 dark:text-white mb-3 flex items-center'>
                  <UserGroupIcon className='h-5 w-5 mr-2' />
                  Users
                </h4>

                {/* Add User */}
                <div className='mb-4'>
                  <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                    Add User
                  </label>
                  <div className='flex gap-2'>
                    <input
                      type='text'
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      placeholder='e.g., username@instance.com'
                      className='flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400'
                    />
                    <button
                      onClick={() => {
                        if (newUsername.trim()) {
                          addUser({
                            id: Date.now(), // Temporary ID
                            name: newUsername.trim(),
                            display_name: newUsername.trim(),
                            avatar: '',
                            banned: false,
                            published: new Date().toISOString(),
                            updated: new Date().toISOString(),
                            actor_id: '',
                            bio: '',
                            local: false,
                            banner: '',
                            deleted: false,
                            inbox_url: '',
                            shared_inbox_url: '',
                            matrix_user_id: '',
                            admin: false,
                            bot_account: false,
                            ban_expires: '',
                          });
                          setNewUsername('');
                        }
                      }}
                      className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors'
                    >
                      <PlusIcon className='h-5 w-5' />
                    </button>
                  </div>
                </div>

                {/* Selected Users List */}
                <div className='space-y-2'>
                  {content.selectedUsers.length === 0 ? (
                    <p className='text-sm text-gray-500 dark:text-gray-400 italic'>
                      No users selected. Add users to filter content from
                      specific creators.
                    </p>
                  ) : (
                    content.selectedUsers.map((user) => (
                      <div
                        key={user.id}
                        className='flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg'
                      >
                        <div className='flex items-center space-x-3'>
                          <div className='w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center'>
                            <UserGroupIcon className='h-4 w-4 text-green-600 dark:text-green-400' />
                          </div>
                          <div>
                            <p className='font-medium text-gray-900 dark:text-white'>
                              {user.display_name || user.name}
                            </p>
                            {user.display_name &&
                              user.display_name !== user.name && (
                                <p className='text-sm text-gray-500 dark:text-gray-400'>
                                  @{user.name}
                                </p>
                              )}
                          </div>
                        </div>
                        <button
                          onClick={() => removeUser(user.id)}
                          className='p-1 text-gray-400 hover:text-red-500 transition-colors'
                          aria-label={`Remove ${user.display_name || user.name}`}
                        >
                          <XMarkIcon className='h-5 w-5' />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Content Filters */}
              <div>
                <h4 className='text-lg font-medium text-gray-900 dark:text-white mb-3 flex items-center'>
                  <ShieldCheckIcon className='h-5 w-5 mr-2' />
                  Content Filters
                </h4>

                <div className='space-y-4'>
                  {/* NSFW Toggle */}
                  <div className='flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg'>
                    <div className='flex items-center space-x-3'>
                      <div className='w-8 h-8 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center'>
                        <ShieldCheckIcon className='h-4 w-4 text-red-600 dark:text-red-400' />
                      </div>
                      <div>
                        <p className='font-medium text-gray-900 dark:text-white'>
                          Show NSFW Content
                        </p>
                        <p className='text-sm text-gray-500 dark:text-gray-400'>
                          Allow Not Safe For Work content in the slideshow
                        </p>
                      </div>
                    </div>
                    <label className='relative inline-flex items-center cursor-pointer'>
                      <input
                        type='checkbox'
                        checked={content.filters.showNSFW}
                        onChange={(e) =>
                          setFilters({
                            showNSFW: e.target.checked,
                          })
                        }
                        className='sr-only'
                      />
                      <div
                        className={`w-11 h-6 rounded-full transition-colors ${
                          content.filters.showNSFW
                            ? 'bg-blue-600'
                            : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                            content.filters.showNSFW
                              ? 'translate-x-5'
                              : 'translate-x-0'
                          } mt-0.5 ml-0.5`}
                        ></div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Usage Info */}
              <div className='bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4'>
                <div className='flex items-start'>
                  <div className='flex-shrink-0'>
                    <GlobeAltIcon className='h-5 w-5 text-blue-600 dark:text-blue-400' />
                  </div>
                  <div className='ml-3'>
                    <h5 className='text-sm font-medium text-blue-900 dark:text-blue-100'>
                      Content Filtering
                    </h5>
                    <p className='text-sm text-blue-700 dark:text-blue-300 mt-1'>
                      When communities or users are selected, only content from
                      those sources will be shown. Leave both empty to show
                      content from all sources.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </SettingsSection>

          {/* Display Options */}
          <SettingsSection
            title='Display & Appearance'
            description='Customize visual appearance and layout'
            icon={
              <PaintBrushIcon className='h-6 w-6 text-purple-600 dark:text-purple-400' />
            }
          >
            <div className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                  Theme
                </label>
                <select
                  value={settings.theme}
                  onChange={(e) =>
                    updateSettings({
                      theme: e.target.value as 'light' | 'dark' | 'auto',
                    })
                  }
                  className='block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                >
                  <option value='light'>Light</option>
                  <option value='dark'>Dark</option>
                  <option value='auto'>Auto (System)</option>
                </select>
              </div>

              <div className='space-y-3'>
                <div className='flex items-center'>
                  <input
                    type='checkbox'
                    checked={settings.display.showAttribution}
                    onChange={(e) =>
                      updateSettings({
                        display: {
                          ...settings.display,
                          showAttribution: e.target.checked,
                        },
                      })
                    }
                    className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                  />
                  <span className='ml-2 text-sm text-gray-700 dark:text-gray-300'>
                    Show attribution overlay
                  </span>
                </div>

                <div className='flex items-center'>
                  <input
                    type='checkbox'
                    checked={settings.display.showControls}
                    onChange={(e) =>
                      updateSettings({
                        display: {
                          ...settings.display,
                          showControls: e.target.checked,
                        },
                      })
                    }
                    className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                  />
                  <span className='ml-2 text-sm text-gray-700 dark:text-gray-300'>
                    Show playback controls
                  </span>
                </div>

                <div className='flex items-center'>
                  <input
                    type='checkbox'
                    checked={settings.display.fullscreenDefault}
                    onChange={(e) =>
                      updateSettings({
                        display: {
                          ...settings.display,
                          fullscreenDefault: e.target.checked,
                        },
                      })
                    }
                    className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                  />
                  <span className='ml-2 text-sm text-gray-700 dark:text-gray-300'>
                    Start in fullscreen mode
                  </span>
                </div>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                  Attribution Position
                </label>
                <select
                  value={settings.display.attributionPosition}
                  onChange={(e) =>
                    updateSettings({
                      display: {
                        ...settings.display,
                        attributionPosition: e.target.value as 'top' | 'bottom',
                      },
                    })
                  }
                  className='block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                >
                  <option value='top'>Top</option>
                  <option value='bottom'>Bottom</option>
                </select>
              </div>
            </div>
          </SettingsSection>

          {/* Accessibility Options */}
          <SettingsSection
            title='Accessibility'
            description='Settings to improve accessibility and user experience'
            icon={
              <ShieldCheckIcon className='h-6 w-6 text-green-600 dark:text-green-400' />
            }
          >
            <div className='space-y-4'>
              <div className='space-y-3'>
                <div className='flex items-center'>
                  <input
                    type='checkbox'
                    checked={settings.accessibility.highContrast}
                    onChange={(e) =>
                      updateSettings({
                        accessibility: {
                          ...settings.accessibility,
                          highContrast: e.target.checked,
                        },
                      })
                    }
                    className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                  />
                  <span className='ml-2 text-sm text-gray-700 dark:text-gray-300'>
                    High contrast mode
                  </span>
                </div>

                <div className='flex items-center'>
                  <input
                    type='checkbox'
                    checked={settings.accessibility.reducedMotion}
                    onChange={(e) =>
                      updateSettings({
                        accessibility: {
                          ...settings.accessibility,
                          reducedMotion: e.target.checked,
                        },
                      })
                    }
                    className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                  />
                  <span className='ml-2 text-sm text-gray-700 dark:text-gray-300'>
                    Reduce motion and animations
                  </span>
                </div>

                <div className='flex items-center'>
                  <input
                    type='checkbox'
                    checked={settings.accessibility.screenReaderAnnouncements}
                    onChange={(e) =>
                      updateSettings({
                        accessibility: {
                          ...settings.accessibility,
                          screenReaderAnnouncements: e.target.checked,
                        },
                      })
                    }
                    className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                  />
                  <span className='ml-2 text-sm text-gray-700 dark:text-gray-300'>
                    Screen reader announcements
                  </span>
                </div>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                  Text Size
                </label>
                <select
                  value={settings.accessibility.textSize}
                  onChange={(e) =>
                    updateSettings({
                      accessibility: {
                        ...settings.accessibility,
                        textSize: e.target.value as
                          | 'small'
                          | 'medium'
                          | 'large',
                      },
                    })
                  }
                  className='block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                >
                  <option value='small'>Small</option>
                  <option value='medium'>Medium</option>
                  <option value='large'>Large</option>
                </select>
              </div>
            </div>
          </SettingsSection>

          {/* Control Settings */}
          <SettingsSection
            title='Controls & Input'
            description='Customize keyboard shortcuts and touch gestures'
            icon={
              <KeyIcon className='h-6 w-6 text-indigo-600 dark:text-indigo-400' />
            }
          >
            <div className='space-y-4'>
              <div className='space-y-3'>
                <div className='flex items-center'>
                  <input
                    type='checkbox'
                    checked={settings.controls.touchGestures}
                    onChange={(e) =>
                      updateSettings({
                        controls: {
                          ...settings.controls,
                          touchGestures: e.target.checked,
                        },
                      })
                    }
                    className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                  />
                  <span className='ml-2 text-sm text-gray-700 dark:text-gray-300'>
                    Enable touch gestures
                  </span>
                </div>

                <div className='flex items-center'>
                  <input
                    type='checkbox'
                    checked={settings.controls.autoHideControls}
                    onChange={(e) =>
                      updateSettings({
                        controls: {
                          ...settings.controls,
                          autoHideControls: e.target.checked,
                        },
                      })
                    }
                    className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                  />
                  <span className='ml-2 text-sm text-gray-700 dark:text-gray-300'>
                    Auto-hide controls
                  </span>
                </div>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                  Control Timeout (seconds)
                </label>
                <input
                  type='range'
                  min='1'
                  max='10'
                  value={settings.controls.controlTimeout / 1000}
                  onChange={(e) =>
                    updateSettings({
                      controls: {
                        ...settings.controls,
                        controlTimeout: parseInt(e.target.value) * 1000,
                      },
                    })
                  }
                  className='w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700'
                />
                <div className='flex justify-between text-xs text-gray-500 mt-1'>
                  <span>1s</span>
                  <span className='font-medium'>
                    {settings.controls.controlTimeout / 1000}s
                  </span>
                  <span>10s</span>
                </div>
              </div>

              {/* Keyboard Shortcuts Preview */}
              <div>
                <h4 className='text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                  Keyboard Shortcuts
                </h4>
                <div className='bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-xs'>
                  <div className='grid grid-cols-2 gap-2'>
                    <div className='flex justify-between'>
                      <span>Play/Pause:</span>
                      <kbd className='px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs'>
                        Space
                      </kbd>
                    </div>
                    <div className='flex justify-between'>
                      <span>Next:</span>
                      <kbd className='px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs'>
                        →
                      </kbd>
                    </div>
                    <div className='flex justify-between'>
                      <span>Previous:</span>
                      <kbd className='px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs'>
                        ←
                      </kbd>
                    </div>
                    <div className='flex justify-between'>
                      <span>Star:</span>
                      <kbd className='px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs'>
                        S
                      </kbd>
                    </div>
                  </div>
                  <button className='w-full mt-2 text-blue-600 dark:text-blue-400 hover:underline'>
                    View all shortcuts
                  </button>
                </div>
              </div>
            </div>
          </SettingsSection>
        </div>

        {/* Footer */}
        <div className='mt-8 pt-6 border-t border-gray-200 dark:border-gray-700'>
          <p className='text-sm text-gray-500 dark:text-gray-400 text-center'>
            Settings are automatically saved and will persist across sessions.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
