export function isReviewUiEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_REVIEW_UI === 'true';
}
