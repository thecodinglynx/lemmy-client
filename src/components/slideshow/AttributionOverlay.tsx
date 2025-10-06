/**
 * AttributionOverlay - Community and user attribution display
 *
 * Features:
 * - Community and user attribution
 * - Post title and metadata
 * - Clickable links to source
 * - Subtle, non-intrusive design
 * - Mobile-optimized layout
 */

import React from 'react';
import type { SlideshowPost } from '../../types';

interface AttributionOverlayProps {
  post: SlideshowPost;
  className?: string;
  onCommunityClick?: (community: string) => void;
  onUserClick?: (user: string) => void;
  onBlockCommunity?: (communityId: number) => void;
}

export const AttributionOverlay: React.FC<AttributionOverlayProps> = ({
  post,
  className = '',
  onCommunityClick,
  onUserClick,
  onBlockCommunity,
}) => {
  const handleCommunityClick = () => {
    onCommunityClick?.(post.community.name);
  };

  const handleUserClick = () => {
    onUserClick?.(post.creator.name);
  };

  const formatScore = (score: number): string => {
    if (score >= 1000) {
      return `${(score / 1000).toFixed(1)}k`;
    }
    return score.toString();
  };

  const formatTimeAgo = (published: string): string => {
    const publishedDate = new Date(published);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - publishedDate.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) {
      return 'just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  return (
    <div className={`attribution-overlay ${className}`}>
      <div className='bg-gradient-to-t from-black via-black/80 to-transparent rounded-lg p-4 backdrop-blur-sm'>
        {/* Post title */}
        <h3 className='font-semibold text-lg mb-2 text-white leading-tight line-clamp-2'>
          {post.title}
        </h3>

        {/* Attribution and metadata */}
        <div className='flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-300'>
          {/* Community */}
          <button
            onClick={handleCommunityClick}
            className='flex items-center space-x-1 hover:text-blue-400 transition-colors cursor-pointer'
            aria-label={`View community ${post.community.name}`}
          >
            <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
              <path
                fillRule='evenodd'
                d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z'
                clipRule='evenodd'
              />
            </svg>
            <span>r/{post.community.name}</span>
          </button>
          {onBlockCommunity && (
            <button
              onClick={() => onBlockCommunity(post.community.id)}
              className='text-xs px-2 py-0.5 rounded bg-red-600/70 hover:bg-red-600 text-white transition-colors'
              aria-label={`Block community ${post.community.name}`}
            >
              Block
            </button>
          )}

          <span className='text-gray-500'>•</span>

          {/* User */}
          <button
            onClick={handleUserClick}
            className='flex items-center space-x-1 hover:text-blue-400 transition-colors cursor-pointer'
            aria-label={`View user ${post.creator.name}`}
          >
            <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
              <path
                fillRule='evenodd'
                d='M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z'
                clipRule='evenodd'
              />
            </svg>
            <span>u/{post.creator.name}</span>
          </button>

          <span className='text-gray-500'>•</span>

          {/* Score */}
          <div className='flex items-center space-x-1'>
            <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
              <path
                fillRule='evenodd'
                d='M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z'
                clipRule='evenodd'
              />
            </svg>
            <span>{formatScore(post.score)}</span>
          </div>

          <span className='text-gray-500'>•</span>

          {/* Time ago */}
          <span className='text-gray-400'>{formatTimeAgo(post.published)}</span>
        </div>

        {/* Media type indicator */}
        <div className='flex items-center mt-2'>
          <div className='flex items-center space-x-1 text-xs text-gray-400 bg-black/30 rounded px-2 py-1'>
            {post.mediaType === 'video' && (
              <>
                <svg
                  className='w-3 h-3'
                  fill='currentColor'
                  viewBox='0 0 20 20'
                >
                  <path
                    fillRule='evenodd'
                    d='M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z'
                    clipRule='evenodd'
                  />
                </svg>
                <span>Video</span>
              </>
            )}
            {post.mediaType === 'gif' && (
              <>
                <svg
                  className='w-3 h-3'
                  fill='currentColor'
                  viewBox='0 0 20 20'
                >
                  <path
                    fillRule='evenodd'
                    d='M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z'
                    clipRule='evenodd'
                  />
                </svg>
                <span>GIF</span>
              </>
            )}
            {post.mediaType === 'image' && (
              <>
                <svg
                  className='w-3 h-3'
                  fill='currentColor'
                  viewBox='0 0 20 20'
                >
                  <path
                    fillRule='evenodd'
                    d='M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z'
                    clipRule='evenodd'
                  />
                </svg>
                <span>Image</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttributionOverlay;
