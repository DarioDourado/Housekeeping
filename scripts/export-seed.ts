// - Exporta a pré-definição de demonstração (config/hotelData.ts) para a API carregar como seed de desenvolvimento.
//   Só a configuração base: pessoal, quartos, estadias, secções e equipas. Planos, tarefas e histórico nascem na API
//   (openPlan). Uso: npm run export-seed -- <ficheiro.json>
import { writeFileSync } from 'node:fs';
import { INITIAL_BLOCK_TEAMS, INITIAL_ROOMS, INITIAL_SECTIONS, INITIAL_STAFF, INITIAL_STAYS } from '@/config/hotelData';

const out = process.argv[2];
if (!out) throw new Error('Indicar o ficheiro de saída: npm run export-seed -- ../housekeeping-api/seed/demo.json');

const seed = {
  exportedAt: new Date().toISOString(),
  staff: INITIAL_STAFF,
  rooms: INITIAL_ROOMS,
  stays: INITIAL_STAYS,
  sections: INITIAL_SECTIONS,
  blockTeams: INITIAL_BLOCK_TEAMS
};
writeFileSync(out, `${JSON.stringify(seed, null, 2)}\n`);
console.log(`seed: ${seed.staff.length} pessoas, ${seed.rooms.length} quartos, ${seed.stays.length} estadias, ${seed.sections.length} secções, ${seed.blockTeams.length} equipas → ${out}`);
