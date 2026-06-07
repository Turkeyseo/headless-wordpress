import { NextResponse } from 'next/server';
import { revalidateContent } from '@/lib/actions';

// Revalidation webhook for WordPress
// Call this endpoint from WordPress when content is updated
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { secret, path } = body;

        // If REVALIDATION_SECRET is configured, require it. (Left optional so
        // existing setups keep working; set the env var to lock this down.)
        const expectedSecret = process.env.REVALIDATION_SECRET;
        if (expectedSecret && secret !== expectedSecret) {
            return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
        }

        await revalidateContent(path);

        return NextResponse.json({
            revalidated: true,
            now: Date.now(),
            message: `Revalidated ${path || 'all paths'}`
        });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Revalidation failed' },
            { status: 500 }
        );
    }
}

// Health check
export async function GET() {
    return NextResponse.json({
        status: 'ok',
        timestamp: Date.now(),
        message: 'Revalidation endpoint is active'
    });
}
