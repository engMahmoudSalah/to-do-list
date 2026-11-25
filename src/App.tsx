import React, { useState, useEffect, useRef } from 'react';
import { 
  Check, 
  Plus, 
  Search, 
  Bell, 
  Menu, 
  X, 
  Calendar as CalendarIcon, 
  ChevronDown, 
  ListTodo,
  Trash2,
  Edit3,
  PieChart,
  Activity,
  Smile,
  Frown,
  MoreHorizontal,
  Square,
  CheckSquare,
  Sparkles,
  Clock,
  Tag
} from 'lucide-react';

// image imports
import logo from './images/logo.jpeg';
import SyncPanel from './SyncPanel';

// --- اقتباسات ساخرة ---
const SARCASTIC_QUOTES = [
  "العمل الجاد لن يقتلك، لكن لماذا المخاطرة؟",
  "إذا كان النجاح مفتاحاً، فمن المؤكد أن أحدهم قد غير القفل.",
  "أنا لا أؤجل عمل اليوم إلى الغد، أنا أؤجله إلى الأبد.",
  "الشيء الوحيد الذي يمنعني من تحطيم حاسوبي هو ثمنه.",
  "الاجتماعات: المكان الذي تذهب إليه الأفكار لتموت.",
  "أنا أعمل بجد لكي أتمكن من النوم بسلام... في العمل.",
  "الخبرة هي ما تحصل عليه عندما لا تحصل على ما تريد.",
  "طموحي الوحيد اليوم هو أن أعود إلى السرير.",
  "مكافأة العمل الجيد هي المزيد من العمل.",
  "أنا لست كسولاً، أنا في وضع توفير الطاقة.",
  "بعض الناس يصنعون السعادة أينما ذهبوا، والبعض الآخر متى ذهبوا.",
  "العمل الجماعي يعني أن هناك شخص آخر يمكن إلقاء اللوم عليه.",
  "أنا أتحمل مسؤولية ما أقوله، وليس ما تفهمه أنت."
];

// --- مكون خلفية الفضاء باستخدام Canvas ---
const StarfieldBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animationFrameId: number;
    let stars: any[] = [];
    let shootingStars: any[] = [];
    let rotation = 0;

    const initStars = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      // نحتاج لمساحة أكبر من الشاشة لتغطية الأطراف أثناء الدوران
      const maxDistance = Math.max(canvas.width, canvas.height) * 1.5; 
      const numStars = 600; // تقليل العدد قليلاً لتبدو أهدأ
      
      stars = [];
      for (let i = 0; i < numStars; i++) {
        stars.push({
          x: (Math.random() - 0.5) * maxDistance,
          y: (Math.random() - 0.5) * maxDistance,
          size: Math.random() * 0.8 + 0.2, // جعل النجوم أصغر بكثير (بين 0.2 و 1 بيكسل)
          alpha: Math.random() * 0.5, // تقليل السطوع المبدئي (أقل وضوحاً)
          alphaChange: (Math.random() * 0.005) + 0.001, // إبطاء سرعة الوميض لتكون أنعم
          direction: Math.random() > 0.5 ? 1 : -1 // اتجاه الوميض (زيادة أو نقصان)
        });
      }
    };

    const draw = () => {
      // مسح الإطار السابق
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // خلفية سوداء مطلقة
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      ctx.save();
      ctx.translate(centerX, centerY);
      
      // دوران بطيء جداً ومستمر
      rotation += 0.0003; // إبطاء سرعة الدوران قليلاً لمزيد من الهدوء
      ctx.rotate(rotation);

      // رسم النجوم
      stars.forEach(star => {
        // تأثير الوميض (Twinkling)
        star.alpha += star.alphaChange * star.direction;
        
        // تقليل أقصى سطوع ممكن لتظل النجوم خافتة (أقل وضوحاً)
        if (star.alpha >= 0.5) { 
          star.alpha = 0.5; 
          star.direction = -1; 
        } else if (star.alpha <= 0.05) { 
          star.alpha = 0.05; 
          star.direction = 1; 
        }

        ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();

      // رسم النيازك (Shooting Stars)
      if (Math.random() < 0.02) {
        shootingStars.push({
          x: Math.random() * canvas.width,
          y: 0,
          length: Math.random() * 80 + 20,
          speed: Math.random() * 10 + 5,
          opacity: 1
        });
      }

      shootingStars.forEach((star, index) => {
        star.x -= star.speed;
        star.y += star.speed;
        star.opacity -= 0.02;

        if (star.opacity <= 0) {
          shootingStars.splice(index, 1);
        } else {
          ctx.beginPath();
          ctx.moveTo(star.x, star.y);
          ctx.lineTo(star.x + star.length, star.y - star.length);
          ctx.strokeStyle = `rgba(255, 255, 255, ${star.opacity})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    initStars();
    draw();

    // تحديث الأبعاد عند تغيير حجم النافذة
    const handleResize = () => {
      initStars();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" />;
};


// --- البيانات الافتراضية للتطبيق ---
const initialTasks = [
  {
    id: 1,
    title: 'اجتماع مع المدير',
    description: 'هيشتمنا كالعادة ويهزأنا لمدة ساعة متواصلة بدون سبب واضح. يرجى تحضير ملامح الاكتئاب.',
    startTime: '10:30',
    endTime: '12:00',
    time: '10:30 ص - 12:00 م',
    color: 'bg-blue-100',
    completed: false,
    tags: ['عمل', 'اجتماع', 'اكتئاب']
  },
  {
    id: 2,
    title: 'تعديل لوجو العميل',
    description: 'العميل عايز اللوجو يكبر شوية ويبقى لونه أحمر بس مريح للعين ومبهج زي الأزرق الداكن.',
    startTime: '12:30',
    endTime: '14:00',
    time: '12:30 م - 02:00 م',
    color: 'bg-purple-100',
    completed: false,
    tags: ['تصميم', 'عميل', 'تعديلات']
  },
  {
    id: 3,
    title: 'شرب قهوة ومحاولة النجاة',
    description: 'محاولة بائسة لإنقاذ ما تبقى من خلايا المخ وتأمل الفراغ في صمت.',
    startTime: '14:00',
    endTime: '14:30',
    time: '02:00 م - 02:30 م',
    color: 'bg-orange-100',
    completed: false,
    tags: ['راحة', 'قهوة']
  },
  {
    id: 4,
    title: 'تصليح باج الـ Production',
    description: 'السيستم وقع والكل بيصوت. اعمل نفسك ميت لحد ما حد تاني يصلحه.',
    startTime: '17:00',
    endTime: '18:00',
    time: '05:00 م - 06:00 م',
    color: 'bg-green-100',
    completed: true,
    tags: ['برمجة', 'طوارئ']
  }
];

const PASTEL_COLORS = ['bg-blue-100', 'bg-purple-100', 'bg-orange-100', 'bg-pink-100', 'bg-green-100', 'bg-yellow-100'];

// دالة لتنسيق الوقت من 24 ساعة (المخزن في الـ Input) إلى 12 ساعة (ص/م)
const formatTimeAr = (time24: string) => {
  if (!time24) return '';
  const [h, m] = time24.split(':');
  if (!h || !m) return time24; // حماية إضافية
  let hours = parseInt(h, 10);
  const ampm = hours >= 12 ? 'م' : 'ص';
  hours = hours % 12 || 12;
  return `${hours.toString().padStart(2, '0')}:${m} ${ampm}`;
};

// دالة ذكية لتحليل الوقت القديم ودعمه في النظام الجديد لكي لا تضيع مهامك السابقة
const parseOldTime = (timeStr: string) => {
  try {
    if (!timeStr) return { start: '10:00', end: '12:00' };
    const parts = timeStr.split(' - ');
    if (parts.length !== 2) return { start: '10:00', end: '12:00' };
    
    const convertPart = (str: string) => {
      const [time, ampm] = str.trim().split(' ');
      let [h, m] = time.split(':');
      let hours = parseInt(h, 10);
      if (ampm === 'م' && hours < 12) hours += 12;
      if (ampm === 'ص' && hours === 12) hours = 0;
      return `${hours.toString().padStart(2, '0')}:${m.padStart(2, '0')}`;
    };
    
    return { start: convertPart(parts[0]), end: convertPart(parts[1]) };
  } catch (e) {
    return { start: '10:00', end: '12:00' };
  }
};

// دالة جديدة لتوليد ثيمات متكاملة للكروت تتناسب مع الفضاء
const getTheme = (colorCode: string) => {
  const themes: Record<string, any> = {
    'bg-blue-100': { line: 'bg-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20', hoverBorder: 'hover:border-blue-500/40', glow: 'hover:shadow-[0_0_30px_rgba(59,130,246,0.15)]', text: 'text-blue-400', ring: 'ring-blue-500' },
    'bg-purple-100': { line: 'bg-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20', hoverBorder: 'hover:border-purple-500/40', glow: 'hover:shadow-[0_0_30px_rgba(168,85,247,0.15)]', text: 'text-purple-400', ring: 'ring-purple-500' },
    'bg-orange-100': { line: 'bg-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20', hoverBorder: 'hover:border-orange-500/40', glow: 'hover:shadow-[0_0_30px_rgba(249,115,22,0.15)]', text: 'text-orange-400', ring: 'ring-orange-500' },
    'bg-pink-100': { line: 'bg-pink-500', bg: 'bg-pink-500/10', border: 'border-pink-500/20', hoverBorder: 'hover:border-pink-500/40', glow: 'hover:shadow-[0_0_30px_rgba(236,72,153,0.15)]', text: 'text-pink-400', ring: 'ring-pink-500' },
    'bg-green-100': { line: 'bg-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', hoverBorder: 'hover:border-emerald-500/40', glow: 'hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]', text: 'text-emerald-400', ring: 'ring-emerald-500' },
    'bg-yellow-100': { line: 'bg-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', hoverBorder: 'hover:border-yellow-500/40', glow: 'hover:shadow-[0_0_30px_rgba(234,179,8,0.15)]', text: 'text-yellow-400', ring: 'ring-yellow-500' },
  };
  return themes[colorCode] || themes['bg-blue-100'];
};

// --- مكون الفوتر الخاص بالبورتفوليو ---
const PortfolioFooter = () => {
  return (
    <footer className="w-full flex flex-col items-center justify-center py-16 mt-16 border-t border-white/5 relative z-10" dir="ltr">
      <a 
        href="https://mahmoud-salah-portfolio.netlify.app" 
        target="_blank" 
        rel="noopener noreferrer" 
        className="text-5xl text-slate-200 hover:text-white transition-all duration-300 mb-6 cursor-pointer flex items-center tracking-tighter hover:scale-105"
        style={{ fontFamily: 'sans-serif' }}
      >
        <img className="h-10" src={logo} alt="Logo" />
      </a>
      <p className="text-[10px] sm:text-xs tracking-[0.3em] text-slate-500 mb-3 uppercase text-center font-medium">
        © 2026 MD Mahmoud Salah
      </p>
      <p className="text-[10px] sm:text-xs tracking-[0.3em] text-slate-500 uppercase text-center font-medium">
        React Frontend Developer
      </p>
    </footer>
  );
};

// --- المكون الرئيسي للتطبيق ---
export default function App() {
  const [tasks, setTasks] = useState<any[]>(() => {
    const saved = localStorage.getItem('sarcastic_tasks');
    return saved ? JSON.parse(saved) : initialTasks;
  });
  
  const [currentView, setCurrentView] = useState('todo'); 
  const [activeTab, setActiveTab] = useState('active'); 
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1024);
  const [expandedMenus, setExpandedMenus] = useState({ teammates: true, todolist: true });
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [taskToDelete, setTaskToDelete] = useState<number | null>(null);
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', startTime: '10:00', endTime: '12:00', color: PASTEL_COLORS[0], tagsInput: '' });
  const [quoteOfTheDay, setQuoteOfTheDay] = useState('');
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    return 'Notification' in window && Notification.permission === 'granted';
  });
  const [notifiedTaskIds, setNotifiedTaskIds] = useState<number[]>(() => {
    const saved = localStorage.getItem('sarcastic_notified_tasks');
    return saved ? JSON.parse(saved) : [];
  });

  const currentDate = new Intl.DateTimeFormat('ar-EG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
  const scrollContainerRef = useRef<HTMLDivElement>(null); // مرجع للتحكم في التمرير (Scroll)

  useEffect(() => {
    // حساب رقم اليوم في السنة لاختيار اقتباس يومي ثابت
    const today = new Date();
    const start = new Date(today.getFullYear(), 0, 0);
    const diff = today.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    
    setQuoteOfTheDay(SARCASTIC_QUOTES[dayOfYear % SARCASTIC_QUOTES.length]);
  }, []);

  useEffect(() => {
    localStorage.setItem('sarcastic_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('sarcastic_notified_tasks', JSON.stringify(notifiedTaskIds));
  }, [notifiedTaskIds]);

  useEffect(() => {
    if (!notificationsEnabled) return;

    const checkTasks = () => {
      const now = new Date();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      const currentTimeInMinutes = currentHours * 60 + currentMinutes;

      let newNotifiedIds: number[] = [];

      tasks.forEach(task => {
        if (task.completed || notifiedTaskIds.includes(task.id)) return;

        let start = task.startTime;
        if (!start) {
          const parsed = parseOldTime(task.time);
          start = parsed.start;
        }

        if (start) {
          const [h, m] = start.split(':').map(Number);
          const taskTimeInMinutes = h * 60 + m;
          
          const diff = taskTimeInMinutes - currentTimeInMinutes;
          
          if (diff > 0 && diff <= 15) {
            new Notification('مهمة تقترب! 🚨', {
              body: `المهمة "${task.title}" ستبدأ قريباً. استعد للمعاناة!`,
            });
            newNotifiedIds.push(task.id);
          }
        }
      });

      if (newNotifiedIds.length > 0) {
        setNotifiedTaskIds(prev => [...prev, ...newNotifiedIds]);
      }
    };

    checkTasks();
    const interval = setInterval(checkTasks, 60000);
    return () => clearInterval(interval);
  }, [tasks, notificationsEnabled, notifiedTaskIds]);

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      console.warn('متصفحك لا يدعم الإشعارات.');
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      setNotificationsEnabled(permission === 'granted');
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as Element).closest('.dropdown-container')) setActiveDropdown(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleTaskCompletion = (taskId: number) => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t));
    setActiveDropdown(null);
  };

  const confirmDelete = () => {
    if (taskToDelete) {
      setTasks(tasks.filter(t => t.id !== taskToDelete));
      setTaskToDelete(null);
    }
  };

  const confirmDeleteAllCompleted = () => {
    setTasks(tasks.filter(t => !t.completed));
    setIsDeleteAllModalOpen(false);
  };

  const openAddModal = () => {
    setEditingTask(null);
    setFormData({ title: '', description: '', startTime: '10:00', endTime: '12:00', color: PASTEL_COLORS[tasks.length % PASTEL_COLORS.length], tagsInput: '' });
    setIsAddModalOpen(true);
  };

  const openEditModal = (task: any) => {
    setEditingTask(task);
    
    // معالجة ذكية للوقت لدعم المهام القديمة والجديدة بدون أخطاء
    let start = task.startTime;
    let end = task.endTime;
    if (!start || !end) {
       const parsed = parseOldTime(task.time);
       start = parsed.start;
       end = parsed.end;
    }

    setFormData({ 
      ...task, 
      startTime: start, 
      endTime: end,
      tagsInput: task.tags ? task.tags.join('، ') : ''
    });
    setIsAddModalOpen(true);
    setActiveDropdown(null);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // معالجة التاجز
    const tags = formData.tagsInput
      .split(/[،,]/)
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    const taskData = { ...formData, tags };

    if (editingTask) {
       setTasks(tasks.map(t => t.id === editingTask.id ? { ...t, ...taskData } : t));
    } else {
       setTasks([{ ...taskData, id: Date.now(), completed: false }, ...tasks]);
    }
    setIsAddModalOpen(false);
  };

  const filteredTasks = tasks.filter(task => {
    const matchesTab = activeTab === 'active' ? !task.completed : task.completed;
    const matchesSearch = task.title.includes(searchQuery) || 
                          task.description.includes(searchQuery) || 
                          (task.tags && task.tags.some((tag: string) => tag.includes(searchQuery)));
    return matchesTab && matchesSearch;
  });

  const totalTasks = tasks.length;
  const completedTasksCount = tasks.filter(t => t.completed).length;
  const pendingTasksCount = totalTasks - completedTasksCount;
  const completionPercentage = totalTasks === 0 ? 0 : Math.round((completedTasksCount / totalTasks) * 100);

  // دالة لتوليد عنوان فكاهي بناءً على نسبة الإنجاز
  const getFunnyOverviewTitle = () => {
    if (totalTasks === 0) return 'مفيش كوارث.. اشرب قهوتك ☕';
    if (completionPercentage === 0) return 'بسم الله نبدأ طاحونة النكد ⚙️';
    if (completionPercentage < 50) return 'لسه الغريق بيتعلق بقشاية 🏊♂️';
    if (completionPercentage < 100) return 'هانت يا وحش.. ريحة السرير بتقرب 🛏️';
    return 'الهروب الكبير.. خلصنا الكوارث 🎉';
  };

  return (
    <div dir="rtl" className="flex h-screen bg-black text-slate-200 font-sans overflow-hidden selection:bg-indigo-500/30 selection:text-indigo-200 relative">
      
      {/* خلفية الفضاء بالكود الجديد */}
      <StarfieldBackground />

      {/* --- Sidebar --- */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/70 z-20 lg:hidden backdrop-blur-md transition-opacity" onClick={() => setIsSidebarOpen(false)} />
      )}
      
      <aside className={`
        fixed lg:relative inset-y-0 right-0 z-30 bg-[#0a0a0a]/80 backdrop-blur-2xl border-l border-white/5 transition-all duration-300 ease-in-out flex flex-col shadow-[0_0_40px_rgba(0,0,0,0.8)] lg:shadow-none overflow-hidden shrink-0
        ${isSidebarOpen ? 'w-72 translate-x-0' : 'w-72 translate-x-full lg:w-0 lg:translate-x-0 lg:border-none'}
      `}>
        <div className="w-72 flex flex-col h-full">
          <div className="flex items-center justify-between p-7 relative z-10">
            <div className="flex items-center gap-3 text-indigo-400 font-black text-xl tracking-tight">
              <div className="w-15 p-0.5 h-10 rounded-xl  flex items-center justify-center text-white ">
                <a target="_blank" href="https://mahmoud-salah-portfolio.netlify.app/">
                  <img src={logo} alt="Logo" className="w-full h-full object-contain" />
                </a>
              </div>
              {/* <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                <Sparkles size={18} />
              </div> */}
              {/* مهام الأبطال */}
            </div>
            <button className="lg:hidden text-slate-400 hover:text-white transition-colors bg-white/5 p-2 rounded-full" onClick={() => setIsSidebarOpen(false)}>
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 space-y-2 custom-scrollbar pb-6 relative z-10">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 mt-2 px-2">القائمة الرئيسية</div>
            
            <div 
              className={`flex items-center gap-3 p-3.5 text-sm font-bold rounded-2xl cursor-pointer transition-all duration-200 ${currentView === 'overview' ? 'bg-indigo-500/15 text-indigo-400 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] border border-indigo-500/20' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
              onClick={() => { setCurrentView('overview'); if (window.innerWidth < 1024) setIsSidebarOpen(false); }}
            >
              <PieChart size={20} className={currentView === 'overview' ? 'text-indigo-400' : 'text-slate-500'} />
              <span>لوحة القيادة (Overview)</span>
            </div>

            <div className="pt-2">
              <div 
                className={`flex items-center justify-between p-3.5 rounded-2xl cursor-pointer transition-all duration-200 ${currentView === 'todo' ? 'bg-indigo-500/15 text-indigo-400 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] border border-indigo-500/20' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
                onClick={() => { setCurrentView('todo'); setExpandedMenus({...expandedMenus, todolist: true}); if (window.innerWidth < 1024) setIsSidebarOpen(false); }}
              >
                <div className="flex items-center gap-3 font-bold text-sm">
                  <ListTodo size={20} className={currentView === 'todo' ? 'text-indigo-400' : 'text-slate-500'} />
                  <span>المهام اليومية</span>
                </div>
                <ChevronDown size={16} className={`transform transition-transform ${expandedMenus.todolist ? 'rotate-180' : ''}`} onClick={(e) => { e.stopPropagation(); setExpandedMenus({...expandedMenus, todolist: !expandedMenus.todolist}); }} />
              </div>
              
              <div className={`overflow-hidden transition-all duration-300 ${expandedMenus.todolist ? 'max-h-96 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
                <div className="pl-4 pr-12 py-2 space-y-3 text-sm text-slate-500 border-r-2 border-white/5 mr-7">
                  {tasks.slice(0, 4).map(task => (
                    <div key={task.id} className={`cursor-pointer truncate transition-all duration-200 ${task.completed ? 'line-through opacity-40' : 'hover:text-indigo-400 hover:translate-x-1 font-medium text-slate-400'}`}>
                      {task.title}
                    </div>
                  ))}
                  {tasks.length > 4 && <div className="text-xs font-bold text-slate-600 mt-3 pt-3 border-t border-white/5">... بالإضافة لـ {tasks.length - 4} كوارث أخرى</div>}
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-5 border-t border-white/5 relative z-10">
            <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 cursor-pointer transition-colors">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=1e293b" alt="User" className="w-10 h-10 rounded-full border border-white/10 bg-slate-800" />
              <div>
                <p className="text-sm font-bold text-slate-200">موظف مطحون</p>
                <p className="text-xs text-slate-500 font-medium">ضحية النظام</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* --- Main Content --- */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">
        
        {/* Header */}
        <header className="flex items-center justify-between p-6 lg:px-10 bg-black/20 backdrop-blur-xl border-b border-white/5 z-10">
          <div className="flex items-center gap-4">
            <button className="p-2 -mr-2 text-slate-400 hover:bg-white/5 hover:text-white rounded-xl transition-colors" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              <Menu size={24} />
            </button>
            <h1 className="text-2xl font-extrabold text-white tracking-tight drop-shadow-sm">
              {currentView === 'todo' ? 'قائمة المهام' : getFunnyOverviewTitle()}
            </h1>
          </div>
          
          <div className="flex items-center gap-5">
            <div className="hidden md:flex items-center gap-2 text-slate-300 font-medium text-sm bg-white/5 px-4 py-2 rounded-full border border-white/5">
              <CalendarIcon size={16} className="text-indigo-400" />
              <span>{currentDate}</span>
            </div>
            <SyncPanel tasks={tasks} onRestore={setTasks} />
            <button 
              onClick={requestNotificationPermission}
              className={`p-2 rounded-full transition-colors ${notificationsEnabled ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
              title={notificationsEnabled ? 'الإشعارات مفعلة' : 'تفعيل الإشعارات'}
            >
              <Bell size={20} />
            </button>
          </div>
        </header>

        {currentView === 'todo' && (
          <div className="px-6 lg:px-10 pt-8 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 z-10 relative">
            <div className="relative w-full sm:max-w-md group">
              <input 
                type="text" 
                placeholder="ابحث عن مهمة أو كارثة..." 
                className="w-full pl-12 pr-5 py-3.5 bg-[#111]/80 backdrop-blur-md border border-white/10 rounded-full focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 text-sm font-medium text-white placeholder-slate-500 transition-all shadow-inner"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
            </div>
            
            <button 
              onClick={openAddModal}
              className="w-full sm:w-auto px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full flex items-center justify-center gap-2 font-bold transition-all duration-300 shadow-[0_4px_20px_rgba(79,70,229,0.4)] hover:shadow-[0_6px_25px_rgba(79,70,229,0.6)] active:scale-95 text-sm"
            >
              <Plus size={18} />
              إضافة مهمة جديدة
            </button>
          </div>
        )}

        {/* --- Dynamic View (Overview OR Todo) --- */}
        {currentView === 'overview' ? (
          
          <div ref={scrollContainerRef} className="flex-1 p-6 lg:px-10 overflow-y-auto mt-2 animate-fade-in-up custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <div 
                onClick={() => { setCurrentView('todo'); setExpandedMenus({...expandedMenus, todolist: true}); }}
                className="relative overflow-hidden bg-indigo-900/10 backdrop-blur-xl p-8 rounded-3xl border border-indigo-500/20 shadow-[0_0_30px_rgba(79,70,229,0.05)] cursor-pointer hover:-translate-y-1.5 hover:shadow-[0_0_40px_rgba(79,70,229,0.2)] hover:border-indigo-500/40 transition-all duration-300 group"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 opacity-[0.03] rounded-full -mr-10 -mt-10 transform group-hover:scale-110 transition-transform duration-500"></div>
                <div className="flex items-center gap-5 relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 backdrop-blur-md text-indigo-300 flex items-center justify-center border border-indigo-500/30 shadow-[0_0_15px_rgba(79,70,229,0.4)]"><Activity size={28} /></div>
                  <div><p className="text-indigo-200 text-sm font-medium mb-1">إجمالي المهام</p><h3 className="text-4xl font-black text-white">{totalTasks}</h3></div>
                </div>
              </div>
              
              <div 
                onClick={() => { setActiveTab('completed'); setCurrentView('todo'); setExpandedMenus({...expandedMenus, todolist: true}); }}
                className="relative overflow-hidden bg-emerald-900/10 backdrop-blur-xl p-8 rounded-3xl border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.05)] cursor-pointer hover:-translate-y-1.5 hover:shadow-[0_0_40px_rgba(16,185,129,0.2)] hover:border-emerald-500/40 transition-all duration-300 group"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500 opacity-[0.03] rounded-full -mr-10 -mt-10 transform group-hover:scale-110 transition-transform duration-500"></div>
                <div className="flex items-center gap-5 relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 backdrop-blur-md text-emerald-300 flex items-center justify-center border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.4)]"><Smile size={28} /></div>
                  <div><p className="text-emerald-200 text-sm font-medium mb-1">المهام المكتملة</p><h3 className="text-4xl font-black text-white">{completedTasksCount}</h3></div>
                </div>
              </div>
              
              <div 
                onClick={() => { setActiveTab('active'); setCurrentView('todo'); setExpandedMenus({...expandedMenus, todolist: true}); }}
                className="relative overflow-hidden bg-rose-900/10 backdrop-blur-xl p-8 rounded-3xl border border-rose-500/20 shadow-[0_0_30px_rgba(244,63,94,0.05)] cursor-pointer hover:-translate-y-1.5 hover:shadow-[0_0_40px_rgba(244,63,94,0.2)] hover:border-rose-500/40 transition-all duration-300 group"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500 opacity-[0.03] rounded-full -mr-10 -mt-10 transform group-hover:scale-110 transition-transform duration-500"></div>
                <div className="flex items-center gap-5 relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-rose-500/20 backdrop-blur-md text-rose-300 flex items-center justify-center border border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.4)]"><Frown size={28} /></div>
                  <div><p className="text-rose-200 text-sm font-medium mb-1">المهام المتبقية</p><h3 className="text-4xl font-black text-white">{pendingTasksCount}</h3></div>
                </div>
              </div>
            </div>

            <div className="bg-[#111]/70 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-2xl mb-8 relative overflow-hidden">
              <div className="flex justify-between items-end mb-6 relative z-10">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">مؤشر الإنجاز والنجاة</h3>
                  <p className="text-slate-400 text-sm font-medium">العملية تقترب من النهاية (أو هكذا نظن).</p>
                </div>
                <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 drop-shadow-[0_0_10px_rgba(129,140,248,0.5)]">{completionPercentage}%</span>
              </div>
              <div className="w-full bg-black/60 h-4 rounded-full overflow-hidden relative z-10 border border-white/5">
                <div className="h-full rounded-full transition-all duration-1000 ease-out bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 relative shadow-[0_0_15px_rgba(168,85,247,0.6)]" style={{ width: `${completionPercentage}%` }}>
                  <div className="absolute top-0 left-0 right-0 bottom-0 bg-white/20 w-full animate-shimmer"></div>
                </div>
              </div>
            </div>

            <div className="bg-indigo-900/20 backdrop-blur-md p-6 rounded-2xl border border-indigo-500/20 mb-8 relative overflow-hidden flex items-center gap-4">
              <div className="text-indigo-400 text-4xl opacity-50">"</div>
              <p className="text-indigo-100 text-lg font-medium italic flex-1">{quoteOfTheDay}</p>
              <div className="text-indigo-400 text-4xl opacity-50 rotate-180">"</div>
            </div>

            {/* الفوتر في صفحة النظرة العامة */}
            <PortfolioFooter />
          </div>

        ) : (

          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-6 lg:px-10 mb-2 mt-2 flex justify-between items-center">
              <div className="flex p-1.5 bg-[#1a1a1a]/80 backdrop-blur-md rounded-xl w-max border border-white/5">
                <button onClick={() => setActiveTab('active')} className={`px-6 py-2 rounded-lg font-bold text-sm transition-all duration-300 ${activeTab === 'active' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:text-white'}`}>المهام الحالية</button>
                <button onClick={() => setActiveTab('completed')} className={`px-6 py-2 rounded-lg font-bold text-sm transition-all duration-300 ${activeTab === 'completed' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30' : 'text-slate-400 hover:text-white'}`}>المكتملة بنجاح</button>
              </div>
              
              {completedTasksCount > 0 && activeTab === 'completed' && (
                <button 
                  onClick={() => setIsDeleteAllModalOpen(true)}
                  className="text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-4 py-2 rounded-lg transition-colors flex items-center gap-2 border border-transparent hover:border-rose-500/20"
                >
                  <Trash2 size={14} />
                  حذف كل المكتمل
                </button>
              )}
            </div>

            <div ref={scrollContainerRef} className="flex-1 p-6 lg:px-10 overflow-y-auto custom-scrollbar">
              {filteredTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-5 bg-white/5 rounded-3xl border border-dashed border-white/10 m-4 py-20 backdrop-blur-sm">
                  <div className="w-24 h-24 bg-black/50 rounded-full flex items-center justify-center text-4xl shadow-inner border border-white/5">☕️</div>
                  <h3 className="text-xl font-bold text-slate-300">لا يوجد مهام حالياً!</h3>
                  <p className="text-sm font-medium text-slate-500">الجو رايق وتقدر تشرب قهوتك بسلام.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
                  {filteredTasks.map(task => {
                    const theme = getTheme(task.color);
                    return (
                      <div key={task.id} className={`backdrop-blur-xl border rounded-2xl p-6 transition-all duration-300 relative flex flex-col min-h-[180px] group overflow-hidden ${task.completed ? 'opacity-50 grayscale-[50%] bg-black/40 border-white/5' : `${theme.bg} ${theme.border} ${theme.hoverBorder} hover:-translate-y-1 ${theme.glow}`}`}>
                        
                        <div className={`absolute top-0 right-0 w-1.5 h-full ${theme.line} transition-all duration-300 group-hover:w-2 shadow-[0_0_15px_currentColor] opacity-80 group-hover:opacity-100`}></div>

                        <div className="flex justify-between items-start mb-4 pr-3">
                          <div className="flex items-start gap-3">
                            <button onClick={() => toggleTaskCompletion(task.id)} className={`mt-0.5 transition-transform active:scale-90 ${task.completed ? 'text-emerald-500 drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]' : 'text-slate-400 hover:text-white'}`}>
                              {task.completed ? <CheckSquare size={22} className="fill-emerald-900/50" /> : <Square size={22} />}
                            </button>
                            <h3 className={`font-bold text-white text-base leading-snug ${task.completed ? 'line-through text-slate-500' : ''}`}>{task.title}</h3>
                          </div>
                          
                          <div className="relative dropdown-container">
                            <button onClick={() => setActiveDropdown(activeDropdown === task.id ? null : task.id)} className="text-slate-400 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors">
                              <MoreHorizontal size={18} />
                            </button>
                            
                            {activeDropdown === task.id && (
                              <div className="absolute left-0 mt-2 w-44 bg-slate-800 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.6)] border border-slate-600 z-20 py-1.5 animate-fade-in-up origin-top-left">
                                <button onClick={() => toggleTaskCompletion(task.id)} className="w-full text-right px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-700 flex items-center gap-2.5 transition-colors">
                                  <Check size={16} className={task.completed ? 'text-slate-500' : 'text-emerald-400'} /> {task.completed ? 'إلغاء الإكتمال' : 'تحديد كمنجز'}
                                </button>
                                <button onClick={() => openEditModal(task)} className="w-full text-right px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-700 flex items-center gap-2.5 transition-colors">
                                  <Edit3 size={16} className={theme.text} /> تعديل المهمة
                                </button>
                                <div className="h-px bg-slate-700 my-1 mx-2"></div>
                                <button onClick={() => { setTaskToDelete(task.id); setActiveDropdown(null); }} className="w-full text-right px-4 py-2.5 text-sm font-bold text-rose-400 hover:bg-rose-500/10 flex items-center gap-2.5 transition-colors">
                                  <Trash2 size={16} /> حذف نهائي
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <p className={`text-slate-300 text-sm mb-4 leading-relaxed pr-3 ${task.completed ? 'opacity-60' : ''}`}>
                          {task.description}
                        </p>
                        
                        {task.tags && task.tags.length > 0 && (
                          <div className={`flex flex-wrap gap-2 mb-6 pr-3 ${task.completed ? 'opacity-50' : ''}`}>
                            {task.tags.map((tag: string, index: number) => (
                              <span key={index} className={`px-2 py-1 rounded-md text-[10px] font-bold tracking-wide border ${theme.bg} ${theme.text} ${theme.border} flex items-center gap-1`}>
                                <Tag size={10} />
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        <div className="mt-auto flex items-center gap-2">
                          <div className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 text-xs font-bold tracking-wide border ${task.completed ? 'bg-black/30 text-slate-500 border-white/5' : `${theme.bg} ${theme.text} ${theme.border}`}`}>
                            <Clock size={12} className={task.completed ? 'opacity-50' : theme.text} />
                            {task.startTime && task.endTime ? `${formatTimeAr(task.startTime)} - ${formatTimeAr(task.endTime)}` : (task.time || 'لم يحدد')}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* الفوتر في صفحة لستة المهام */}
              <PortfolioFooter />
            </div>
          </div>
        )}
      </main>

      {/* --- Add/Edit Modal --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
          <div className="bg-[#111] rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] animate-modal-pop border border-white/10">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5 shrink-0">
              <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30"><Edit3 size={16} /></span>
                {editingTask ? 'تعديل المهمة' : 'إضافة كارثة جديدة'}
              </h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 p-2 rounded-full transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleFormSubmit} className="p-7 space-y-5 overflow-y-auto custom-scrollbar flex-1">
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">عنوان المهمة</label>
                <input name="title" type="text" required value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full p-3.5 bg-black/50 border border-white/10 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium text-white placeholder-slate-600 shadow-inner" placeholder="مثال: تسليم المشروع للعميل" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">تفاصيل المعاناة</label>
                <textarea name="description" required rows={3} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full p-3.5 bg-black/50 border border-white/10 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-none transition-all font-medium text-white placeholder-slate-600 shadow-inner" placeholder="اكتب تفاصيل الكارثة هنا..."></textarea>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">الوقت المخصص</label>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <span className="block text-xs text-slate-400 mb-1">من:</span>
                    <input 
                      name="startTime" 
                      type="time" 
                      required 
                      value={formData.startTime} 
                      onChange={(e) => setFormData({...formData, startTime: e.target.value})} 
                      dir="ltr"
                      className="w-full p-3.5 bg-black/50 border border-white/10 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium text-white shadow-inner text-center placeholder-slate-600 [color-scheme:dark]" 
                    />
                  </div>
                  <div className="flex-1">
                    <span className="block text-xs text-slate-400 mb-1">إلى:</span>
                    <input 
                      name="endTime" 
                      type="time" 
                      required 
                      value={formData.endTime} 
                      onChange={(e) => setFormData({...formData, endTime: e.target.value})} 
                      dir="ltr"
                      className="w-full p-3.5 bg-black/50 border border-white/10 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium text-white shadow-inner text-center placeholder-slate-600 [color-scheme:dark]" 
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">التصنيفات (Tags)</label>
                <input 
                  name="tagsInput" 
                  type="text" 
                  value={formData.tagsInput} 
                  onChange={(e) => setFormData({...formData, tagsInput: e.target.value})} 
                  className="w-full p-3.5 bg-black/50 border border-white/10 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium text-white placeholder-slate-600 shadow-inner" 
                  placeholder="مثال: عمل، عاجل، اجتماع (افصل بينها بفاصلة)" 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-3">التصنيف اللوني (الأولوية)</label>
                <div className="flex gap-4">
                  {PASTEL_COLORS.map(color => {
                    const theme = getTheme(color);
                    return (
                      <button 
                        key={color} 
                        type="button" 
                        onClick={() => setFormData({...formData, color})} 
                        className={`w-10 h-10 rounded-full ${theme.line} transition-all duration-200 relative ${formData.color === color ? `ring-4 ring-offset-2 ring-offset-[#111] ${theme.ring} scale-110 shadow-[0_0_15px_currentColor]` : 'hover:scale-110 opacity-70 border border-white/20'}`} 
                      >
                        {formData.color === color && <Check size={16} className="absolute inset-0 m-auto text-white drop-shadow-md" />}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="submit" className="flex-1 bg-indigo-600 text-white py-3.5 rounded-xl hover:bg-indigo-500 font-bold shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all active:scale-95 text-base border border-indigo-500/50">{editingTask ? 'حفظ التغييرات' : 'إضافة للقائمة'}</button>
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 bg-white/5 text-slate-300 py-3.5 rounded-xl hover:bg-white/10 font-bold transition-all active:scale-95 text-base border border-white/5">إلغاء الأمر</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Delete Confirmation Modal --- */}
      {taskToDelete && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
          <div className="bg-[#111] rounded-3xl w-full max-w-sm overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] animate-modal-pop p-8 text-center border border-white/10">
            <div className="w-20 h-20 bg-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner border border-rose-500/30">
              <Trash2 size={40} strokeWidth={1.5} />
            </div>
            <h2 className="text-2xl font-black text-white mb-3">حذف المهمة؟</h2>
            <p className="text-slate-400 mb-8 font-medium leading-relaxed">هل أنت متأكد من رغبتك في حذف هذه المهمة نهائياً؟ لا يمكن التراجع عن هذا الإجراء.</p>
            <div className="flex gap-3">
              <button onClick={confirmDelete} className="flex-1 bg-rose-600 text-white py-3.5 rounded-xl hover:bg-rose-500 font-bold shadow-[0_0_20px_rgba(225,29,72,0.4)] transition-all active:scale-95 border border-rose-500/50">نعم، احذفها</button>
              <button onClick={() => setTaskToDelete(null)} className="flex-1 bg-white/5 text-slate-300 py-3.5 rounded-xl hover:bg-white/10 font-bold transition-all active:scale-95 border border-white/5">تراجع</button>
            </div>
          </div>
        </div>
      )}

      {/* --- Delete All Completed Confirmation Modal --- */}
      {isDeleteAllModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
          <div className="bg-[#111] rounded-3xl w-full max-w-sm overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] animate-modal-pop p-8 text-center border border-white/10">
            <div className="w-20 h-20 bg-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner border border-rose-500/30">
              <Trash2 size={40} strokeWidth={1.5} />
            </div>
            <h2 className="text-2xl font-black text-white mb-3">حذف كل المكتمل؟</h2>
            <p className="text-slate-400 mb-8 font-medium leading-relaxed">هل أنت متأكد من رغبتك في حذف جميع المهام المكتملة نهائياً؟ لا يمكن التراجع عن هذا الإجراء.</p>
            <div className="flex gap-3">
              <button onClick={confirmDeleteAllCompleted} className="flex-1 bg-rose-600 text-white py-3.5 rounded-xl hover:bg-rose-500 font-bold shadow-[0_0_20px_rgba(225,29,72,0.4)] transition-all active:scale-95 border border-rose-500/50">نعم، احذفهم</button>
              <button onClick={() => setIsDeleteAllModalOpen(false)} className="flex-1 bg-white/5 text-slate-300 py-3.5 rounded-xl hover:bg-white/10 font-bold transition-all active:scale-95 border border-white/5">تراجع</button>
            </div>
          </div>
        </div>
      )}

      {/* --- UI Animations --- */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(15px) scale(0.98); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes fade-in {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes modal-pop {
          0% { opacity: 0; transform: scale(0.95) translateY(10px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        
        .animate-fade-in-up { animation: fade-in-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
        .animate-modal-pop { animation: modal-pop 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-shimmer { animation: shimmer 2s infinite linear; transform: translateX(-100%); background-image: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent); }
        
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
      `}} />
    </div>
  );
}
