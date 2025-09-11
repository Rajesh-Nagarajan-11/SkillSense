import { useEffect, useMemo, useState } from 'react';
import { Brain, Clock, Target, Calculator, User, Calendar, Sun, Moon } from 'lucide-react';
import { clearAuth, getAuthUser } from './utils/auth';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

type Theme = 'light' | 'dark';

function App() {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('skillsense-theme') as Theme | null;
    return saved ?? 'dark';
  });

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'] as const;
  type Month = typeof months[number];
  const [selectedMonth, setSelectedMonth] = useState<Month>('Jan');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('skillsense-theme', theme);
  }, [theme]);

  const themeStyles = useMemo(() => {
    return {
      light: {
        appBg: 'bg-gradient-to-br from-gray-50 via-white to-gray-100',
        headerBg: 'bg-white/70 backdrop-blur-md border-b border-gray-200',
        brandIcon: 'text-white',
        title: 'text-gray-900',
        subText: 'text-gray-600',
        panel: 'bg-white/80 backdrop-blur-sm border border-gray-200',
        panelTitle: 'text-gray-900',
        panelSub: 'text-gray-600',
        subPanel: 'bg-gray-100',
        chip: 'bg-blue-100 text-blue-700',
        muted: 'text-gray-500',
        divider: 'border-gray-200',
      },
      dark: {
        // Use former "black" styling for dark mode
        appBg: 'bg-black',
        headerBg: 'bg-black backdrop-blur-md border-b border-gray-800',
        brandIcon: 'text-white',
        title: 'text-white',
        subText: 'text-gray-500',
        panel: 'bg-black border border-gray-800',
        panelTitle: 'text-white',
        panelSub: 'text-gray-500',
        subPanel: 'bg-[#0a0a0a]',
        chip: 'bg-blue-500/20 text-blue-400',
        muted: 'text-gray-400',
        divider: 'border-gray-800',
      }
    }[theme];
  }, [theme]);

  type ColorKey = 'blue' | 'purple' | 'green' | 'orange';

  const metrics: Array<{
    title: string;
    value: string;
    change: string;
    icon: any;
    color: ColorKey;
  }> = [
    {
      title: 'Total Learning Hours',
      value: '247.5',
      change: '+12%',
      icon: Clock,
      color: 'blue'
    },
    {
      title: 'Avg Hours/Day',
      value: '2.1',
      change: '+0.3',
      icon: Calculator,
      color: 'orange'
    },
    {
      title: 'Skills Tracked',
      value: '23',
      change: '+3',
      icon: Target,
      color: 'purple'
    }
  ];

  const colorClasses: Record<ColorKey, string> = {
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    green: 'from-green-500 to-green-600',
    orange: 'from-orange-500 to-orange-600'
  };

  // Chart data for single-series activity trend (10 points with ups/downs like the sample image)
  const dailyDataByMonth: Record<Month, number[]> = {
    Jan: [20, 30, 28, 50, 47, 60, 78, 90, 66, 70],
    Feb: [25, 22, 35, 40, 55, 52, 68, 72, 65, 74],
    Mar: [30, 42, 38, 60, 58, 75, 82, 88, 70, 76],
    Apr: [45, 50, 48, 62, 80, 90, 76, 68, 72, 78],
    May: [50, 55, 60, 58, 72, 86, 92, 84, 78, 88],
    Jun: [62, 66, 70, 68, 82, 88, 95, 90, 80, 85],
  };

  const skillProgressData = useMemo(() => ({
    labels: Array.from({ length: 10 }, (_, i) => `${i + 1}`),
    datasets: [
      {
        label: 'Activity',
        data: dailyDataByMonth[selectedMonth],
        borderColor: '#EF4444',
        pointBackgroundColor: '#EF4444',
        pointBorderColor: '#EF4444',
        backgroundColor: 'rgba(239, 68, 68, 0.08)',
        tension: 0.2,
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 2,
        fill: false,
      },
    ],
  }), [selectedMonth]);

  // Chart data for learning time distribution
  const learningTimeData = {
    labels: ['JavaScript', 'React', 'Node.js', 'Python', 'CSS', 'Others'],
    datasets: [
      {
        data: [120.5, 89.2, 67.3, 42.3, 28.7, 35.8],
        backgroundColor: [
          '#3B82F6',
          '#8B5CF6',
          '#10B981',
          '#F59E0B',
          '#EF4444',
          '#6B7280',
        ],
        borderWidth: 0,
      },
    ],
  };

  const chartTextColor = theme === 'light' ? '#4B5563' : '#9CA3AF';
  const gridColor = theme === 'light' ? '#E5E7EB' : '#262626';

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        ticks: {
          color: chartTextColor,
        },
        grid: {
          color: gridColor,
        },
      },
      y: {
        ticks: {
          color: chartTextColor,
        },
        grid: {
          color: gridColor,
        },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: chartTextColor,
          padding: 20,
        },
      },
    },
  };

  return (
    <div className={`min-h-screen ${themeStyles.appBg}`}>
      {/* Header */}
      <header className={`${themeStyles.headerBg}`}>
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg">
              <Brain className={`h-6 w-6 ${themeStyles.brandIcon}`} />
            </div>
            <div>
              <h1 className={`text-xl font-bold ${themeStyles.title}`}>SkillSense</h1>
              <p className={`text-sm ${themeStyles.subText}`}>Learning Analytics Dashboard</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              aria-label="Toggle theme"
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className={`relative inline-flex h-9 w-16 items-center rounded-full border transition-colors ${
                theme === 'light'
                  ? 'bg-white border-gray-300'
                  : 'bg-black border-gray-800'
              }`}
            >
              <span className={`absolute left-1 transition-transform ${theme === 'light' ? 'translate-x-0' : 'translate-x-7'}`}>
                <span className={`flex h-7 w-7 items-center justify-center rounded-full ${
                  theme === 'light' ? 'bg-gray-100 text-yellow-500' : 'bg-gray-900 text-gray-200'
                }`}>
                  {theme === 'light' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </span>
              </span>
            </button>
            <div className={`flex items-center ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
              <User className="h-5 w-5 mr-2" />
              <span className="text-sm">{getAuthUser()?.username || 'User'}</span>
            </div>
            <button onClick={() => { clearAuth(); window.location.href = '/login'; }} className="px-3 py-1 rounded-md bg-red-600 text-white text-sm hover:bg-red-700">
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Dashboard Overview */}
        <div className="mb-8">
          <div className="mb-6">
            <h2 className={`text-2xl font-bold ${themeStyles.title} mb-2`}>Learning Overview</h2>
            <p className={`${themeStyles.subText}`}>Track your progress across all learning platforms</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {metrics.map((metric, index) => (
              <div 
                key={index}
                className={`${themeStyles.panel} rounded-xl p-6 transition-all duration-200 hover:transform hover:scale-105 ${
                  theme === 'light' ? 'hover:border-gray-300' : theme === 'dark' ? 'hover:border-gray-600/50' : 'hover:border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`bg-gradient-to-r ${colorClasses[metric.color]} p-3 rounded-lg`}>
                    <metric.icon className={`h-6 w-6 ${themeStyles.brandIcon}`} />
                  </div>
                  <span className="text-sm font-semibold text-green-400">
                    {metric.change}
                  </span>
                </div>
                
                <div>
                  <h3 className={`${themeStyles.subText} text-sm mb-1`}>{metric.title}</h3>
                  <span className={`text-3xl font-bold ${themeStyles.title}`}>
                    {metric.value}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Charts Section */}
        <div className="mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className={`${themeStyles.panel} rounded-xl p-6`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-xl font-bold ${themeStyles.panelTitle}`}>Skill Progression Over Time</h3>
                <select
                  aria-label="Select month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value as Month)}
                  className={`px-3 py-2 rounded-md border text-sm focus:outline-none ${
                    theme === 'light'
                      ? 'bg-white text-gray-900 border-gray-300'
                      : 'bg-black text-gray-200 border-gray-800'
                  }`}
                >
                  {months.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="h-80">
                <Line data={skillProgressData} options={chartOptions} />
              </div>
            </div>
            
            <div className={`${themeStyles.panel} rounded-xl p-6`}>
              <h3 className={`text-xl font-bold ${themeStyles.panelTitle} mb-6`}>Learning Time Distribution</h3>
              <div className="h-80">
                <Doughnut data={learningTimeData} options={doughnutOptions} />
              </div>
            </div>
          </div>
        </div>

        {/* High Confidence Skills */}
        <div className="mb-8">
          <div className={`${themeStyles.panel} rounded-xl p-6`}>
            <div className="mb-6">
              <h3 className={`text-xl font-bold ${themeStyles.panelTitle} mb-2`}>High Confidence Skills</h3>
              <p className={`${themeStyles.panelSub} text-sm`}>Skills you've mastered with 85%+ proficiency</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { 
                  name: 'JavaScript', 
                  confidence: 95, 
                  hours: 120.5, 
                  badge: 'Expert',
                  color: 'yellow'
                },
                { 
                  name: 'React', 
                  confidence: 92, 
                  hours: 89.2, 
                  badge: 'Advanced',
                  color: 'blue'
                },
                { 
                  name: 'HTML/CSS', 
                  confidence: 98, 
                  hours: 156.8, 
                  badge: 'Expert',
                  color: 'green'
                },
                { 
                  name: 'Git/GitHub', 
                  confidence: 88, 
                  hours: 67.3, 
                  badge: 'Advanced',
                  color: 'purple'
                },
                { 
                  name: 'Problem Solving', 
                  confidence: 90, 
                  hours: 203.7, 
                  badge: 'Expert',
                  color: 'orange'
                },
                { 
                  name: 'API Integration', 
                  confidence: 86, 
                  hours: 45.9, 
                  badge: 'Advanced',
                  color: 'blue'
                }
              ].map((skill, index) => (
                <div key={index} className={`${themeStyles.subPanel} rounded-lg p-4 transition-all duration-200 hover:scale-105 ${
                  theme === 'light' ? 'hover:bg-gray-200' : theme === 'dark' ? 'hover:bg-gray-700/50' : 'hover:bg-[#0f0f0f]'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className={`${themeStyles.panelTitle} font-semibold`}>{skill.name}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      skill.badge === 'Expert' 
                        ? 'bg-yellow-500/20 text-yellow-400' 
                        : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {skill.badge}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className={`${themeStyles.panelSub}`}>Confidence</span>
                      <span className="text-green-400 font-semibold">{skill.confidence}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className={`${themeStyles.panelSub}`}>Learning Hours</span>
                      <span className={`${themeStyles.panelTitle}`}>{skill.hours}h</span>
                    </div>
                    <div className={`${theme === 'light' ? 'bg-gray-300' : 'bg-gray-600'} rounded-full h-2`}>
                      <div 
                        className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full"
                        style={{ width: `${skill.confidence}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Smart Recommendations */}
        <div className="mb-8">
          <div className={`${themeStyles.panel} rounded-xl p-6`}>
            <div className="mb-6">
              <h3 className={`text-xl font-bold ${themeStyles.panelTitle} mb-2`}>Smart Recommendations</h3>
              <p className={`${themeStyles.panelSub} text-sm`}>Next skills to learn based on your current expertise</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  current: 'React',
                  recommended: 'Next.js',
                  reason: 'Perfect next step for React developers',
                  difficulty: 'Medium',
                  estimatedTime: '3-4 weeks',
                  confidence: 92,
                  icon: '⚡'
                },
                {
                  current: 'JavaScript',
                  recommended: 'TypeScript',
                  reason: 'Add type safety to your JavaScript skills',
                  difficulty: 'Easy',
                  estimatedTime: '2-3 weeks',
                  confidence: 95,
                  icon: '🔷'
                },
                {
                  current: 'Problem Solving',
                  recommended: 'System Design',
                  reason: 'Scale your problem-solving to architecture',
                  difficulty: 'Hard',
                  estimatedTime: '6-8 weeks',
                  confidence: 90,
                  icon: '🏗️'
                },
                {
                  current: 'API Integration',
                  recommended: 'GraphQL',
                  reason: 'Modern alternative to REST APIs',
                  difficulty: 'Medium',
                  estimatedTime: '4-5 weeks',
                  confidence: 86,
                  icon: '📊'
                }
              ].map((rec, index) => (
                <div key={index} className={`${
                  theme === 'light'
                    ? 'bg-gradient-to-r from-blue-500/5 to-purple-500/5 border border-blue-500/20'
                    : 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20'
                } rounded-lg p-5 hover:border-blue-500/40 transition-all duration-200`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{rec.icon}</span>
                      <div>
                        <h4 className={`${themeStyles.panelTitle} font-semibold text-lg`}>{rec.recommended}</h4>
                        <p className={`text-blue-500 text-sm ${theme === 'light' ? 'text-blue-600' : 'text-blue-400'}`}>Based on your {rec.current} expertise</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      rec.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' :
                      rec.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {rec.difficulty}
                    </span>
                  </div>
                  
                  <p className={`${themeStyles.muted} text-sm mb-4`}>{rec.reason}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm">
                      <span className={`${themeStyles.panelSub}`}>
                        ⏱️ {rec.estimatedTime}
                      </span>
                      <span className={`${themeStyles.panelSub}`}>
                        📈 {rec.confidence}% match
                      </span>
                    </div>
                    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors">
                      Start Learning
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mb-8">
          <div className={`${themeStyles.panel} rounded-xl p-6`}>
            <div className="mb-6">
              <h3 className={`text-xl font-bold ${themeStyles.panelTitle} mb-2`}>Recent Activity</h3>
              <p className={`${themeStyles.panelSub} text-sm`}>Your latest learning activities across all platforms</p>
            </div>
            
            <div className="space-y-4">
              {[
                { 
                  activity: 'Completed React Advanced Patterns Course', 
                  platform: 'YouTube', 
                  time: '2 hours ago', 
                  duration: '2h 15m',
                  type: 'video',
                  skill: 'React'
                },
                { 
                  activity: 'Solved "Two Sum" Algorithm Problem', 
                  platform: 'LeetCode', 
                  time: '4 hours ago', 
                  duration: '45m',
                  type: 'problem',
                  skill: 'Problem Solving'
                },
                { 
                  activity: 'Contributed to React Open Source Project', 
                  platform: 'GitHub', 
                  time: '6 hours ago', 
                  duration: '1h 30m',
                  type: 'code',
                  skill: 'React'
                },
                { 
                  activity: 'Completed Machine Learning Module 3', 
                  platform: 'Coursera', 
                  time: '1 day ago', 
                  duration: '3h 20m',
                  type: 'course',
                  skill: 'Python'
                },
                { 
                  activity: 'Built REST API with Express.js', 
                  platform: 'Personal Project', 
                  time: '2 days ago', 
                  duration: '4h 45m',
                  type: 'project',
                  skill: 'Node.js'
                },
                { 
                  activity: 'Watched TypeScript Fundamentals', 
                  platform: 'YouTube', 
                  time: '3 days ago', 
                  duration: '1h 20m',
                  type: 'video',
                  skill: 'TypeScript'
                }
              ].map((item, index) => (
                <div key={index} className={`${themeStyles.subPanel} rounded-lg p-4 transition-all duration-200 hover:scale-[1.02] ${
                  theme === 'light' ? 'hover:bg-gray-200' : theme === 'dark' ? 'hover:bg-gray-700/50' : 'hover:bg-[#0f0f0f]'
                }`}>
                  <div className="flex items-start space-x-4">
                    <div className={`${theme === 'light' ? 'bg-blue-100' : 'bg-blue-600/20'} p-2 rounded-lg`}>
                      <Calendar className={`h-4 w-4 ${theme === 'light' ? 'text-blue-600' : 'text-blue-400'}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className={`${themeStyles.panelTitle} font-medium`}>{item.activity}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${theme === 'light' ? 'bg-blue-100 text-blue-700' : 'bg-blue-500/20 text-blue-400'}`}>
                          {item.skill}
                        </span>
                      </div>
                      <div className={`flex items-center space-x-3 text-sm ${themeStyles.panelSub}`}>
                        <span className="flex items-center space-x-1">
                          <span className={`w-2 h-2 rounded-full ${theme === 'light' ? 'bg-green-600' : 'bg-green-500'}`}></span>
                          <span>{item.platform}</span>
                        </span>
                        <span>•</span>
                        <span>{item.duration}</span>
                        <span>•</span>
                        <span>{item.time}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;