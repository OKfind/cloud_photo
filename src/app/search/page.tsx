'use client';

import { useState, useCallback } from 'react';
import SearchBar from '@/components/SearchBar';
import MediaGrid from '@/components/MediaGrid';
import { MediaItem } from '@/lib/types';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery) return;

    setQuery(searchQuery);
    setLoading(true);
    setSearched(true);

    try {
      const res = await fetch(`/api/media?search=${encodeURIComponent(searchQuery)}&limit=50`);
      const data = await res.json();
      if (data.success) {
        setResults(data.data.items);
      }
    } catch (error) {
      console.error('搜索失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleTagClick = useCallback((tag: string) => {
    setQuery(tag);
    handleSearch(tag);
  }, [handleSearch]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">搜索</h1>
        <p className="text-gray-500">通过标题、描述或标签搜索你的媒体文件</p>
      </div>

      {/* 搜索栏 */}
      <div className="max-w-xl mb-8">
        <SearchBar
          onSearch={handleSearch}
          placeholder="输入标签名搜索，如：旅行、美食、风景..."
        />
      </div>

      {/* 搜索结果 */}
      {searched && (
        <div>
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            {query && <>搜索 &ldquo;{query}&rdquo; — 找到 {results.length} 个结果</>}
          </h2>
          <MediaGrid items={results} loading={loading} onTagClick={handleTagClick} />
        </div>
      )}

      {/* 空状态 */}
      {!searched && (
        <div className="text-center py-20">
          <svg className="w-20 h-20 text-gray-200 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-gray-400 text-lg">输入标签关键词开始搜索</p>
          <p className="text-gray-300 text-sm mt-1">例如搜索 &ldquo;旅行&rdquo; 或 &ldquo;美食&rdquo;</p>
        </div>
      )}
    </div>
  );
}
