import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Media from '@/lib/models/Media';

// GET /api/tags - 获取所有标签及其对应的媒体数量
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    // 聚合查询：展开 tags 数组，统计每个标签出现的次数
    const pipeline: unknown[] = [
      { $unwind: '$tags' },
    ];

    if (search) {
      pipeline.push({
        $match: { tags: { $regex: search, $options: 'i' } },
      });
    }

    pipeline.push(
      {
        $group: {
          _id: '$tags',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $project: {
          _id: 0,
          name: '$_id',
          count: 1,
        },
      }
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tags = await Media.aggregate(pipeline as any);

    return NextResponse.json({
      success: true,
      data: tags,
    });
  } catch (error) {
    console.error('获取标签列表失败:', error);
    return NextResponse.json(
      { success: false, error: '获取标签列表失败' },
      { status: 500 }
    );
  }
}
