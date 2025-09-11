import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Clock, Target, TrendingUp, Calculator } from 'lucide-react';
import MetricCard, { MetricCardProps } from './MetricCard';

const Dashboard = () => {
  const dashboardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cards = dashboardRef.current?.querySelectorAll('.metric-card');
    if (cards) {
      gsap.from(cards, {
        y: 50,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        delay: 0.3,
        ease: 'power2.out'
      });
    }
  }, []);

  const metrics: MetricCardProps[] = [
    {
      title: 'Total Learning Hours',
      value: '247.5',
      change: '+12%',
      changeType: 'positive',
      icon: Clock,
      color: 'blue'
    },
    {
      title: 'Avg Hours/Day',
      value: '2.1',
      change: '+0.3',
      changeType: 'positive',
      icon: Calculator,
      color: 'orange'
    },
    {
      title: 'Skills Tracked',
      value: '23',
      change: '+3',
      changeType: 'positive',
      icon: Target,
      color: 'purple'
    },
    {
      title: 'Progress Score',
      value: '87.2',
      change: '+5.3',
      changeType: 'positive',
      icon: TrendingUp,
      color: 'green'
    }
  ];

  return (
    <div ref={dashboardRef}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Learning Overview</h2>
        <p className="text-gray-400">Track your progress across all learning platforms</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </div>
    </div>
  );
};

export default Dashboard;