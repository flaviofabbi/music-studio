import React, { useState } from 'react';
import { 
  Shield, 
  Users, 
  Zap, 
  Database, 
  Activity,
  Cpu,
  Globe,
  Lock,
  Key,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function Admin() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(false);

  const ADMIN_PASSWORD = 'flavio_admin_2024'; // Senha definida

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setError(false);
    } else {
      setError(true);
      setPassword('');
    }
  };

  const stats = [
    { label: 'Usuários Ativos', value: '1,284', icon: Users, color: 'text-blue-400' },
    { label: 'Requisições IA/Dia', value: '45.2k', icon: Zap, color: 'text-amber-400' },
    { label: 'Armazenamento', value: '856 GB', icon: Database, color: 'text-emerald-400' },
    { label: 'Latência Média', value: '124ms', icon: Activity, color: 'text-rose-400' },
  ];

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-zinc-900/50 border border-white/10 p-8 rounded-[2.5rem] backdrop-blur-xl"
        >
          <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 mx-auto">
            <Lock className="text-emerald-500" size={32} />
          </div>
          
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Área Restrita</h2>
            <p className="text-zinc-400 text-sm">Insira a chave mestra para acessar o terminal root.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Chave de Acesso"
                className={`w-full bg-black/40 border ${error ? 'border-red-500/50' : 'border-white/10'} rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-emerald-500/50 transition-all`}
                autoFocus
              />
            </div>
            
            {error && (
              <motion.p 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-400 text-xs text-center font-medium"
              >
                Chave incorreta. Acesso negado.
              </motion.p>
            )}

            <button
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-4 rounded-2xl flex items-center justify-center space-x-2 transition-all active:scale-[0.98]"
            >
              <span>Autenticar</span>
              <ChevronRight size={18} />
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2 flex items-center space-x-3">
            <Shield className="text-emerald-500" />
            <span>Painel de Acesso Especial</span>
          </h2>
          <p className="text-zinc-400">Bem-vindo, Flavio. Você tem privilégios de administrador do sistema.</p>
        </div>
        <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center space-x-2">
          <Lock size={14} className="text-emerald-400" />
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Acesso Root Ativo</span>
        </div>
      </header>

      {/* Admin Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            key={stat.label}
            className="bg-zinc-900/50 border border-white/5 p-6 rounded-3xl backdrop-blur-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center ${stat.color}`}>
                <stat.icon size={24} />
              </div>
            </div>
            <p className="text-zinc-500 text-sm font-medium mb-1">{stat.label}</p>
            <h3 className="text-2xl font-bold text-white">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* System Health */}
        <section className="bg-zinc-900/30 border border-white/5 rounded-[2.5rem] p-8">
          <h3 className="text-xl font-bold mb-6 flex items-center space-x-2">
            <Cpu size={20} className="text-emerald-500" />
            <span>Status da Infraestrutura</span>
          </h3>
          <div className="space-y-6">
            {[
              { name: 'Gemini API Cluster', status: 'Operacional', load: 42 },
              { name: 'Firebase Firestore', status: 'Operacional', load: 18 },
              { name: 'Edge Functions', status: 'Operacional', load: 65 },
              { name: 'Media Processing Engine', status: 'Carga Alta', load: 89 },
            ].map((item) => (
              <div key={item.name} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-300 font-medium">{item.name}</span>
                  <span className={item.load > 80 ? 'text-amber-400' : 'text-emerald-400'}>{item.status}</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${item.load}%` }}
                    className={`h-full ${item.load > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Special Actions */}
        <section className="bg-zinc-900/30 border border-white/5 rounded-[2.5rem] p-8">
          <h3 className="text-xl font-bold mb-6 flex items-center space-x-2">
            <Globe size={20} className="text-emerald-500" />
            <span>Ferramentas Avançadas</span>
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <button className="p-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-left transition-all group">
              <h4 className="font-bold text-white mb-1 group-hover:text-emerald-400">Limpar Cache</h4>
              <p className="text-xs text-zinc-500">Reseta o cache global de traduções.</p>
            </button>
            <button className="p-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-left transition-all group">
              <h4 className="font-bold text-white mb-1 group-hover:text-emerald-400">Logs do Sistema</h4>
              <p className="text-xs text-zinc-500">Visualiza logs em tempo real.</p>
            </button>
            <button className="p-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-left transition-all group">
              <h4 className="font-bold text-white mb-1 group-hover:text-emerald-400">Gerenciar API Keys</h4>
              <p className="text-xs text-zinc-500">Rotação de chaves de serviço.</p>
            </button>
            <button className="p-6 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-2xl text-left transition-all group">
              <h4 className="font-bold text-emerald-400 mb-1">Modo God</h4>
              <p className="text-xs text-emerald-400/60">Habilita recursos experimentais.</p>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
