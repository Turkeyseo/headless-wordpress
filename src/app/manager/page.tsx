import { redirect } from 'next/navigation';
import { isManagerAuthenticated } from '@/lib/auth';
import DashboardClient from './DashboardClient';

export const dynamic = 'force-dynamic';

export default async function ManagerPage() {
    // Verifies the signed session token (open only when no admin is configured yet).
    if (!(await isManagerAuthenticated())) {
        redirect('/manager/login');
    }

    return <DashboardClient />;
}
