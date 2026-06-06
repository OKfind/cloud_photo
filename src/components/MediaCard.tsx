'use client';

import { MediaItem } from '@/lib/types';

interface MediaCardProps {
  media: MediaItem;
  onTagClick?: (tag: string) => void;
}

export default function MediaCard({ media, onTagClick }: MediaCardProps) {
  const isVideo = media.type === 'video';

  return (
    <div className="group relative bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      {/* 媒体预览 */}
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        {isVideo ? (
          <div className="relative w-full h-full">
            {media.thumbnailUrl ? (
              <img
                src={media.thumbnailUrl}
                alt={media.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-900">
                <svg className="w-16 h-16 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            )}
            {/* 播放图标 */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-gray-800 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
            {/* 时长标签 */}
            {media.duration && media.duration > 0 && (
              <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                {formatDuration(media.duration)}
              </span>
            )}
          </div>
        ) : (
          <img
            src={media.thumbnailUrl || media.url}
            alt={media.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            loading="lazy"
          />
        )}

        {/* 类型标签 */}
        <span className={`absolute top-2 left-2 text-xs px-2 py-1 rounded-full font-medium ${
          isVideo
            ? 'bg-purple-500 text-white'
            : 'bg-blue-500 text-white'
        }`}>
          {isVideo ? '视频' : '图片'}
        </span>
      </div>

      {/* 信息区域 */}
      <div className="p-4">
        <h3 className="text-sm font-semibold text-gray-800 truncate" title={media.title}>
          {media.title}
        </h3>
        {media.description && (
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{media.description}</p>
        )}

        {/* 标签 */}
        {media.tags && media.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {media.tags.map((tag, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  onTagClick?.(tag);
                }}
                className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors cursor-pointer"
              >
                #{tag}
              </button>
            ))}
          </div>
        )}

        {/* 底部信息 */}
        <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center text-xs text-gray-400">
          <span>{formatFileSize(media.size)}</span>
          {media.width && media.height ? (
            <span>{media.width}×{media.height}</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
