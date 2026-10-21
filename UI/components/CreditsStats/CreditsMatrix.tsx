import { useTranslation } from 'react-i18next';
import { BarChart3 } from 'lucide-react';
import { CREDIT_TABLE, MINUTES_PER_CREDIT, REFRESH_CREDITS } from '@/config/constants';
import { TYPOLOGY_I18N_KEY } from '@/lib/typology';
import { RoomTypology } from '@/types/housekeeping.types';

const TYPOLOGY_ROWS = Object.values(RoomTypology);

// - Matriz tipologia × serviço, lida de CREDIT_TABLE (valores ilustrativos da reunião; tabela oficial por aprovar)
export const CreditsMatrix = () => {
  const { t } = useTranslation();

  // - singular até 1 crédito (0,5 e 1), plural acima
  const label = (value: number) => t('credits.amount', {
    count: value <= 1 ? 1 : 2,
    value: value.toFixed(1),
    minutes: Math.round(value * MINUTES_PER_CREDIT)
  });

  return (
    <div className="space-y-2">
      <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
        <BarChart3 className="w-4 h-4 text-purple-600" />
        {t('credits.matrixTitle')}
      </h4>
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-100 dark:bg-slate-800 font-semibold text-slate-600 dark:text-slate-300">
            <tr>
              <th className="p-2.5">{t('credits.columns.typology')}</th>
              <th className="p-2.5">{t('credits.columns.stayover')}</th>
              <th className="p-2.5">{t('credits.columns.departure')}</th>
              <th className="p-2.5">{t('credits.columns.refresh')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {TYPOLOGY_ROWS.map(typology => (
              <tr key={typology}>
                <td className="p-2.5 font-medium">{t(`credits.typologies.${TYPOLOGY_I18N_KEY[typology]}`)}</td>
                <td className="p-2.5 tabular-nums">{label(CREDIT_TABLE[typology].stayover)}</td>
                <td className="p-2.5 tabular-nums font-semibold text-rose-600">{label(CREDIT_TABLE[typology].departure)}</td>
                <td className="p-2.5 tabular-nums text-purple-600">{label(REFRESH_CREDITS)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
