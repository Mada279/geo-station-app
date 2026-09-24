import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/utils/supabaseClient';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  try {
    // 1. Fetch banner target link
    const { data: banner, error } = await supabase
      .from('ad_banners')
      .select('id, target_link, clicks')
      .eq('id', id)
      .maybeSingle();

    if (error || !banner || !banner.target_link) {
      console.warn('[AdClickAPI] Banner not found or missing target_link for id:', id);
      return NextResponse.redirect(new URL('/', request.url));
    }

    // 2. Increment clicks counter (atomic RPC or fallback update)
    try {
      const { error: rpcError } = await supabase.rpc('increment_ad_clicks', {
        banner_id: id,
      });

      if (rpcError) {
        // Fallback update
        await supabase
          .from('ad_banners')
          .update({
            clicks: (banner.clicks || 0) + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id);
      }
    } catch (countErr) {
      console.error('[AdClickAPI] Failed to increment clicks:', countErr);
    }

    // 3. Ensure target link has proper protocol for external URLs
    let destination = banner.target_link.trim();
    if (!destination.startsWith('http://') && !destination.startsWith('https://') && !destination.startsWith('/')) {
      destination = `https://${destination}`;
    }

    // If internal relative path
    if (destination.startsWith('/')) {
      return NextResponse.redirect(new URL(destination, request.url));
    }

    // External URL redirect
    return NextResponse.redirect(new URL(destination));
  } catch (err) {
    console.error('[AdClickAPI] Error processing ad click:', err);
    return NextResponse.redirect(new URL('/', request.url));
  }
}
