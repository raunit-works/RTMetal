import {
  createAdminReviewServerHandlers,
  handleAdminReviewDeleteRequest,
} from '@/lib/review/admin-server';

export async function POST(request: Request) {
  return handleAdminReviewDeleteRequest(request, createAdminReviewServerHandlers());
}
