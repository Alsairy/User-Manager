import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../hooks/use-auth'
import { apiGet } from '../lib/api'
import Layout from '../components/layout'

interface DashboardStats {
  totalUsers: number
  activeUsers: number
  totalAssets: number
  assetsInReview: number
  totalContracts: number
  activeContracts: number
  totalInvestors: number
  totalIsnadForms: number
  pendingIsnadForms: number
  totalContractValue: number
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => apiGet<DashboardStats>('/api/v1/dashboard/stats'),
  })

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <p className="text-gray-600 mb-8">Welcome back, {user?.fullName}</p>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Users" value={stats?.totalUsers ?? 0} />
          <StatCard title="Active Users" value={stats?.activeUsers ?? 0} />
          <StatCard title="Total Assets" value={stats?.totalAssets ?? 0} />
          <StatCard title="Assets In Review" value={stats?.assetsInReview ?? 0} />
          <StatCard title="Total Contracts" value={stats?.totalContracts ?? 0} />
          <StatCard title="Active Contracts" value={stats?.activeContracts ?? 0} />
          <StatCard title="Total Investors" value={stats?.totalInvestors ?? 0} />
          <StatCard title="Pending ISNAD Forms" value={stats?.pendingIsnadForms ?? 0} />
        </div>
      )}
    </Layout>
  )
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold">{value.toLocaleString()}</p>
    </div>
  )
}
