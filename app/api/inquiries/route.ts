import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));

    // 1. Sanitize & extract inputs
    const rawName = typeof body.name === 'string' ? body.name.trim() : '';
    const rawEmail = typeof body.email === 'string' ? body.email.trim() : '';
    const rawPhone = typeof body.phone === 'string' ? body.phone.trim() : '';
    const rawMessage = typeof body.message === 'string' ? body.message.trim() : '';
    const rawDivision = typeof body.division === 'string' ? body.division.trim() : 'home_decor';
    const rawType = typeof body.inquiry_type === 'string' ? body.inquiry_type.trim() : 'general';
    const rawProductId = typeof body.product_id === 'string' ? body.product_id.trim() : null;
    const rawServiceId = typeof body.service_id === 'string' ? body.service_id.trim() : null;

    // 2. Server-side Input Validation
    if (!rawName || rawName.length < 2 || rawName.length > 100) {
      return NextResponse.json(
        { success: false, message: 'Please provide a valid name (2 to 100 characters).' },
        { status: 400 }
      );
    }

    if (!rawEmail || !EMAIL_REGEX.test(rawEmail) || rawEmail.length > 255) {
      return NextResponse.json(
        { success: false, message: 'Please provide a valid email address.' },
        { status: 400 }
      );
    }

    if (rawPhone && rawPhone.length > 20) {
      return NextResponse.json(
        { success: false, message: 'Phone number exceeds maximum length.' },
        { status: 400 }
      );
    }

    if (!rawMessage || rawMessage.length < 10 || rawMessage.length > 2000) {
      return NextResponse.json(
        { success: false, message: 'Message must be between 10 and 2000 characters.' },
        { status: 400 }
      );
    }

    if (!['home_decor', 'metal_coating'].includes(rawDivision)) {
      return NextResponse.json(
        { success: false, message: 'Invalid division specified.' },
        { status: 400 }
      );
    }

    if (!['general', 'product', 'service'].includes(rawType)) {
      return NextResponse.json(
        { success: false, message: 'Invalid inquiry type specified.' },
        { status: 400 }
      );
    }

    // Cross-field validation
    if (rawDivision === 'metal_coating' && rawType === 'product') {
      return NextResponse.json(
        { success: false, message: 'Metal Coating division does not support product inquiries.' },
        { status: 400 }
      );
    }

    if (rawDivision === 'home_decor' && rawType === 'service') {
      return NextResponse.json(
        { success: false, message: 'Home Decor division does not support service inquiries.' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient();

    // 3. User Authentication binding
    let userId: string | null = null;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
      }
    } catch {
      // Anonymous user session
      userId = null;
    }

    // 4. Product Lookup & Server Snapshot Generation
    let validProductId: string | null = null;
    let productNameSnapshot: string | null = null;

    if (rawProductId) {
      if (!UUID_REGEX.test(rawProductId)) {
        return NextResponse.json(
          { success: false, message: 'Invalid product ID format.' },
          { status: 400 }
        );
      }

      const { data: product, error: prodErr } = await supabase
        .from('products')
        .select('id, name, is_published')
        .eq('id', rawProductId)
        .maybeSingle();

      if (prodErr || !product || !product.is_published) {
        return NextResponse.json(
          { success: false, message: 'Referenced product not found or unavailable.' },
          { status: 400 }
        );
      }

      validProductId = product.id;
      productNameSnapshot = product.name;
    }

    // 5. Service Lookup & Server Snapshot Generation
    let validServiceId: string | null = null;
    let serviceNameSnapshot: string | null = null;

    if (rawServiceId) {
      if (!UUID_REGEX.test(rawServiceId)) {
        return NextResponse.json(
          { success: false, message: 'Invalid service ID format.' },
          { status: 400 }
        );
      }

      const { data: service, error: svcErr } = await supabase
        .from('services')
        .select('id, name, is_published')
        .eq('id', rawServiceId)
        .maybeSingle();

      if (svcErr || !service || !service.is_published) {
        return NextResponse.json(
          { success: false, message: 'Referenced service not found or unavailable.' },
          { status: 400 }
        );
      }

      validServiceId = service.id;
      serviceNameSnapshot = service.name;
    }

    // 6. Secure Database Insertion (Enforcing forced server values)
    const { error: insertErr } = await supabase.from('inquiries').insert([
      {
        user_id: userId,
        name: rawName,
        email: rawEmail,
        phone: rawPhone || null,
        message: rawMessage,
        inquiry_type: rawType,
        division: rawDivision,
        product_id: validProductId,
        service_id: validServiceId,
        product_name_snapshot: productNameSnapshot,
        service_name_snapshot: serviceNameSnapshot,
        status: 'new',
        admin_notes: null,
      },
    ]);

    if (insertErr) {
      console.error('[API Error] Inquiry insert failed:', insertErr.message);
      return NextResponse.json(
        { success: false, message: 'Unable to submit enquiry at this time. Please try again or reach us via WhatsApp.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Enquiry submitted successfully' },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('[API Exception] Error handling inquiry POST:', err);
    return NextResponse.json(
      { success: false, message: 'An unexpected server error occurred.' },
      { status: 500 }
    );
  }
}
