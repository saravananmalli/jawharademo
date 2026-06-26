import { useState, useRef, useCallback } from 'react';
import { UploadCloud, X, GripVertical, AlertCircle, Loader2 } from 'lucide-react';
import axios from 'axios';
import { getImageUrl } from '../../utils/imageUrl';

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// Derive thumbnail path from a stored webp path
function toThumbUrl(webpUrl) {
  if (!webpUrl) return '';
  return webpUrl.replace('/webp/', '/thumbnails/');
}

// Normalise a saved URL string into the internal item shape
function fromUrl(url) {
  return {
    url,
    previewSrc: getImageUrl(toThumbUrl(url) || url),
    filename: url.split('/').pop()?.replace('.webp', '') || '',
    uploading: false,
    progress: 100,
    error: '',
  };
}

function validateFile(file) {
  if (!ALLOWED_TYPES.includes(file.type)) return `"${file.name}" is not supported. Upload JPEG, PNG, or WebP only.`;
  if (file.size > MAX_SIZE_BYTES) return `"${file.name}" exceeds the 10 MB size limit.`;
  return null;
}

// ── ImageUploader ──────────────────────────────────────────────────────────────
// Props:
//   images     – string[]   current image URLs (webp paths from backend)
//   onChange   – (urls: string[]) => void  called whenever the list changes
//   maxImages  – number     upper limit (default 10)
//   category   – string     upload bucket: 'products' | 'categories' | 'banners' | 'brands'
//   single     – bool       allow only one image (replaces instead of appending)
export default function ImageUploader({
  images = [],
  onChange,
  maxImages = 10,
  category = 'products',
  single = false,
}) {
  const fileInputRef  = useRef(null);
  const dragIndexRef  = useRef(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Internal list — initialised once from prop; parent drives via key= to remount on load
  const [items, setItems] = useState(() => images.map(fromUrl));

  const notifyParent = useCallback((nextItems) => {
    const urls = nextItems.filter(it => !it.uploading && it.url).map(it => it.url);
    onChange?.(urls);
  }, [onChange]);

  // ── Upload a batch of File objects ─────────────────────────────────────────
  const uploadFiles = useCallback(async (fileList) => {
    setValidationError('');
    const files = Array.from(fileList);

    // Validate every file first
    for (const f of files) {
      const err = validateFile(f);
      if (err) { setValidationError(err); return; }
    }

    // Build placeholder items (one per file), capped to available slots
    const effectiveMax = single ? 1 : maxImages;
    const placeholders = files.slice(0, effectiveMax).map(f => ({
      url: '',
      previewSrc: URL.createObjectURL(f),
      filename: '',
      uploading: true,
      progress: 0,
      error: '',
      _file: f,
    }));

    if (!placeholders.length) return;

    setItems(prev => {
      const base = single ? [] : prev.filter(it => !it.error);
      return [...base, ...placeholders].slice(0, single ? 1 : maxImages);
    });

    // Upload each placeholder file sequentially (avoids race on setItems)
    for (const placeholder of placeholders) {
      const file = placeholder._file;
      const formData = new FormData();
      formData.append('images', file);

      const token = localStorage.getItem('jawhara-token');

      try {
        const res = await axios.post(
          `${API_BASE}/upload/${category}`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            onUploadProgress: (e) => {
              const pct = Math.round((e.loaded * 100) / (e.total || 1));
              setItems(prev => prev.map(it =>
                it._file === file ? { ...it, progress: pct } : it
              ));
            },
          }
        );

        const uploaded = res.data.data[0];
        setItems(prev => {
          const next = prev.map(it =>
            it._file === file
              ? {
                  url: uploaded.webp,
                  previewSrc: uploaded.thumbnail,
                  filename: uploaded.filename,
                  uploading: false,
                  progress: 100,
                  error: '',
                }
              : it
          );
          notifyParent(next);
          return next;
        });
      } catch (err) {
        const msg = err.response?.data?.error || 'Upload failed';
        setItems(prev => {
          const next = prev.map(it =>
            it._file === file ? { ...it, uploading: false, error: msg } : it
          );
          notifyParent(next);
          return next;
        });
      }
    }
  }, [category, maxImages, single, notifyParent]);

  // ── Drag-over-dropzone handlers ────────────────────────────────────────────
  const handleDropZoneDragOver = (e) => { e.preventDefault(); setIsDraggingOver(true); };
  const handleDropZoneDragLeave = () => setIsDraggingOver(false);
  const handleDropZoneDrop = (e) => {
    e.preventDefault();
    setIsDraggingOver(false);
    uploadFiles(e.dataTransfer.files);
  };

  // ── Remove an item ─────────────────────────────────────────────────────────
  const handleRemove = (idx) => {
    setItems(prev => {
      const next = prev.filter((_, i) => i !== idx);
      notifyParent(next);
      return next;
    });
  };

  // ── Drag-to-reorder handlers ───────────────────────────────────────────────
  const handleItemDragStart = (idx) => { dragIndexRef.current = idx; };
  const handleItemDragOver  = (e, idx) => {
    e.preventDefault();
    e.stopPropagation();
    const from = dragIndexRef.current;
    if (from === null || from === idx) return;
    setItems(prev => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(idx, 0, moved);
      dragIndexRef.current = idx;
      notifyParent(next);
      return next;
    });
  };
  const handleItemDragEnd = () => { dragIndexRef.current = null; };

  const atMax    = items.filter(it => !it.error).length >= (single ? 1 : maxImages);
  const hasItems = items.length > 0;

  return (
    <div>
      {/* ── Drop zone ───────────────────────────────────────────────────── */}
      {!atMax && (
        <div
          onDragOver={handleDropZoneDragOver}
          onDragLeave={handleDropZoneDragLeave}
          onDrop={handleDropZoneDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer
            transition-colors duration-200
            ${isDraggingOver
              ? 'border-indigo-400 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-900/10'
              : 'border-gray-200 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/5'
            }
          `}
        >
          <UploadCloud
            size={44}
            className={`mx-auto mb-3 transition-colors duration-200 ${
              isDraggingOver ? 'text-indigo-500' : 'text-gray-300 dark:text-gray-600'
            }`}
          />
          <p className={`text-sm font-semibold transition-colors duration-200 ${
            isDraggingOver ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300'
          }`}>
            {isDraggingOver ? 'Release to upload' : 'Drag & drop images here'}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            or{' '}
            <span className="text-indigo-600 dark:text-indigo-400 font-semibold">browse files</span>
            {' '}· JPEG, PNG, WebP · max 10 MB
            {!single && ` · up to ${maxImages} images`}
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple={!single}
            className="hidden"
            onChange={e => { uploadFiles(e.target.files); e.target.value = ''; }}
          />
        </div>
      )}

      {/* ── Validation error ────────────────────────────────────────────── */}
      {validationError && (
        <div className="flex items-center gap-1.5 mt-2 text-red-500">
          <AlertCircle size={14} />
          <span className="text-xs">{validationError}</span>
        </div>
      )}

      {/* ── Image preview grid ──────────────────────────────────────────── */}
      {hasItems && (
        <div className={`flex flex-wrap gap-3 ${hasItems && !atMax ? 'mt-4' : ''}`}>
          {items.map((item, idx) => (
            <div
              key={idx}
              draggable={!item.uploading && !item.error}
              onDragStart={() => handleItemDragStart(idx)}
              onDragOver={e => handleItemDragOver(e, idx)}
              onDragEnd={handleItemDragEnd}
              className={`
                relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0
                border-2 transition-colors
                ${item.error
                  ? 'border-red-400 bg-red-50 dark:bg-red-900/10'
                  : idx === 0
                  ? 'border-indigo-400 dark:border-indigo-500 bg-gray-50 dark:bg-gray-800'
                  : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
                }
                ${!item.uploading && !item.error ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}
                group
              `}
            >
              {/* Image */}
              {item.previewSrc && (
                <img
                  src={item.previewSrc}
                  alt=""
                  className="w-full h-full object-cover block"
                />
              )}

              {/* Upload progress overlay */}
              {item.uploading && (
                <div className="absolute inset-0 bg-black/55 flex flex-col items-center justify-center gap-2">
                  <Loader2 size={18} className="text-white animate-spin" />
                  <span className="text-white text-xs font-bold">{item.progress}%</span>
                  <div className="w-3/4 h-1 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white rounded-full transition-all duration-200"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Error overlay */}
              {item.error && (
                <div className="absolute inset-0 bg-red-500/85 flex flex-col items-center justify-center p-1.5">
                  <AlertCircle size={18} className="text-white mb-1" />
                  <span className="text-white text-center leading-tight" style={{ fontSize: '0.6rem' }}>
                    {item.error}
                  </span>
                </div>
              )}

              {/* Primary badge */}
              {idx === 0 && !item.uploading && !item.error && (
                <span className="absolute top-1 left-1 bg-indigo-600 text-white rounded px-1 py-px font-extrabold uppercase tracking-wide" style={{ fontSize: '0.52rem' }}>
                  Primary
                </span>
              )}

              {/* Hover/Secondary badge */}
              {idx === 1 && !item.uploading && !item.error && (
                <span className="absolute top-1 left-1 bg-black/55 text-white rounded px-1 py-px font-extrabold uppercase tracking-wide" style={{ fontSize: '0.52rem' }}>
                  Hover
                </span>
              )}

              {/* Hover actions: drag handle + remove */}
              {!item.uploading && (
                <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between bg-black/52 px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                  {!item.error && (
                    <GripVertical size={13} className="text-white/75 flex-shrink-0" />
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemove(idx)}
                    title="Remove image"
                    className="ml-auto p-0.5 text-white hover:text-red-300 transition-colors"
                  >
                    <X size={13} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Helper text ─────────────────────────────────────────────────── */}
      {hasItems && !single && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
          First image = <strong className="text-gray-600 dark:text-gray-300">Primary</strong> cover · Second = <strong className="text-gray-600 dark:text-gray-300">Hover</strong> view · Drag cards to reorder
        </p>
      )}
    </div>
  );
}
