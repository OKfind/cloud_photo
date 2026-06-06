'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import TagInput from './TagInput';

type UploadStatus = 'idle' | 'uploading' | 'saving' | 'success' | 'error';

interface FileWithPreview {
  file: File;
  preview: string;
  type: 'image' | 'video';
}

export default function UploadForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [successCount, setSuccessCount] = useState(0);

  const handleFileSelect = useCallback(
    (selectedFiles: FileList | null, type: 'image' | 'video') => {
      if (!selectedFiles) return;

      const newFiles: FileWithPreview[] = [];
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        newFiles.push({
          file,
          preview: URL.createObjectURL(file),
          type,
        });
      }

      setFiles((prev) => [...prev, ...newFiles]);
      if (!title && newFiles.length > 0) {
        setTitle(newFiles[0].file.name.replace(/\.[^/.]+$/, ''));
      }
    },
    [title]
  );

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setErrorMsg('请先选择文件');
      return;
    }

    setStatus('uploading');
    setErrorMsg('');
    setSuccessCount(0);
    let uploadedCount = 0;

    for (let i = 0; i < files.length; i++) {
      const { file, type } = files[i];
      setProgress(Math.round((i / files.length) * 100));

      try {
        // 1. 获取 OSS 上传签名 URL
        const signRes = await fetch('/api/upload-sign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
          }),
        });

        const signData = await signRes.json();
        if (!signData.success) {
          throw new Error(signData.error || '获取上传签名失败');
        }

        const { signedUrl, publicUrl, ossKey } = signData.data;

        // 2. 直接上传到 OSS
        const uploadRes = await fetch(signedUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file,
        });

        if (!uploadRes.ok) {
          throw new Error(`OSS 上传失败: ${uploadRes.status}`);
        }

        // 3. 保存媒体元数据到数据库
        setStatus('saving');
        const mediaRes = await fetch('/api/media', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title || file.name.replace(/\.[^/.]+$/, ''),
            description,
            type,
            url: publicUrl,
            thumbnailUrl: type === 'video' ? publicUrl : publicUrl,
            ossKey,
            tags,
            size: file.size,
          }),
        });

        const mediaData = await mediaRes.json();
        if (!mediaData.success) {
          throw new Error(mediaData.error || '保存媒体信息失败');
        }

        uploadedCount++;
        setSuccessCount(uploadedCount);
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : '上传失败');
        setStatus('error');
        return;
      }
    }

    setProgress(100);
    setStatus('success');
    setFiles([]);
    setTags([]);
    setTitle('');
    setDescription('');

    // 延迟跳转
    setTimeout(() => {
      router.push('/gallery');
      router.refresh();
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* 文件选择区域 */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-12 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 hover:bg-blue-50/50 transition-all cursor-pointer"
          >
            <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <div className="text-center">
              <p className="text-gray-600 font-medium">上传图片</p>
              <p className="text-gray-400 text-sm mt-1">JPG, PNG, GIF, WebP</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleFileSelect(e.target.files, 'image')}
              className="hidden"
            />
          </button>

          <button
            type="button"
            onClick={() => videoInputRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-12 border-2 border-dashed border-gray-300 rounded-xl hover:border-purple-400 hover:bg-purple-50/50 transition-all cursor-pointer"
          >
            <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <div className="text-center">
              <p className="text-gray-600 font-medium">上传视频</p>
              <p className="text-gray-400 text-sm mt-1">MP4, WebM, MOV</p>
            </div>
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              multiple
              onChange={(e) => handleFileSelect(e.target.files, 'video')}
              className="hidden"
            />
          </button>
        </div>

        {/* 文件预览列表 */}
        {files.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {files.map((f, index) => (
              <div key={index} className="relative group w-24 h-24 rounded-lg overflow-hidden bg-gray-100">
                {f.type === 'image' ? (
                  <img src={f.preview} alt={f.file.name} className="w-full h-full object-cover" />
                ) : (
                  <video src={f.preview} className="w-full h-full object-cover" />
                )}
                <button
                  onClick={() => removeFile(index)}
                  className="absolute top-1 right-1 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <p className="absolute bottom-0 left-0 right-0 text-[10px] text-white bg-black/50 px-1 py-0.5 truncate">
                  {f.file.name}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 标题 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          标题 <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="给媒体取个名字..."
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
      </div>

      {/* 描述 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">描述</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="添加一些描述信息..."
          rows={3}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
        />
      </div>

      {/* 标签 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">标签</label>
        <TagInput tags={tags} onChange={setTags} placeholder="输入标签后按 Enter 添加" />
      </div>

      {/* 上传状态 */}
      {status !== 'idle' && (
        <div className="space-y-3">
          {/* 进度条 */}
          <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                status === 'success' ? 'bg-green-500' : status === 'error' ? 'bg-red-500' : 'bg-blue-500'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>

          <p className="text-center text-sm">
            {status === 'uploading' && (
              <span className="text-blue-600">正在上传到云端... {progress}%</span>
            )}
            {status === 'saving' && (
              <span className="text-blue-600">正在保存信息...</span>
            )}
            {status === 'success' && (
              <span className="text-green-600">✅ 上传成功！共 {successCount} 个文件，即将跳转...</span>
            )}
            {status === 'error' && (
              <span className="text-red-600">❌ {errorMsg}</span>
            )}
          </p>
        </div>
      )}

      {/* 提交按钮 */}
      <button
        type="button"
        onClick={handleUpload}
        disabled={status === 'uploading' || status === 'saving' || files.length === 0}
        className="w-full py-3.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-sm"
      >
        {status === 'uploading' || status === 'saving'
          ? '上传中...'
          : `上传 ${files.length > 0 ? `(${files.length} 个文件)` : ''}`}
      </button>
    </div>
  );
}
