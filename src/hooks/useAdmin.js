import { useApiQuery } from './useApiQuery';
import { adminService } from '../services/adminService';

export const useAdminDashboard = () =>
  useApiQuery(() => adminService.getDashboard(), []);

export const useAdminEnrollments = (filters) =>
  useApiQuery(() => adminService.listEnrollments(filters), [JSON.stringify(filters)]);

export const useAdminPayments = (filters) =>
  useApiQuery(() => adminService.listPayments(filters), [JSON.stringify(filters)]);

export const useAdminFailedPayments = (filters) =>
  useApiQuery(() => adminService.listFailedPayments(filters), [JSON.stringify(filters)]);

export const useAdminExternalApiLogs = (filters) =>
  useApiQuery(() => adminService.listExternalApiLogs(filters), [JSON.stringify(filters)]);

export const useAdminFollowUpReport = (filters) =>
  useApiQuery(() => adminService.getFollowUpReport(filters), [JSON.stringify(filters)]);
