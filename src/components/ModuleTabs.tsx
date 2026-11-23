import React from 'react';
import type { AppModuleId } from '../types';

export interface ModuleTabOption {
  id: AppModuleId;
  label: string;
}

interface ModuleTabsProps {
  tabs: ModuleTabOption[];
  activeId: AppModuleId;
  onChange: (id: AppModuleId) => void;
}

export const ModuleTabs: React.FC<ModuleTabsProps> = ({ tabs, activeId, onChange }) => {
  return (
    <div className="no-print mb-6 bg-white border border-slate-200 rounded-xl p-1.5 inline-flex flex-wrap gap-1">
      {tabs.map((tab) => {
        const isActive = tab.id === activeId;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              isActive
                ? 'bg-[#0F2547] text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};
