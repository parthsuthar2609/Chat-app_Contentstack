import { NextResponse } from 'next/server';

/**
 * Receives Contentstack webhooks (publish, unpublish, delete, etc.).
 * Contentstack cannot call localhost directly — use ngrok (see LIVE_PREVIEW.md).
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const event = body?.event || body?.triggered_at ? 'entry.change' : 'unknown';
    const contentType = body?.data?.content_type?.uid || body?.content_type?.uid;
    const entryUid = body?.data?.entry?.uid || body?.entry?.uid;
    const locale = body?.data?.locale || body?.locale;
    const environment = body?.data?.environment?.name || body?.environment;

    console.log('[Contentstack Webhook]', {
      event,
      contentType,
      entryUid,
      locale,
      environment,
      receivedAt: new Date().toISOString(),
    });

    // Optional: verify webhook secret if configured in Contentstack
    const secret = process.env.CONTENTSTACK_WEBHOOK_SECRET;
    const signature = request.headers.get('x-contentstack-signature');
    if (secret && signature && signature !== secret) {
      return NextResponse.json({ error: 'Invalid signature.' }, { status: 401 });
    }

    return NextResponse.json({
      received: true,
      event,
      contentType,
      entryUid,
    });
  } catch (error) {
    console.error('[Contentstack Webhook] Error:', error);
    return NextResponse.json({ error: 'Webhook processing failed.' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Contentstack webhook endpoint is ready. Use POST from Contentstack.',
  });
}
