import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeftIcon,
  PhotoIcon,
  VideoCameraIcon,
  GifIcon,
} from '@heroicons/react/24/outline';
import { useVirtualScroll } from '../../hooks/useVirtualScroll';
import { useAppStore } from '../../stores/app-store';
import type { SlideshowPost } from '../../types';

interface VirtualizedContentBrowserProps {
  posts: SlideshowPost[];
  onPostSelect?: (post: SlideshowPost) => void;
  className?: string;
}

const PostItem: React.FC<{
  post: SlideshowPost;
  style: React.CSSProperties;
  onSelect?: (post: SlideshowPost) => void;
}> = ({ post, style, onSelect }) => {
  const getMediaIcon = () => {
    switch (post.mediaType) {
      case 'image':
        return <PhotoIcon className='w-4 h-4' />;
      case 'video':
        return <VideoCameraIcon className='w-4 h-4' />;
      case 'gif':
        return <GifIcon className='w-4 h-4' />;
      default:
        return <PhotoIcon className='w-4 h-4' />;
    }
  };

  return (
    <div style={style} className='absolute w-full px-4 py-2'>
      <div
        className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors'
        onClick={() => onSelect?.(post)}
      >
        <div className='flex items-start gap-3'>
          {/* Thumbnail */}
          <div className='flex-shrink-0 w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded-lg overflow-hidden'>
            {post.thumbnailUrl ? (
              <img
                src={post.thumbnailUrl}
                alt=''
                className='w-full h-full object-cover'
                loading='lazy'
              />
            ) : (
              <div className='w-full h-full flex items-center justify-center text-gray-400'>
                {getMediaIcon()}
              </div>
            )}
          </div>

          {/* Content */}
          <div className='flex-1 min-w-0'>
            <h3 className='text-sm font-medium text-gray-900 dark:text-white truncate'>
              {post.title}
            </h3>
            <div className='flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400'>
              <span>{post.community.name}</span>
              <span>•</span>
              <span>{post.creator.name}</span>
              <span>•</span>
              <span>{post.score} points</span>
            </div>
            <div className='flex items-center gap-2 mt-2'>
              <span className='inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full'>
                {getMediaIcon()}
                {post.mediaType}
              </span>
              {post.nsfw && (
                <span className='inline-flex items-center px-2 py-1 text-xs font-medium bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-full'>
                  NSFW
                </span>
              )}
              {post.starred && (
                <span className='inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-full'>
                  Starred
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const VirtualizedContentBrowser: React.FC<
  VirtualizedContentBrowserProps
> = ({ posts, onPostSelect, className = '' }) => {
  const {
    settings: {
      performance: { enableVirtualScrolling },
    },
  } = useAppStore();

  // Item height for virtual scrolling (estimated)
  const ITEM_HEIGHT = 120; // Height of each post item
  const CONTAINER_HEIGHT = 600; // Height of the scrollable container

  const virtualScroll = useVirtualScroll(posts, {
    itemHeight: ITEM_HEIGHT,
    containerHeight: CONTAINER_HEIGHT,
    overscan: 3,
    enabled: enableVirtualScrolling && posts.length > 20, // Only virtualize for large lists
  });

  // Render items based on virtualization
  const renderItems = useMemo(() => {
    if (!enableVirtualScrolling || posts.length <= 20) {
      // Regular rendering for small lists
      return posts.map((post) => (
        <PostItem
          key={post.id}
          post={post}
          style={{ position: 'relative' }}
          onSelect={onPostSelect}
        />
      ));
    }

    // Virtual rendering for large lists
    return virtualScroll.visibleItems.map(({ index, offsetTop }) => (
      <PostItem
        key={posts[index].id}
        post={posts[index]}
        style={{
          position: 'absolute',
          top: offsetTop,
          left: 0,
          right: 0,
          height: ITEM_HEIGHT,
        }}
        onSelect={onPostSelect}
      />
    ));
  }, [posts, virtualScroll.visibleItems, onPostSelect, enableVirtualScrolling]);

  if (!posts.length) {
    return (
      <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${className}`}>
        {/* Navigation Header */}
        <div className='bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700'>
          <div className='max-w-4xl mx-auto px-4 py-4'>
            <div className='flex items-center gap-3'>
              <Link
                to='/'
                className='p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors'
              >
                <ChevronLeftIcon className='w-5 h-5' />
              </Link>
              <h1 className='text-lg font-semibold text-gray-900 dark:text-white'>
                Content Browser
              </h1>
            </div>
          </div>
        </div>

        {/* Empty State */}
        <div className='max-w-4xl mx-auto px-4 py-12'>
          <div className='text-center'>
            <PhotoIcon className='w-12 h-12 text-gray-400 mx-auto mb-4' />
            <h3 className='text-lg font-medium text-gray-900 dark:text-white mb-2'>
              No content available
            </h3>
            <p className='text-gray-500 dark:text-gray-400'>
              No posts found matching your current filters.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${className}`}>
      {/* Navigation Header */}
      <div className='bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700'>
        <div className='max-w-4xl mx-auto px-4 py-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <Link
                to='/'
                className='p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors'
              >
                <ChevronLeftIcon className='w-5 h-5' />
              </Link>
              <h1 className='text-lg font-semibold text-gray-900 dark:text-white'>
                Content Browser
              </h1>
            </div>
            <div className='text-sm text-gray-500 dark:text-gray-400'>
              {posts.length} posts
              {enableVirtualScrolling && posts.length > 20 && (
                <span className='ml-2 text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded-full'>
                  Virtualized
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content List */}
      <div className='max-w-4xl mx-auto px-4 py-6'>
        {enableVirtualScrolling && posts.length > 20 ? (
          // Virtual scrolling container
          <div {...virtualScroll.containerProps}>
            <div {...virtualScroll.innerProps}>{renderItems}</div>
          </div>
        ) : (
          // Regular container
          <div className='space-y-4'>{renderItems}</div>
        )}
      </div>
    </div>
  );
};

export default VirtualizedContentBrowser;
