import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory state (in production, use Redis or database)
let webhookPaused = false;
let pauseReason = '';

export async function POST(request: NextRequest) {
  try {
    const { action, reason } = await request.json();
    
    if (action === 'pause') {
      webhookPaused = true;
      pauseReason = reason || 'Manual pause';
      console.log(`🛑 Webhook PAUSED: ${pauseReason}`);
    } else if (action === 'resume') {
      webhookPaused = false;
      pauseReason = '';
      console.log(`▶️ Webhook RESUMED`);
    }
    
    return NextResponse.json({ 
      success: true, 
      paused: webhookPaused,
      reason: pauseReason 
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update webhook status' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    paused: webhookPaused,
    reason: pauseReason 
  });
}

// Export the pause state for use in webhook route
export { webhookPaused, pauseReason };