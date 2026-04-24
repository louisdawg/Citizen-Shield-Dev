import React from 'react';
import { motion } from 'motion/react';
import { ThumbsUp, ThumbsDown, Verified } from 'lucide-react';

interface TimelineItemProps {
  id: string;
  time: string;
  title: string;
  description: string;
  type: 'critical' | 'info' | 'broadcast';
  image?: string;
  tags?: string[];
  upvoteCount: number;
  downvoteCount: number;
  author?: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    isVerified: boolean;
  };
  onVote?: (postId: string, voteType: 'upvote' | 'downvote') => void;
}

export const TimelineItem: React.FC<TimelineItemProps> = ({
  id, time, title, description, type, image, tags,
  upvoteCount, downvoteCount, author, onVote,
}) => {
  const borderColor = {
    critical: 'border-primary',
    info: 'border-secondary',
    broadcast: 'border-tertiary'
  }[type];

  const dotColor = {
    critical: 'bg-primary-dim',
    info: 'bg-secondary',
    broadcast: 'bg-tertiary'
  }[type];

  const bgColor = type === 'broadcast' ? 'bg-surface-container-low' : 'bg-surface-container';

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      className="relative pl-12 mb-12"
    >
      <div className={`absolute left-0 top-1.5 w-6 h-6 rounded-full ${dotColor} border-4 border-background z-10 shadow-sm`} />

      <div className={`${bgColor} rounded-xl p-8 border-l-4 ${borderColor} border-y border-r border-black/5`}>
        <div className="flex justify-between items-start mb-4">
          <span className={`text-xs font-bold font-headline uppercase tracking-widest ${
            type === 'critical' ? 'text-primary' : type === 'info' ? 'text-secondary' : 'text-on-surface-variant'
          }`}>
            {time}
          </span>
          {author && (
            <div className="flex items-center gap-2">
              {author.avatarUrl && (
                <img
                  src={author.avatarUrl}
                  alt={author.displayName}
                  className="w-5 h-5 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              )}
              <span className="text-xs font-bold text-on-surface-variant">{author.displayName}</span>
              {author.isVerified && <Verified size={12} className="text-secondary" />}
            </div>
          )}
        </div>

        <h4 className={`text-2xl font-bold font-headline mb-4 ${type === 'broadcast' ? 'italic' : ''}`}>
          {type === 'broadcast' ? `"${title}"` : title}
        </h4>

        <p className={`text-on-surface-variant leading-relaxed ${image ? 'mb-6' : ''} ${type === 'broadcast' ? 'italic text-lg' : ''}`}>
          {description}
        </p>

        {image && (
          <div className="rounded-lg overflow-hidden h-48 w-full bg-surface-container-highest mb-4">
            <img
              className="w-full h-full object-cover grayscale opacity-80"
              src={image}
              alt={title}
              referrerPolicy="no-referrer"
            />
          </div>
        )}

        {tags && (
          <div className="mb-4 flex gap-2">
            {tags.map(tag => (
              <span key={tag} className="px-2 py-1 bg-surface-container text-[10px] text-on-surface-variant rounded">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Voting */}
        <div className="flex items-center gap-4 pt-4 border-t border-black/5">
          <button
            onClick={() => onVote?.(id, 'upvote')}
            className="flex items-center gap-1.5 text-sm font-bold text-on-surface-variant hover:text-secondary transition-colors group"
          >
            <ThumbsUp size={16} className="group-hover:scale-110 transition-transform" />
            <span>{upvoteCount}</span>
          </button>
          <button
            onClick={() => onVote?.(id, 'downvote')}
            className="flex items-center gap-1.5 text-sm font-bold text-on-surface-variant hover:text-error transition-colors group"
          >
            <ThumbsDown size={16} className="group-hover:scale-110 transition-transform" />
            <span>{downvoteCount}</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};
