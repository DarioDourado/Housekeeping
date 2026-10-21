import { RoomTypology } from '@/types/housekeeping.types';

// - chave i18n (credits.typologies.*) de cada tipologia; fonte única para matriz de créditos e configuração
export const TYPOLOGY_I18N_KEY: Record<RoomTypology, string> = {
  [RoomTypology.STANDARD]: 'standard',
  [RoomTypology.JUNIOR_SUITE]: 'juniorSuite',
  [RoomTypology.SUITE]: 'suite',
  [RoomTypology.VILLA]: 'villa'
};
