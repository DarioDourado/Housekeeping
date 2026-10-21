import { useTranslation } from 'react-i18next';
import { useRooms } from '@/hooks/housekeeping';
import { TYPOLOGY_I18N_KEY } from '@/lib/typology';
import { PageEmpty, PageError, PageLoading } from '@/UI/components/feedback/PageStates';
import { OperaStatusBadge } from '@/UI/components/StatusBadges';

// - Quartos são dados do Opera: só leitura (a configuração faz-se nas secções)
export const RoomsTab = () => {
  const { t } = useTranslation();
  const { data: rooms = [], isLoading, isError, refetch } = useRooms();

  if (isLoading) return <PageLoading />;
  if (isError) return <PageError onRetry={() => void refetch()} />;
  if (rooms.length === 0) return <PageEmpty title={t('settings.rooms.empty')} />;

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">{t('settings.rooms.readOnly')}</p>
      <div className="overflow-x-auto rounded-[16px] border border-line bg-surface">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-3">{t('settings.rooms.number')}</th>
              <th className="px-4 py-3">{t('settings.rooms.block')}</th>
              <th className="px-4 py-3">{t('settings.rooms.typology')}</th>
              <th className="px-4 py-3">{t('settings.rooms.status')}</th>
            </tr>
          </thead>
          <tbody>
            {rooms.map(room => (
              <tr key={room.id} className="border-t border-line">
                <td className="px-4 py-2.5 font-semibold tabular-nums text-content">{room.number}</td>
                <td className="px-4 py-2.5 text-muted">{room.block}</td>
                <td className="px-4 py-2.5 text-muted">{t(`credits.typologies.${TYPOLOGY_I18N_KEY[room.typology]}`)}</td>
                <td className="px-4 py-2.5"><OperaStatusBadge status={room.operaStatus} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
