/**
 * Integration Service
 * Client-side service for managing integrations
 */
import axios from 'axios';
import { IntegrationFormData } from '@/app/(DashboardLayout)/integrations/components/IntegrationFormDialog';
import { decryptResponse } from '@/lib/utils/responseEncryption';

export interface Integration {
  _id?: string;
  accountName: string;
  username: string;
  region: string;
}

/**
 * Validate integration credentials with eMAG API
 * @param data Integration form data with optional integrationId for existing integrations
 * @returns Promise with validation result
 */
export async function validateIntegration(data: IntegrationFormData & { integrationId?: string }): Promise<{ 
  success: boolean; 
  error?: string 
}> {
  try {
    // Only send password if it's provided
    const payload = {
      username: data.username,
      region: data.region,
      integrationId: data.integrationId,
      accountName: data.accountName
    };

    // Only add password to payload if it's provided, and encode it
    if (data.password) {
      Object.assign(payload, { 
        password: Buffer.from(data.password).toString('base64')
      });
    }
    
    const response = await axios.post('/api/integrations/validate', payload);
    
    return {
      success: response.data.success,
      error: response.data.error
    };
  } catch (error: any) {
    console.error('Error validating integration:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to validate integration'
    };
  }
}

/**
 * Create a new integration
 * @param data Integration form data
 * @returns Promise with the created integration
 */
export async function createIntegration(data: IntegrationFormData): Promise<{
  success: boolean;
  integration?: Integration;
  error?: string;
}> {
  try {
    // Encode password before sending
    const payload = {
      ...data,
      password: data.password ? Buffer.from(data.password).toString('base64') : undefined
    };
    
    const response = await axios.post('/api/integrations', payload);
    
    return {
      success: response.data.success,
      integration: response.data.integration
    };
  } catch (error: any) {
    console.error('Error creating integration:', error);
    const errorMessage = error.response?.data?.error || error.message || 'Failed to create integration';
    
    // Throw the error so it can be caught by the form dialog
    throw new Error(errorMessage);
  }
}

/**
 * Update an existing integration
 * @param id Integration ID
 * @param data Integration form data
 * @returns Promise with the updated integration
 */
export async function updateIntegration(id: string, data: IntegrationFormData): Promise<{
  success: boolean;
  integration?: Integration;
  error?: string;
}> {
  try {
    // Encode password before sending if provided
    const payload = {
      _id: id,
      ...data,
      password: data.password ? Buffer.from(data.password).toString('base64') : undefined
    };
    
    const response = await axios.put('/api/integrations', payload);
    
    return {
      success: response.data.success,
      integration: response.data.integration
    };
  } catch (error: any) {
    console.error('Error updating integration:', error);
    const errorMessage = error.response?.data?.error || error.message || 'Failed to update integration';
    
    // Throw the error so it can be caught by the form dialog
    throw new Error(errorMessage);
  }
}

/**
 * Delete an integration
 * @param id Integration ID
 * @returns Promise with the deletion result
 */
export async function deleteIntegration(id: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const response = await axios.delete(`/api/integrations?id=${id}`);
    
    return {
      success: response.data.success
    };
  } catch (error: any) {
    console.error('Error deleting integration:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to delete integration'
    };
  }
}

/**
 * Get all integrations
 * @returns Promise with the list of integrations
 */
export async function getIntegrations(): Promise<{
  success: boolean;
  integrations?: Integration[];
  error?: string;
}> {
  try {
    const response = await axios.get('/api/integrations');
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Failed to fetch integrations');
    }

    // Decrypt the response data
    const decryptedData = JSON.parse(decryptResponse(response.data.data.integrations));
    
    return {
      success: true,
      integrations: decryptedData
    };
  } catch (error: any) {
    console.error('Error fetching integrations:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to fetch integrations'
    };
  }
}

export default {
  validateIntegration,
  createIntegration,
  updateIntegration,
  deleteIntegration,
  getIntegrations
}; 