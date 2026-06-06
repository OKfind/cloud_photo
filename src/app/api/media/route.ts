import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Media from '@/lib/models/Media';

// GET /api/media - 获取媒体列表，支持分页和标签搜索
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const tag = searchParams.get('tag');
    const search = searchParams.get('search');
    const type = searchParams.get('type'); // 'image' | 'video'

    const skip = (page - 1) * limit;

    // 构建查询条件
    const query: Record<string, unknown> = {};

    if (tag) {
      query.tags = tag;
    }

    if (type && (type === 'image' || type === 'video')) {
      query.type = type;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ];
    }

    const [mediaList, total] = await Promise.all([
      Media.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Media.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items: mediaList,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('获取媒体列表失败:', error);
    return NextResponse.json(
      { success: false, error: '获取媒体列表失败' },
      { status: 500 }
    );
  }
}

// POST /api/media - 创建新媒体记录（上传完成后调用）
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { title, description, type, url, thumbnailUrl, ossKey, tags, size, width, height, duration } = body;

    if (!title || !type || !url || !ossKey || size === undefined) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数: title, type, url, ossKey, size' },
        { status: 400 }
      );
    }

    if (!['image', 'video'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'type 必须为 image 或 video' },
        { status: 400 }
      );
    }

    const media = await Media.create({
      title,
      description: description || '',
      type,
      url,
      thumbnailUrl: thumbnailUrl || url,
      ossKey,
      tags: tags || [],
      size,
      width: width || 0,
      height: height || 0,
      duration: duration || 0,
    });

    return NextResponse.json({ success: true, data: media }, { status: 201 });
  } catch (error) {
    console.error('创建媒体记录失败:', error);
    return NextResponse.json(
      { success: false, error: '创建媒体记录失败' },
      { status: 500 }
    );
  }
}
