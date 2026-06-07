import { NextResponse } from 'next/server';
import { checkForUpdates, performUpdate, getCurrentVersion } from '@/lib/updater';
import { isManagerAuthenticated } from '@/lib/auth';

// Check for updates
export async function GET() {
    try {
        const updateInfo = await checkForUpdates();
        const currentInfo = getCurrentVersion();

        return NextResponse.json({
            ...updateInfo,
            currentInfo,
            timestamp: Date.now()
        });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to check updates' },
            { status: 500 }
        );
    }
}

// Perform update
export async function POST(request: Request) {
    try {
        // Verify authentication (signed session). This endpoint runs
        // git fetch/reset + npm install, so it must be tightly guarded.
        if (!(await isManagerAuthenticated())) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json().catch(() => ({}));
        const { confirm } = body;

        if (!confirm) {
            return NextResponse.json(
                { error: 'Update must be confirmed', requireConfirmation: true },
                { status: 400 }
            );
        }

        const result = await performUpdate();

        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Update failed'
            },
            { status: 500 }
        );
    }
}
