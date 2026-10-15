import { createSupabaseBrowserClient } from './client';
import type { Inquiry, InquiryStatus, InquiryType, InquiryDivision } from '../types';

export interface CreateInquiryPayload {
  name: string;
  email: string;
  phone?: string;
  message: string;
  inquiry_type: InquiryType;
  division: InquiryDivision;
  product_id?: string;
  service_id?: string;
}

export function mapInquiryRow(row: any): Inquiry {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    message: row.message,
    inquiryType: row.inquiry_type as InquiryType,
    division: row.division as InquiryDivision,
    productId: row.product_id,
    serviceId: row.service_id,
    productNameSnapshot: row.product_name_snapshot,
    serviceNameSnapshot: row.service_name_snapshot,
    status: row.status as InquiryStatus,
    adminNotes: row.admin_notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
  * Public client function to submit an inquiry through the server API route boundary.
  */
export async function createInquiry(payload: CreateInquiryPayload): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch('/api/inquiries', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'Failed to submit enquiry. Please try again.',
      };
    }

    return {
      success: true,
      message: data.message || 'Enquiry submitted successfully.',
    };
  } catch (err: any) {
    return {
      success: false,
      message: 'Unable to connect to server. Please try again or reach out on WhatsApp.',
    };
  }
}

/**
  * Admin function: Fetch all inquiries (RLS protected by public.is_admin()).
  */
export async function getInquiriesAdmin(): Promise<Inquiry[]> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('inquiries')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapInquiryRow);
}

/**
  * Admin function: Update status and/or admin_notes only.
  */
export async function updateInquiryStatusAdmin(
  id: string,
  updates: { status?: InquiryStatus; admin_notes?: string }
): Promise<Inquiry> {
  const supabase = createSupabaseBrowserClient();

  const payloadToUpdate: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.status !== undefined) {
    payloadToUpdate.status = updates.status;
  }

  if (updates.admin_notes !== undefined) {
    payloadToUpdate.admin_notes = updates.admin_notes;
  }

  const { data, error } = await supabase
    .from('inquiries')
    .update(payloadToUpdate)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return mapInquiryRow(data);
}

/**
  * Admin function: Delete inquiry (RLS protected by public.is_admin()).
  */
export async function deleteInquiryAdmin(id: string): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.from('inquiries').delete().eq('id', id);
  if (error) throw error;
}
