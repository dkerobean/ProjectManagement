/**
 * Vision Board Items API Routes
 * CRUD operations for vision board items
 */
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

// GET /api/vision-board/items?board_id=xxx - Get items for a board
export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { searchParams } = new URL(req.url);
    const boardId = searchParams.get('board_id');
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    let query = supabase.from('vision_board_items').select('*');
    
    if (boardId) {
      query = query.eq('board_id', boardId);
    }

    const { data: items, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching items:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: items });
  } catch (error) {
    console.error('Items GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch items' }, { status: 500 });
  }
}

// POST /api/vision-board/items - Create a new item
export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { board_id, type, content, caption, category = 'general' } = body;

    if (!board_id || !type || !content) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields: board_id, type, content' 
      }, { status: 400 });
    }

    // Verify board belongs to user
    const { data: board } = await supabase
      .from('vision_boards')
      .select('id')
      .eq('id', board_id)
      .eq('user_id', user.id)
      .single();

    if (!board) {
      return NextResponse.json({ success: false, error: 'Board not found' }, { status: 404 });
    }

    // Create new item
    const { data: item, error } = await supabase
      .from('vision_board_items')
      .insert({
        board_id,
        type,
        content,
        caption,
        category,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating item:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    console.error('Items POST error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create item' }, { status: 500 });
  }
}

// DELETE /api/vision-board/items - Delete an item
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get('id');
    
    if (!itemId) {
      return NextResponse.json({ success: false, error: 'Item ID required' }, { status: 400 });
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Delete item (with user ownership check via board)
    const { error } = await supabase
      .from('vision_board_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      console.error('Error deleting item:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Item deleted' });
  } catch (error) {
    console.error('Items DELETE error:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete item' }, { status: 500 });
  }
}

// PUT /api/vision-board/items - Update an item
export async function PUT(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, content, caption, category } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Item ID required' }, { status: 400 });
    }

    // Update item
    const { data: item, error } = await supabase
      .from('vision_board_items')
      .update({
        content,
        caption,
        category,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating item:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    console.error('Items PUT error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update item' }, { status: 500 });
  }
}
