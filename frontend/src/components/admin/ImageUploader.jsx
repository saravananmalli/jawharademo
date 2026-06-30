import { useState, useRef, useCallback } from 'react';
import { UploadCloud, X, GripVertical, AlertCircle, Loader2 } from 'lucide-react';
import { Box, Typography } from '@mui/material';
import axios from 'axios';
import { getImageUrl } from '../../utils/imageUrl';

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 10 * 1024 * 1024;
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

function toThumbUrl(webpUrl) {
  if (!webpUrl) return '';
  return webpUrl.replace('/webp/', '/thumbnails/');
}

function fromUrl(url) {
  return { url, previewSrc: getImageUrl(toThumbUrl(url) || url), filename: url.split('/').pop()?.replace('.webp', '') || '', uploading: false, progress: 100, error: '' };
}

function validateFile(file) {
  if (!ALLOWED_TYPES.includes(file.type)) return `"${file.name}" is not supported. Upload JPEG, PNG, or WebP only.`;
  if (file.size > MAX_SIZE_BYTES) return `"${file.name}" exceeds the 10 MB size limit.`;
  return null;
}

export default function ImageUploader({ images = [], onChange, maxImages = 10, category = 'products', single = false }) {
  const fileInputRef  = useRef(null);
  const dragIndexRef  = useRef(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [items, setItems] = useState(() => images.map(fromUrl));

  const notifyParent = useCallback((nextItems) => {
    const urls = nextItems.filter(it => !it.uploading && it.url).map(it => it.url);
    onChange?.(urls);
  }, [onChange]);

  const uploadFiles = useCallback(async (fileList) => {
    setValidationError('');
    const files = Array.from(fileList);
    for (const f of files) {
      const err = validateFile(f);
      if (err) { setValidationError(err); return; }
    }
    const effectiveMax = single ? 1 : maxImages;
    const placeholders = files.slice(0, effectiveMax).map(f => ({
      url: '', previewSrc: URL.createObjectURL(f), filename: '',
      uploading: true, progress: 0, error: '', _file: f,
    }));
    if (!placeholders.length) return;
    setItems(prev => {
      const base = single ? [] : prev.filter(it => !it.error);
      return [...base, ...placeholders].slice(0, single ? 1 : maxImages);
    });
    for (const placeholder of placeholders) {
      const file = placeholder._file;
      const formData = new FormData();
      formData.append('images', file);
      const token = localStorage.getItem('jawhara-token');
      try {
        const res = await axios.post(`${API_BASE}/upload/${category}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          onUploadProgress: (e) => {
            const pct = Math.round((e.loaded * 100) / (e.total || 1));
            setItems(prev => prev.map(it => it._file === file ? { ...it, progress: pct } : it));
          },
        });
        const uploaded = res.data.data[0];
        setItems(prev => {
          const next = prev.map(it =>
            it._file === file ? { url: uploaded.webp, previewSrc: uploaded.thumbnail, filename: uploaded.filename, uploading: false, progress: 100, error: '' } : it
          );
          notifyParent(next);
          return next;
        });
      } catch (err) {
        const msg = err.response?.data?.error || 'Upload failed';
        setItems(prev => {
          const next = prev.map(it => it._file === file ? { ...it, uploading: false, error: msg } : it);
          notifyParent(next);
          return next;
        });
      }
    }
  }, [category, maxImages, single, notifyParent]);

  const handleDropZoneDragOver  = (e) => { e.preventDefault(); setIsDraggingOver(true); };
  const handleDropZoneDragLeave = () => setIsDraggingOver(false);
  const handleDropZoneDrop      = (e) => { e.preventDefault(); setIsDraggingOver(false); uploadFiles(e.dataTransfer.files); };
  const handleRemove            = (idx) => { setItems(prev => { const next = prev.filter((_, i) => i !== idx); notifyParent(next); return next; }); };
  const handleItemDragStart     = (idx) => { dragIndexRef.current = idx; };
  const handleItemDragOver      = (e, idx) => {
    e.preventDefault(); e.stopPropagation();
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
    <Box>
      {/* Drop zone */}
      {!atMax && (
        <Box
          onDragOver={handleDropZoneDragOver}
          onDragLeave={handleDropZoneDragLeave}
          onDrop={handleDropZoneDrop}
          onClick={() => fileInputRef.current?.click()}
          sx={{
            border: '2px dashed', borderRadius: 3, p: 4, textAlign: 'center', cursor: 'pointer',
            transition: 'all 0.2s',
            borderColor: isDraggingOver ? 'primary.light' : 'divider',
            bgcolor: isDraggingOver ? 'rgba(99,102,241,0.06)' : 'transparent',
            '&:hover': { borderColor: 'primary.light', bgcolor: 'rgba(99,102,241,0.04)' },
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1.5 }}>
            <UploadCloud size={44} style={{ color: isDraggingOver ? '#6366f1' : undefined, opacity: isDraggingOver ? 1 : 0.35, transition: 'all 0.2s' }} />
          </Box>
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: isDraggingOver ? 'primary.main' : 'text.primary', transition: 'color 0.2s' }}>
            {isDraggingOver ? 'Release to upload' : 'Drag & drop images here'}
          </Typography>
          <Typography sx={{ fontSize: 12, color: 'text.disabled', mt: 0.5 }}>
            or <Box component="span" sx={{ color: 'primary.main', fontWeight: 600 }}>browse files</Box>
            {' '}· JPEG, PNG, WebP · max 10 MB
            {!single && ` · up to ${maxImages} images`}
          </Typography>
          <Box
            component="input"
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple={!single}
            sx={{ display: 'none' }}
            onChange={e => { uploadFiles(e.target.files); e.target.value = ''; }}
          />
        </Box>
      )}

      {/* Validation error */}
      {validationError && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 1 }}>
          <AlertCircle size={14} style={{ color: '#ef4444', flexShrink: 0 }} />
          <Typography sx={{ fontSize: 12, color: 'error.main' }}>{validationError}</Typography>
        </Box>
      )}

      {/* Image preview grid */}
      {hasItems && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: hasItems && !atMax ? 2 : 0 }}>
          {items.map((item, idx) => (
            <Box
              key={idx}
              draggable={!item.uploading && !item.error}
              onDragStart={() => handleItemDragStart(idx)}
              onDragOver={e => handleItemDragOver(e, idx)}
              onDragEnd={handleItemDragEnd}
              sx={{
                position: 'relative', width: 96, height: 96, borderRadius: 2.5, overflow: 'hidden', flexShrink: 0,
                border: '2px solid', transition: 'border-color 0.15s',
                borderColor: item.error ? 'error.main' : idx === 0 ? 'primary.main' : 'divider',
                bgcolor: 'action.hover',
                cursor: !item.uploading && !item.error ? 'grab' : 'default',
                '&:active': { cursor: !item.uploading && !item.error ? 'grabbing' : 'default' },
                '&:hover .img-action-bar': { opacity: 1 },
              }}
            >
              {item.previewSrc && (
                <Box component="img" src={item.previewSrc} alt="" sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              )}

              {/* Upload progress overlay */}
              {item.uploading && (
                <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.55)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                  <Loader2 size={18} style={{ color: '#fff', animation: 'spin 1s linear infinite' }} />
                  <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>{item.progress}%</Typography>
                  <Box sx={{ width: '75%', height: 4, bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 2, overflow: 'hidden' }}>
                    <Box sx={{ height: '100%', bgcolor: '#fff', borderRadius: 2, width: `${item.progress}%`, transition: 'width 0.2s' }} />
                  </Box>
                </Box>
              )}

              {/* Error overlay */}
              {item.error && (
                <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(239,68,68,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 0.75 }}>
                  <AlertCircle size={18} style={{ color: '#fff', marginBottom: 4 }} />
                  <Typography sx={{ fontSize: '0.6rem', color: '#fff', textAlign: 'center', lineHeight: 1.3 }}>{item.error}</Typography>
                </Box>
              )}

              {/* Primary badge */}
              {idx === 0 && !item.uploading && !item.error && (
                <Box sx={{ position: 'absolute', top: 4, left: 4, bgcolor: 'primary.main', color: '#fff', borderRadius: 0.5, px: 0.5, py: '1px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.52rem' }}>
                  Primary
                </Box>
              )}

              {/* Hover/secondary badge */}
              {idx === 1 && !item.uploading && !item.error && (
                <Box sx={{ position: 'absolute', top: 4, left: 4, bgcolor: 'rgba(0,0,0,0.55)', color: '#fff', borderRadius: 0.5, px: 0.5, py: '1px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.52rem' }}>
                  Hover
                </Box>
              )}

              {/* Hover action bar (drag handle + remove) */}
              {!item.uploading && (
                <Box className="img-action-bar" sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'rgba(0,0,0,0.52)', px: 0.5, py: 0.25, opacity: 0, transition: 'opacity 0.15s' }}>
                  {!item.error && <GripVertical size={13} style={{ color: 'rgba(255,255,255,0.75)', flexShrink: 0 }} />}
                  <Box
                    component="button"
                    type="button"
                    onClick={() => handleRemove(idx)}
                    title="Remove image"
                    sx={{ ml: 'auto', p: 0.25, background: 'none', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', '&:hover': { color: '#fca5a5' }, transition: 'color 0.1s' }}
                  >
                    <X size={13} />
                  </Box>
                </Box>
              )}
            </Box>
          ))}
        </Box>
      )}

      {/* Helper text */}
      {hasItems && !single && (
        <Typography sx={{ fontSize: 12, color: 'text.disabled', mt: 1 }}>
          First image = <Box component="strong" sx={{ color: 'text.secondary', fontWeight: 600 }}>Primary</Box> cover · Second = <Box component="strong" sx={{ color: 'text.secondary', fontWeight: 600 }}>Hover</Box> view · Drag cards to reorder
        </Typography>
      )}
    </Box>
  );
}
