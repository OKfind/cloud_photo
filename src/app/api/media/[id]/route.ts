import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Media from '@/lib/models/Media';
import { deleteOSSObject } from '@/lib/oss';

// GET /api/media/[id] - 获取单个媒体详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const media = await Media.findById(id).lean();

    if (!media) {
      return NextResponse.json(
        { success: false, error: '媒体不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: media });
  } catch (error) {
    console.error('获取媒体详情失败:', error);
    return NextResponse.json(
      { success: false, error: '获取媒体详情失败' },
      { status: 500 }
    );
  }
}

// PUT /api/media/[id] - 更新媒体信息（标签、标题等）
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();

    const media = await Media.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    }).lean();

    if (!media) {
      return NextResponse.json(
        { success: false, error: '媒体不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: media });
  } catch (error) {
    console.error('更新媒体信息失败:', error);
    return NextResponse.json(
      { success: false, error: '更新媒体信息失败' },
      { status: 500 }
    );
  }
}

// DELETE /api/media/[id] - 删除媒体（同时删除 OSS 文件）
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const media = await Media.findById(id);

    if (!media) {
      return NextResponse.json(
        { success: false, error: '媒体不存在' },
        { status: 404 }
      );
    }

    // 从 OSS 删除文件
    try {
      await deleteOSSObject(media.ossKey);
    } catch (ossError) {
      console.error('删除 OSS 文件失败:', ossError);
      // 继续删除数据库记录，不阻塞
    }

    await Media.findByIdAndDelete(id);

    return NextResponse.json({ success: true, data: { message: '删除成功' } });
  } catch (error) {
    console.error('删除媒体失败:', error);
    return NextResponse.json(
      { success: false, error: '删除媒体失败' },
      { status: 500 }
    );
  }
}
