import { motion } from 'framer-motion';
import CareBadge from '../../components/ui/CareBadge.jsx';
import { cn } from '../../lib/cn.js';

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn('flex', isUser ? 'justify-end' : 'justify-start')}
    >
      <div className={cn('max-w-[82%] flex flex-col gap-2', isUser ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'px-4 py-3 text-[14px] leading-relaxed whitespace-pre-wrap',
            isUser
              ? 'bg-sage-500 text-white rounded-2xl rounded-br-sm'
              : 'bg-white text-coal border border-[#E5DDD7] rounded-2xl rounded-bl-sm shadow-soft',
          )}
        >
          {message.content}
          {message.streaming && (
            <span className="inline-block w-[2px] h-[1em] ml-0.5 align-[-2px] bg-sage-400 animate-pulse" />
          )}
        </div>
        {!isUser && message.careBadge && (
          <CareBadge severity={message.careBadge} />
        )}
      </div>
    </motion.div>
  );
}
