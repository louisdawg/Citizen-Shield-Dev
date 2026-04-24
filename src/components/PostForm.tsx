import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { X, Send, AlertTriangle, Info, Radio, Image as ImageIcon, Upload, Loader2 } from 'lucide-react';
import { PostType } from '../types';
import { apiUpload } from '../api';

interface PostFormProps {
  regionSlug: string;
  onClose: () => void;
  onSubmit: (post: { title: string; description: string; type: PostType; imageUrl?: string }) => void;
}

export const PostForm = ({ regionSlug, onClose, onSubmit }: PostFormProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<PostType>('info');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Only JPEG, PNG, and WebP images are allowed');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be under 10 MB');
      return;
    }

    setError(null);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;

    setSubmitting(true);
    setError(null);

    try {
      let imageUrl: string | undefined;
      if (imageFile) {
        imageUrl = await apiUpload(imageFile);
      }

      await onSubmit({ title, description, type, imageUrl });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-surface-container-low w-full max-w-lg rounded-3xl border border-black/5 shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-black/5 flex justify-between items-center bg-surface-container-high">
          <div>
            <h3 className="text-xl font-headline font-black uppercase tracking-tighter text-primary">Submit Community Report</h3>
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-1">Region: {regionSlug}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Report Type</label>
            <div className="grid grid-cols-3 gap-2">
              <TypeButton
                active={type === 'critical'}
                onClick={() => setType('critical')}
                icon={<AlertTriangle size={16} />}
                label="Critical"
                color="text-primary"
                activeBg="bg-primary/10"
              />
              <TypeButton
                active={type === 'info'}
                onClick={() => setType('info')}
                icon={<Info size={16} />}
                label="Info"
                color="text-secondary"
                activeBg="bg-secondary/10"
              />
              <TypeButton
                active={type === 'broadcast'}
                onClick={() => setType('broadcast')}
                icon={<Radio size={16} />}
                label="Broadcast"
                color="text-tertiary"
                activeBg="bg-tertiary/10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief summary of the update..."
              className="w-full bg-surface-container-highest border border-black/5 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold"
              required
              minLength={5}
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide detailed information. Be specific about locations and times..."
              className="w-full bg-surface-container-highest border border-black/5 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all min-h-[120px] resize-none"
              required
              minLength={10}
              maxLength={2000}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Image (Optional)</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
            {imagePreview ? (
              <div className="relative rounded-xl overflow-hidden border border-black/5">
                <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover" />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 p-4 bg-surface-container-highest border border-dashed border-black/10 rounded-xl text-on-surface-variant hover:border-primary/30 hover:text-primary transition-all"
              >
                <Upload size={16} />
                <span className="text-sm font-bold">Choose an image</span>
              </button>
            )}
          </div>

          {error && (
            <div className="p-3 bg-error/10 text-error text-sm font-bold rounded-xl border border-error/20">
              {error}
            </div>
          )}

          <div className="pt-4">
            <motion.button
              whileHover={submitting ? {} : { scale: 1.02 }}
              whileTap={submitting ? {} : { scale: 0.98 }}
              type="submit"
              disabled={submitting}
              className="w-full bg-primary text-white py-4 rounded-xl font-black uppercase tracking-tighter flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Broadcast Report
                </>
              )}
            </motion.button>
            <p className="text-[10px] text-center mt-4 text-on-surface-variant uppercase tracking-widest font-bold">
              All reports are subject to community verification
            </p>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

const TypeButton = ({ active, onClick, icon, label, color, activeBg }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, color: string, activeBg: string }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${
      active ? `${activeBg} ${color} border-current` : 'bg-surface-container-highest border-black/5 text-on-surface-variant grayscale opacity-60'
    }`}
  >
    {icon}
    <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
  </button>
);
