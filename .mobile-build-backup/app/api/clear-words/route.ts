import { NextRequest, NextResponse } from 'next/server';
import { clearUserWordHistory } from '@/lib/word-generator';

/**
 * API Route to clear user's word history
 * 
 * Usage: POST /api/clear-words
 * Body: { userId: "user_id_here" }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;
    
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'userId is required' },
        { status: 400 }
      );
    }
    
    const result = await clearUserWordHistory(userId);
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[clear-words] Error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
