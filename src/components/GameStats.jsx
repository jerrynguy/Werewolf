import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, Skull, Moon } from 'lucide-react';

const GameStats = ({ gameState }) => {
  if (!gameState?.stats) return null;

  const { stats } = gameState;

  const pieData = [
    { name: 'Dân Làng còn sống', value: stats.villagers, color: '#10b981' },
    { name: 'Người Sói còn sống', value: stats.wolves, color: '#ef4444' },
    { name: 'Dân Làng đã chết', value: stats.deadVillagers, color: '#6b7280' },
    { name: 'Người Sói đã chết', value: stats.deadWolves, color: '#374151' }
  ];

  const barData = [
    { name: 'Dân Làng', alive: stats.villagers, dead: stats.deadVillagers },
    { name: 'Người Sói', alive: stats.wolves, dead: stats.deadWolves }
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-500/10 border border-blue-300/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="text-blue-300" size={20} />
            <span className="text-blue-200 text-sm">Tổng số</span>
          </div>
          <div className="text-white text-3xl font-bold">{stats.total}</div>
        </div>

        <div className="bg-green-500/10 border border-green-300/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="text-green-300" size={20} />
            <span className="text-green-200 text-sm">Còn sống</span>
          </div>
          <div className="text-white text-3xl font-bold">{stats.alive}</div>
        </div>

        <div className="bg-red-500/10 border border-red-300/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Skull className="text-red-300" size={20} />
            <span className="text-red-200 text-sm">Đã chết</span>
          </div>
          <div className="text-white text-3xl font-bold">{stats.dead}</div>
        </div>

        <div className="bg-purple-500/10 border border-purple-300/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Moon className="text-purple-300" size={20} />
            <span className="text-purple-200 text-sm">Số đêm</span>
          </div>
          <div className="text-white text-3xl font-bold">{stats.night}</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-purple-300/20">
          <h3 className="text-white font-semibold mb-4">Thống kê sống/chết</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
              <XAxis dataKey="name" stroke="#e9d5ff" />
              <YAxis stroke="#e9d5ff" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e1b4b', border: '1px solid #7c3aed' }}
                labelStyle={{ color: '#e9d5ff' }}
              />
              <Bar dataKey="alive" fill="#10b981" name="Còn sống" />
              <Bar dataKey="dead" fill="#6b7280" name="Đã chết" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-purple-300/20">
          <h3 className="text-white font-semibold mb-4">Phân bố</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e1b4b', border: '1px solid #7c3aed' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-purple-300/20">
        <h3 className="text-white font-semibold mb-4">Chi tiết</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-green-300 text-sm mb-1">👨‍🌾 Dân còn sống</div>
            <div className="text-white text-2xl font-bold">{stats.villagers}</div>
          </div>
          <div>
            <div className="text-red-300 text-sm mb-1">🐺 Sói còn sống</div>
            <div className="text-white text-2xl font-bold">{stats.wolves}</div>
          </div>
          <div>
            <div className="text-gray-400 text-sm mb-1">💀 Dân đã chết</div>
            <div className="text-white text-2xl font-bold">{stats.deadVillagers}</div>
          </div>
          <div>
            <div className="text-gray-400 text-sm mb-1">💀 Sói đã chết</div>
            <div className="text-white text-2xl font-bold">{stats.deadWolves}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameStats;