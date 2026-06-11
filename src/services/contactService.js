/**
 * contactService.js
 *
 * Public "Send Us a Message" submission. No auth required.
 */
import { api } from './apiClient';

export const contactService = {
  /**
   * Submit a contact enquiry.
   * @param {{ name: string, email: string, phone: string, message: string }} body
   */
  submit: (body) => api.post('/contact', body),
};
