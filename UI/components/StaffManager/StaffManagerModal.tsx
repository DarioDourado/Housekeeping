'use client';

import { useState } from 'react';
import { useAuth } from '../../../services/hooks/auth/useAuth';
import { User, UserRole } from '../../../types/auth.types';
import {
  X,
  Users,
  Plus,
  Trash2,
  Shield,
  Smartphone,
  Check,
  UserPlus
} from 'lucide-react';

interface StaffManagerModalProps {
  onClose: () => void;
}

export const StaffManagerModal = ({ onClose }: StaffManagerModalProps) => {
  const { users, addUser, deleteUser, switchUser } = useAuth();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<UserRole>(UserRole.HOUSEKEEPER);
  const [newArea, setNewArea] = useState('Bloco A');
  const [isExtra, setIsExtra] = useState(false);
  const [phoneDevice, setPhoneDevice] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    await addUser({
      name: newName.trim(),
      email: `${newName.toLowerCase().replace(/\s+/g, '.')}@vilavitaparc.com`,
      role: newRole,
      assignedArea: newArea,
      isExtra,
      phoneDeviceId: phoneDevice.trim() || undefined
    });

    setNewName('');
    setIsExtra(false);
    setPhoneDevice('');
    setShowAddForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Gestor de Perfis & Equipa de Housekeeping
              </h3>
              <p className="text-xs text-slate-500">
                Gestão interna de nomes: funcionárias fixas, rotativas, extras (Gás Extra) e placeholders.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          
          {/* Add Staff Button / Form */}
          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full py-2.5 px-3 border border-dashed border-blue-300 dark:border-blue-800 rounded-xl text-blue-600 dark:text-blue-400 font-semibold hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-colors flex items-center justify-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>Adicionar Colaborador / Placeholder / Extra</span>
            </button>
          ) : (
            <form onSubmit={handleCreate} className="p-4 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/30 dark:bg-blue-950/20 space-y-3">
              <h4 className="font-bold text-blue-900 dark:text-blue-300">Novo Registo de Pessoal</h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nome Completo ou Placeholder
                  </label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="Ex: Ana Clara ou Extra #3"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Papel (Role)
                  </label>
                  <select
                    value={newRole}
                    onChange={e => setNewRole(e.target.value as UserRole)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value={UserRole.HOUSEKEEPER}>Empregada de Andares</option>
                    <option value={UserRole.SUPERVISOR}>Governanta</option>
                    <option value={UserRole.ADMIN}>Escritório (Chefia)</option>
                    <option value={UserRole.RECEPTION}>Receção</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Área / Bloco Habitual
                  </label>
                  <input
                    type="text"
                    value={newArea}
                    onChange={e => setNewArea(e.target.value)}
                    placeholder="Ex: Bloco A, Vilas, Rotativa"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ID Telemóvel de Serviço (Opcional)
                  </label>
                  <input
                    type="text"
                    value={phoneDevice}
                    onChange={e => setPhoneDevice(e.target.value)}
                    placeholder="Ex: TEL-AREA-08"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isExtraCheck"
                  checked={isExtra}
                  onChange={e => setIsExtra(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600"
                />
                <label htmlFor="isExtraCheck" className="text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                  É funcionária Extra (Gás Extra) ou Placeholder temporário
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                >
                  Guardar Perfil
                </button>
              </div>
            </form>
          )}

          {/* List of existing staff */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
            {users.map(person => (
              <div key={person.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300">
                    {person.name.substring(0, 2).toUpperCase()}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                        {person.name}
                      </span>
                      {person.isExtra && (
                        <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 dark:bg-amber-950 dark:text-amber-300 px-1.5 py-0.5 rounded">
                          Extra
                        </span>
                      )}
                      <span className="text-[10px] font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                        {person.role.toUpperCase()}
                      </span>
                    </div>

                    <div className="text-slate-400 text-[11px] flex items-center gap-2 mt-0.5">
                      <span>Área: {person.assignedArea || 'Geral'}</span>
                      {person.phoneDeviceId && (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-0.5">
                            <Smartphone className="w-3 h-3" />
                            {person.phoneDeviceId}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => switchUser(person.id)}
                    className="px-2.5 py-1 rounded-md text-[11px] font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 border border-blue-200 dark:border-blue-900 transition-colors"
                    title="Alternar sessão para esta pessoa"
                  >
                    Assumir Perfil
                  </button>

                  <button
                    onClick={() => deleteUser(person.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                    title="Remover"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-700 rounded-lg hover:bg-slate-800"
          >
            Concluir
          </button>
        </div>

      </div>
    </div>
  );
};
