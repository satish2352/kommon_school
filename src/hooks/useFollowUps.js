import { useApiQuery } from './useApiQuery';
import { followupService } from '../services/followupService';

export const useFollowUps = (filters) =>
  useApiQuery(() => followupService.list(filters), [JSON.stringify(filters)]);

export const useFollowUp = (id) =>
  useApiQuery(() => (id ? followupService.get(id) : Promise.resolve(null)), [id]);
