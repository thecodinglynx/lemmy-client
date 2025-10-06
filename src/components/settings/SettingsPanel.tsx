import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '@stores/app-store';
import { createLemmyApiClient } from '@services/lemmy-api-client';
import { useCheckCommunityMedia } from '@hooks/useContent';
import { MediaCache } from '@utils/media-cache';
import { cacheUtils } from '@services/query-client';
import { STORAGE_KEYS } from '@constants';
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
  // Handle Escape key to close settings
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'Escape') navigate('/');
    };
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [navigate]);
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '@stores/app-store';
import { createLemmyApiClient } from '@services/lemmy-api-client';
import { useCheckCommunityMedia } from '@hooks/useContent';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  ClockIcon,
  ShieldCheckIcon,
  ArrowLeftIcon,
  UserGroupIcon,
  GlobeAltIcon,
  PlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface SettingsPanelProps { className?: string; }
interface SettingsSectionProps { title: string; description?: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean; }

const SettingsSection: React.FC<SettingsSectionProps> = ({ title, description, icon, children, defaultOpen=false }) => {
  const [open,setOpen]=useState(defaultOpen);
  return <div className='border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 mb-4'>
    <button onClick={()=>setOpen(!open)} className='w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700'>
      <div className='flex items-center space-x-3'>
        <div className='p-2 bg-blue-100 dark:bg-blue-900 rounded-lg'>{icon}</div>
        <div>
          <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>{title}</h3>
          {description && <p className='text-sm text-gray-600 dark:text-gray-400'>{description}</p>}
        </div>
      </div>
      {open ? <ChevronDownIcon className='h-5 w-5 text-gray-500'/> : <ChevronRightIcon className='h-5 w-5 text-gray-500'/>}
    </button>
    {open && <div className='px-4 pb-4 border-t border-gray-200 dark:border-gray-700'><div className='pt-4'>{children}</div></div>}
  </div>;
};

const SettingsPanel: React.FC<SettingsPanelProps> = ({ className='' }) => {
  const { settings, updateSettings, content, addCommunity, removeCommunity, addUser, removeUser, setFilters, setTiming, toggleAutoAdvance, slideshow, reset } = useAppStore();
  const navigate = useNavigate();
  const checkCommunityMedia = useCheckCommunityMedia();
  const [newCommunityName,setNewCommunityName]=useState('');
  const [newUsername,setNewUsername]=useState('');
  const [isAddingCommunity,setIsAddingCommunity]=useState(false);
  const [communitySearchError,setCommunitySearchError]=useState('');
  const [isTestingConnection,setIsTestingConnection]=useState(false);
  const [connectionTestResult,setConnectionTestResult]=useState<string|null>(null);

  useEffect(()=>{ const onKey=(e:KeyboardEvent)=>{ if(e.key==='Escape') navigate('/'); }; document.addEventListener('keydown',onKey); return()=>document.removeEventListener('keydown',onKey);},[navigate]);

  const handleAddCommunity= async()=>{
    if(!newCommunityName.trim()||isAddingCommunity) return; setIsAddingCommunity(true); setCommunitySearchError('');
    try {
      const api = createLemmyApiClient(settings.server.instanceUrl, settings.server.customProxy);
      const results = await api.searchCommunities(newCommunityName.trim(),10);
      const exact = results.find(c=>c.name.toLowerCase()===newCommunityName.trim().toLowerCase());
      if(!exact){ setCommunitySearchError(`No exact match for "${newCommunityName.trim()}"`); return; }
      try { const media = await checkCommunityMedia.mutateAsync(exact.id); if(!media.hasMedia){ setCommunitySearchError('Community has no media'); return; } } catch {}
      addCommunity(exact); setNewCommunityName('');
    } catch { setCommunitySearchError('Search failed'); } finally { setIsAddingCommunity(false);} };

  const handleResetToDefaults = ()=>{ if(confirm('Reset settings and selections?')) reset(); };
    } catch (err) {
      console.warn('[Settings] Failed clearing React Query cache', err);
    }

    // 3) Clear media cache (memory + IndexedDB)
    try {
      await MediaCache.getInstance().clear();
      console.log('[Settings] Media cache cleared');
    } catch (err) {
      console.warn('[Settings] Failed clearing media cache', err);
    }

    // 4) Remove app-specific localStorage keys
    try {
      Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
      console.log('[Settings] Local storage keys removed');
    } catch (err) {
      console.warn('[Settings] Failed clearing localStorage', err);
    }

    // 5) Clear sessionStorage
    try {
      if (typeof sessionStorage !== 'undefined') sessionStorage.clear();
      console.log('[Settings] sessionStorage cleared');
    } catch (err) {
      console.warn('[Settings] Failed clearing sessionStorage', err);
    }

    // Optional: full reload to ensure clean state
    // window.location.reload();
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

              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                  Content Source
                </label>
                <div className='flex flex-wrap gap-4 items-center'>
                  {[
                    { key: 'feed', label: 'Communities Feed' },
                    { key: 'liked', label: 'Liked Media' },
                  ].map((opt) => (
                    <label
                      key={opt.key}
                      className='inline-flex items-center space-x-2 cursor-pointer'
                    >
                      <input
                        type='radio'
                        name='contentSource'
                        value={opt.key}
                        checked={(settings.contentSource || 'feed') === opt.key}
                        onChange={(e) =>
                          updateSettings({
                            contentSource: e.target.value as any,
                          })
                        }
                        className='text-blue-600 focus:ring-blue-500 h-4 w-4 border-gray-300'
                      />
                      <span className='text-sm text-gray-700 dark:text-gray-300'>
                        {opt.label}
                      </span>
                    </label>
                  ))}
                </div>
                <p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
                  Switch to "Liked Media" to browse only items you've liked.
                  Feed mode enables infinite loading; liked mode is a static
                  curated list.
                </p>
                {settings.contentSource === 'feed' && (
                  <div className='mt-4'>
                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                      Feed Mode
                    </label>
                    <div className='flex flex-col gap-2'>
                      {[
                        {
                          key: 'random-communities',
                          label: 'Random communities (global sample)',
                        },
                        {
                          key: 'communities',
                          label: 'My selected communities only',
                        },
                        {
                          key: 'communities-images',
                          label: 'My selected communities (images only)',
                        },
                        { key: 'users', label: 'My selected users only' },
                      ].map((opt) => (
                        <label
                          key={opt.key}
                          className='inline-flex items-start gap-2 cursor-pointer'
                        >
                          <input
                            type='radio'
                            name='feedMode'
                            value={opt.key}
                            checked={
                              (settings.feedMode || 'random-communities') ===
                              opt.key
                            }
                            onChange={(e) =>
                              updateSettings({
                                feedMode: e.target.value as any,
                              })
                            }
                            className='text-blue-600 focus:ring-blue-500 h-4 w-4 border-gray-300 mt-0.5'
                          />
                          <span className='text-sm text-gray-700 dark:text-gray-300'>
                            {opt.label}
                          </span>
                        </label>
                      ))}
                    </div>
                    <p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
                      Selecting communities or users doesn't switch modes
                      automatically—choose explicitly here.
                    </p>
                  </div>
                )}
              </div>

              {settings.contentSource !== 'liked' && (
                <div>
                  <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                    Feed Ordering
                  </label>
                  <div className='grid grid-cols-2 md:grid-cols-3 gap-2'>
                    {[
                      { key: 'hot', label: 'Hot' },
                      { key: 'new', label: 'New' },
                      { key: 'active', label: 'Active' },
                      { key: 'most-comments', label: 'Most Comments' },
                      { key: 'top-day', label: 'Top Day' },
                      { key: 'top-week', label: 'Top Week' },
                      { key: 'top-month', label: 'Top Month' },
                      { key: 'top-year', label: 'Top Year' },
                      { key: 'top-all', label: 'Top All' },
                      { key: 'random', label: 'Random' },
                    ].map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() =>
                          updateSettings({ orderingMode: opt.key as any })
                        }
                        className={`px-3 py-1.5 text-xs rounded-md border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40 whitespace-nowrap overflow-hidden text-ellipsis ${
                          (settings.orderingMode || 'hot') === opt.key
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                        aria-pressed={
                          (settings.orderingMode || 'hot') === opt.key
                        }
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
                    Choose how feed posts are ordered. "Random" shuffles the
                    fetched batch; others request a specific sort from the
                    server. Changing this refetches the feed.
                  </p>
                </div>
              )}

              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                  Keep Screen Awake
                </label>
                <div className='flex items-center'>
                  <input
                    type='checkbox'
                    checked={!!settings.display.keepScreenAwake}
                    onChange={(e) =>
                      updateSettings({
                        display: {
                          ...settings.display,
                          keepScreenAwake: e.target.checked,
                        },
                      })
                    }
                    className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                  />
                  <span className='ml-2 text-sm text-gray-700 dark:text-gray-300'>
                    Prevent device from sleeping while playing (may use Wake
                    Lock API)
                  </span>
                </div>
                <p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
                  Some browsers require interaction and may still dim the
                  screen. If unsupported, a passive fallback attempts to keep
                  the session active.
                </p>
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
                    content.selectedCommunities.map((community) => {
                      const activeIds = settings.activeCommunityIds || [];
                      const isActive =
                        activeIds.length === 0 ||
                        activeIds.includes(community.id);
                      return (
                        <div
                          key={community.id}
                          className='flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg'
                        >
                          <div className='flex items-center space-x-3'>
                            <input
                              type='checkbox'
                              checked={isActive}
                              onChange={() => {
                                const current = settings.activeCommunityIds || [];
                                let next: number[];
                                // If currently all active (empty array), initialize full list first
                                const base = current.length === 0 ? content.selectedCommunities.map(c=>c.id) : current;
                                if (isActive) {
                                  next = base.filter((id) => id !== community.id);
                                } else {
                                  next = [...base, community.id];
                                }
                                // If all selected, store empty to mean 'all'
                                const allIds = content.selectedCommunities.map(c=>c.id).sort();
                                const normalized = next.sort();
                                const isAll =
                                  allIds.length === normalized.length &&
                                  allIds.every((v,i)=>v===normalized[i]);
                                updateSettings({
                                  activeCommunityIds: isAll ? [] : normalized,
                                } as any);
                              }}
                              className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                            />
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
                          <div className='flex items-center gap-2'>
                            <button
                              onClick={() => removeCommunity(community.id)}
                              className='p-1 text-gray-400 hover:text-red-500 transition-colors'
                              aria-label={`Remove ${community.name}`}
                            >
                              <XMarkIcon className='h-5 w-5' />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                {content.selectedCommunities.length > 1 && (
                  <div className='flex gap-2 mt-2'>
                    <button
                      onClick={() =>
                        updateSettings({ activeCommunityIds: [] } as any)
                      }
                      className='px-3 py-1 text-xs rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600'
                    >
                      Select All
                    </button>
                    <button
                      onClick={() =>
                        updateSettings({ activeCommunityIds: [] as any })
                      }
                      className='hidden'
                    >
                      (all sentinel)
                    </button>
                    <button
                      onClick={() =>
                        updateSettings({ activeCommunityIds: [] as any })
                      }
                      className='hidden'
                    >
                      (noop)
                    </button>
                    <button
                      onClick={() =>
                        updateSettings({ activeCommunityIds: [] as any })
                      }
                      className='hidden'
                    >
                      (noop2)
                    </button>
                    <button
                      onClick={() =>
                        updateSettings({ activeCommunityIds: [] as any })
                      }
                      className='hidden'
                    >
                      (noop3)
                    </button>
                    <button
                      onClick={() => {
                        updateSettings({ activeCommunityIds: [] as any });
                      }}
                      className='hidden'
                    >
                      (noop4)
                    </button>
                    <button
                      onClick={() =>
                        updateSettings({ activeCommunityIds: [] as any })
                      }
                      className='hidden'
                    >
                      (noop5)
                    </button>
                    <button
                      onClick={() =>
                        updateSettings({ activeCommunityIds: [] as any })
                      }
                      className='hidden'
                    >
                      (noop6)
                    </button>
                    <button
                      onClick={() =>
                        updateSettings({ activeCommunityIds: [] as any })
                      }
                      className='hidden'
                    >
                      (noop7)
                    </button>
                    <button
                      onClick={() =>
                        updateSettings({ activeCommunityIds: [] as any })
                      }
                      className='hidden'
                    >
                      (noop8)
                    </button>
                    <button
                      onClick={() =>
                        updateSettings({ activeCommunityIds: [] as any })
                      }
                      className='hidden'
                    >
                      (noop9)
                    </button>
                    <button
                      onClick={() =>
                        updateSettings({ activeCommunityIds: [] as any })
                      }
                      className='hidden'
                    >
                      (noop10)
                    </button>
                    <button
                      onClick={() =>
                        updateSettings({ activeCommunityIds: [] as any })
                      }
                      className='hidden'
                    >
                      (noop11)
                    </button>
                    <button
                      onClick={() =>
                        updateSettings({ activeCommunityIds: [] as any })
                      }
                      className='hidden'
                    >
                      (noop12)
                    </button>
                    <button
                      onClick={() =>
                        updateSettings({ activeCommunityIds: [] as any })
                      }
                      className='hidden'
                    >
                      (noop13)
                    </button>
                    <button
                      onClick={() =>
                        updateSettings({ activeCommunityIds: [] as any })
                      }
                      className='hidden'
                    >
                      (noop14)
                    </button>
                    <button
                      onClick={() =>
                        updateSettings({ activeCommunityIds: [] as any })
                      }
                      className='hidden'
                    >
                      (noop15)
                    </button>
                    <button
                      onClick={() => {
                        updateSettings({ activeCommunityIds: [] as any });
                      }}
                      className='px-3 py-1 text-xs rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600'
                    >
                      Clear Subset (All Active)
                    </button>
                  </div>
                )}

                {/* Blocked Communities */}
                <div className='mt-6'>
                  <h5 className='text-md font-medium text-gray-900 dark:text-white mb-2 flex items-center'>
                    <ShieldCheckIcon className='h-5 w-5 mr-2 text-red-500 dark:text-red-400' />
                    Blocked Communities
                  </h5>
                  {content.blockedCommunities?.length === 0 ? (
                    <p className='text-sm text-gray-500 dark:text-gray-400 italic'>
                      You haven't blocked any communities. Blocked communities
                      are permanently excluded from the feed.
                    </p>
                  ) : (
                    <div className='space-y-2'>
                      {(content.blockedCommunities || []).map((community) => (
                        <div
                          key={community.id}
                          className='flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg'
                        >
                          <div className='flex items-center space-x-3'>
                            <div className='w-8 h-8 bg-red-100 dark:bg-red-800 rounded-full flex items-center justify-center'>
                              <UserGroupIcon className='h-4 w-4 text-red-600 dark:text-red-300' />
                            </div>
                            <div>
                              <p className='font-medium text-red-700 dark:text-red-300'>
                                {community.name}
                              </p>
                              {community.title &&
                                community.title !== community.name && (
                                  <p className='text-xs text-red-600 dark:text-red-400'>
                                    {community.title}
                                  </p>
                                )}
                            </div>
                          </div>
                          <button
                            onClick={() =>
                              useAppStore
                                .getState()
                                .unblockCommunity(community.id)
                            }
                            className='px-2 py-1 text-xs font-medium rounded-md bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500'
                          >
                            Unblock
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {content.blockedCommunities &&
                    content.blockedCommunities.length > 0 && (
                      <p className='mt-2 text-xs text-gray-500 dark:text-gray-400'>
                        Blocking a community permanently filters out its
                        content. You can unblock it anytime.
                      </p>
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
                {content.selectedCommunities.length > 1 && (
                  <div className='flex gap-2 mt-2'>
                    <button
                      onClick={() => updateSettings({ activeCommunityIds: [] } as any)}
                      className='px-3 py-1 text-xs rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600'
                    >
                      All Active
                    </button>
                    <button
                      onClick={() => updateSettings({ activeCommunityIds: [] as any })}
                      className='hidden'
                    />
                    <button
                      onClick={() => updateSettings({ activeCommunityIds: [] as any })}
                      className='hidden'
                    />
                    <button
                      onClick={() => updateSettings({ activeCommunityIds: [] as any })}
                      className='hidden'
                    />
                  </div>
                )}
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
