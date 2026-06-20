import { useState, useRef, useCallback } from 'react';
import {
  Box, Typography, IconButton, LinearProgress, Tooltip, alpha, Chip,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import ErrorOutlinedIcon from '@mui/icons-material/ErrorOutlined';
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
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const fileInputRef  = useRef(null);
  const dragIndexRef  = useRef(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false); // drop-zone drag
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
    <Box>
      {/* ── Drop zone ───────────────────────────────────────────────────── */}
      {!atMax && (
        <Box
          onDragOver={handleDropZoneDragOver}
          onDragLeave={handleDropZoneDragLeave}
          onDrop={handleDropZoneDrop}
          onClick={() => fileInputRef.current?.click()}
          sx={{
            border: `2px dashed ${isDraggingOver
              ? theme.palette.primary.main
              : isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}`,
            borderRadius: 2,
            p: { xs: 3, sm: 4 },
            textAlign: 'center',
            cursor: 'pointer',
            bgcolor: isDraggingOver
              ? alpha(theme.palette.primary.main, 0.06)
              : 'transparent',
            transition: 'border-color 0.18s, background-color 0.18s',
            '&:hover': {
              borderColor: theme.palette.primary.main,
              bgcolor: alpha(theme.palette.primary.main, 0.04),
            },
          }}
        >
          <CloudUploadIcon sx={{
            fontSize: 48,
            color: isDraggingOver ? 'primary.main' : 'text.disabled',
            mb: 1,
            transition: 'color 0.18s',
          }} />
          <Typography variant="subtitle2" fontWeight={600} color={isDraggingOver ? 'primary.main' : 'text.primary'}>
            {isDraggingOver ? 'Release to upload' : 'Drag & drop images here'}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
            or <Box component="span" sx={{ color: 'primary.main', fontWeight: 600 }}>browse files</Box>
            {' '}· JPEG, PNG, WebP · max 10 MB
            {!single && ` · up to ${maxImages} images`}
          </Typography>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple={!single}
            hidden
            onChange={e => { uploadFiles(e.target.files); e.target.value = ''; }}
          />
        </Box>
      )}

      {/* ── Validation error ────────────────────────────────────────────── */}
      {validationError && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 1.25, color: 'error.main' }}>
          <ErrorOutlinedIcon sx={{ fontSize: '1rem' }} />
          <Typography variant="caption" color="error">{validationError}</Typography>
        </Box>
      )}

      {/* ── Image preview grid ──────────────────────────────────────────── */}
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
                position: 'relative',
                width: 100,
                height: 100,
                borderRadius: 2,
                overflow: 'hidden',
                flexShrink: 0,
                border: `2px solid ${
                  item.error
                    ? theme.palette.error.main
                    : idx === 0
                    ? theme.palette.primary.main
                    : isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.10)'
                }`,
                cursor: item.uploading ? 'default' : item.error ? 'default' : 'grab',
                bgcolor: isDark ? 'rgba(255,255,255,0.04)' : '#f5f5f7',
                '&:hover .img-actions': { opacity: 1 },
              }}
            >
              {/* Image */}
              {item.previewSrc && (
                <Box
                  component="img"
                  src={item.previewSrc}
                  alt=""
                  sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              )}

              {/* Upload progress overlay */}
              {item.uploading && (
                <Box sx={{
                  position: 'absolute', inset: 0,
                  bgcolor: 'rgba(0,0,0,0.55)',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  gap: 0.75,
                }}>
                  <Typography variant="caption" color="white" fontWeight={700} sx={{ fontSize: '0.78rem' }}>
                    {item.progress}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={item.progress}
                    sx={{ width: '75%', borderRadius: 2, height: 4 }}
                  />
                </Box>
              )}

              {/* Error overlay */}
              {item.error && (
                <Box sx={{
                  position: 'absolute', inset: 0,
                  bgcolor: alpha(theme.palette.error.main, 0.82),
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  p: 0.5,
                }}>
                  <ErrorOutlinedIcon sx={{ fontSize: '1.3rem', color: '#fff', mb: 0.25 }} />
                  <Typography variant="caption" color="white" textAlign="center" sx={{ fontSize: '0.6rem', lineHeight: 1.3 }}>
                    {item.error}
                  </Typography>
                </Box>
              )}

              {/* Primary badge */}
              {idx === 0 && !item.uploading && !item.error && (
                <Chip
                  label="Primary"
                  size="small"
                  color="primary"
                  sx={{
                    position: 'absolute', top: 4, left: 4,
                    height: 16, fontSize: '0.52rem', fontWeight: 800,
                    letterSpacing: 0.3, textTransform: 'uppercase',
                    '& .MuiChip-label': { px: 0.75 },
                  }}
                />
              )}

              {/* Hover/Secondary badge */}
              {idx === 1 && !item.uploading && !item.error && (
                <Chip
                  label="Hover"
                  size="small"
                  sx={{
                    position: 'absolute', top: 4, left: 4,
                    height: 16, fontSize: '0.52rem', fontWeight: 800,
                    letterSpacing: 0.3, textTransform: 'uppercase',
                    bgcolor: 'rgba(0,0,0,0.55)', color: '#fff',
                    '& .MuiChip-label': { px: 0.75 },
                  }}
                />
              )}

              {/* Hover actions: drag handle + remove */}
              {!item.uploading && (
                <Box className="img-actions" sx={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  bgcolor: 'rgba(0,0,0,0.52)',
                  px: 0.5, py: 0.25,
                  opacity: 0,
                  transition: 'opacity 0.15s',
                }}>
                  {!item.error && (
                    <DragIndicatorIcon sx={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.75)' }} />
                  )}
                  <Tooltip title="Remove image">
                    <IconButton
                      size="small"
                      onClick={() => handleRemove(idx)}
                      sx={{
                        ml: 'auto', p: '2px',
                        color: '#fff',
                        '&:hover': { color: theme.palette.error.light },
                      }}
                    >
                      <DeleteOutlinedIcon sx={{ fontSize: '0.9rem' }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              )}
            </Box>
          ))}
        </Box>
      )}

      {/* ── Helper text ─────────────────────────────────────────────────── */}
      {hasItems && !single && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          First image = <strong>Primary</strong> cover · Second = <strong>Hover</strong> view · Drag cards to reorder
        </Typography>
      )}
    </Box>
  );
}
