import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { DivideIcon as LucideIcon } from 'lucide-react';

export interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative';
  icon: typeof LucideIcon;
  color: 'blue' | 'purple' | 'green' | 'orange';
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  color
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const valueRef = useRef<HTMLSpanElement>(null);

  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    green: 'from-green-500 to-green-600',
    orange: 'from-orange-500 to-orange-600'
  };

  useEffect(() => {
    // Animate the value counting up
    gsap.fromTo(valueRef.current, 
      { innerText: '0' },
      {
        innerText: value,
        duration: 1.5,
        ease: 'power2.out',
        snap: { innerText: 1 },
        delay: 0.5
      }
    );

    // Hover animations
    const card = cardRef.current;
    if (card) {
      const onMouseEnter = () => {
        gsap.to(card, {
          y: -5,
          scale: 1.02,
          duration: 0.3,
          ease: 'power2.out'
        });
      };

      const onMouseLeave = () => {
        gsap.to(card, {
          y: 0,
          scale: 1,
          duration: 0.3,
          ease: 'power2.out'
        });
      };

      card.addEventListener('mouseenter', onMouseEnter);
      card.addEventListener('mouseleave', onMouseLeave);

      return () => {
        card.removeEventListener('mouseenter', onMouseEnter);
        card.removeEventListener('mouseleave', onMouseLeave);
      };
    }
  }, [value]);

  return (
    <div 
      ref={cardRef}
      className="metric-card bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 hover:border-gray-600/50 transition-all duration-200"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`bg-gradient-to-r ${colorClasses[color]} p-3 rounded-lg`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <span className={`text-sm font-semibold ${
          changeType === 'positive' ? 'text-green-400' : 'text-red-400'
        }`}>
          {change}
        </span>
      </div>
      
      <div>
        <h3 className="text-gray-400 text-sm mb-1">{title}</h3>
        <span ref={valueRef} className="text-3xl font-bold text-white">
          {value}
        </span>
      </div>
    </div>
  );
};

export default MetricCard;