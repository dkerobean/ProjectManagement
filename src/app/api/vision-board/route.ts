/**
 * Vision Board API Routes
 * CRUD operations for vision boards
 */
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

// GET /api/vision-board - Get user's vision boards
export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's vision boards with items
    const { data: boards, error } = await supabase
      .from('vision_boards')
      .select(`
        *,
        vision_board_items (*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching vision boards:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: boards });
  } catch (error) {
    console.error('Vision board GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch vision boards' }, { status: 500 });
  }
}

// POST /api/vision-board - Create a new vision board
export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name = 'My Vision Board', description } = body;

    // Create new vision board
    const { data: board, error } = await supabase
      .from('vision_boards')
      .insert({
        user_id: user.id,
        name,
        description,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating vision board:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: board });
  } catch (error) {
    console.error('Vision board POST error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create vision board' }, { status: 500 });
  }
}
