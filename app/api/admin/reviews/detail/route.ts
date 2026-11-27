import {
  createAdminReviewServerHandlers,
  handleAdminReviewDetailRequest,
} from '@/lib/review/admin-server';

export async function GET(request: Request) {
  return handleAdminReviewDetailRequest(request, createAdminReviewServerHandlers());
}
