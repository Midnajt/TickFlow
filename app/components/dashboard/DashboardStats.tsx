import { TicketIcon, CheckCircleIcon, LightningIcon } from './icons';

interface DashboardStatsProps {
  openCount: number;
  resolvedCount: number;
  userRole: 'USER' | 'AGENT' | 'ADMIN';
}

interface StatCardConfig {
  label: string;
  value: number | string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBgColor: string;
  iconColor: string;
}

/**
 * Sekcja ze statystykami ticketów
 */
export function DashboardStats({ openCount, resolvedCount, userRole }: DashboardStatsProps) {
  const getRoleDisplay = () => {
    switch (userRole) {
      case 'AGENT':
        return { label: 'Agent', description: 'Możesz zarządzać zgłoszeniami' };
      case 'ADMIN':
        return { label: 'Administrator', description: 'Pełny dostęp do systemu' };
      case 'USER':
      default:
        return { label: 'User', description: 'Możesz tworzyć zgłoszenia' };
    }
  };

  const roleDisplay = getRoleDisplay();

  const statsConfig: StatCardConfig[] = [
    {
      label: 'Otwarte zgłoszenia',
      value: openCount,
      description: 'Czekające na rozwiązanie',
      icon: TicketIcon,
      iconBgColor: 'bg-blue-900',
      iconColor: 'text-blue-400',
    },
    {
      label: 'Rozwiązane',
      value: resolvedCount,
      description: 'Łącznie',
      icon: CheckCircleIcon,
      iconBgColor: 'bg-green-900',
      iconColor: 'text-green-400',
    },
    {
      label: 'Twoja rola',
      value: roleDisplay.label,
      description: roleDisplay.description,
      icon: LightningIcon,
      iconBgColor: userRole === 'ADMIN' ? 'bg-red-900' : 'bg-purple-900',
      iconColor: userRole === 'ADMIN' ? 'text-red-400' : 'text-purple-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {statsConfig.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="bg-gray-800 rounded-xl shadow-md p-6 border border-gray-700 hover:shadow-lg transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${stat.iconBgColor} rounded-lg flex items-center justify-center`}>
                <Icon className={`w-6 h-6 ${stat.iconColor}`} />
              </div>
              <span className="text-3xl font-bold text-white">{stat.value}</span>
            </div>
            <h3 className="text-sm font-medium text-gray-400 mb-1">{stat.label}</h3>
            <p className="text-xs text-gray-500">{stat.description}</p>
          </div>
        );
      })}
    </div>
  );
}

