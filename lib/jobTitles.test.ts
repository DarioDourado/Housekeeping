import { describe, expect, it } from 'vitest';
import { isFloorManager, isGovernanta } from '@/lib/jobTitles';
import { JobTitle } from '@/types/auth.types';

describe('jobTitles', () => {
  it('uma pessoa pode ser governanta, responsável de andares ou as duas', () => {
    expect([isGovernanta({}), isFloorManager({})]).toEqual([false, false]);
    expect([isGovernanta({ jobTitles: [JobTitle.GOVERNANTA] }), isFloorManager({ jobTitles: [JobTitle.GOVERNANTA] })]).toEqual([true, false]);
    expect([isGovernanta({ jobTitles: [JobTitle.GOVERNANTA, JobTitle.FLOOR_MANAGER] }), isFloorManager({ jobTitles: [JobTitle.GOVERNANTA, JobTitle.FLOOR_MANAGER] })]).toEqual([true, true]);
  });
});
