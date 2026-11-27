import { expect, test } from '@playwright/test';
import sharp from 'sharp';
import { validateReviewInput } from '@/lib/review/validation';
import {
  computeReviewPayloadHash,
  hashReviewPhoto,
  parseBoundedMultipart,
  parseReviewPagination,
  parseReviewPhotos,
  RequestTooLargeError,
} from '@/lib/review/validation';
import {
  checkRateLimit,
  getClientIdentifier,
  RATE_LIMITS,
  type RateLimitDatabase,
} from '@/lib/review/rate-limit';
import { processReviewPhoto } from '@/lib/review/image-processing';
import {
  handleReviewFetch,
  handleReviewSubmission,
  POST,
  type ReviewFetchDependencies,
  type ReviewRouteDependencies,
} from '@/lib/review/handlers';
import { isReviewUiEnabled } from '@/lib/review/ui-feature';
import {
  reconcileReviewSubmission,
  ReviewSubmissionOutcomeUnknownError,
  type CreateReviewResult,
} from '@/lib/review/data-access';

const VALID_PRODUCT_ID = '550e8400-e29b-41d4-a716-446655440000';
const VALID_SUBMISSION_KEY = 'BjDCQWXdwP2dF5gyoyvzkPAz58s6IYsHbLBAKfh5zYo';
const SERVER_USER_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const REVIEW_ID = '11111111-1111-4111-8111-111111111111';

function makeFile(name: string, type = 'image/jpeg'): File {
  return new File([new Uint8Array([1, 2, 3])], name, { type });
}

function makeReviewForm(options: { includePhoto?: boolean } = {}): FormData {
  const form = new FormData();
  form.set('productId', VALID_PRODUCT_ID);
  form.set('rating', '5');
  form.set('content', 'This is a great product. I love it!');
  form.set('customerName', '');
  form.set('submissionKey', VALID_SUBMISSION_KEY);
  form.set('website', '');
  form.set('userId', 'client-supplied-user-id');
  if (options.includePhoto) {
    form.append('photo0', makeFile('photo.jpg'));
  }
  return form;
}

test.describe('review input validation', () => {
  const baseInput = {
    productId: VALID_PRODUCT_ID,
    rating: 5,
    content: 'This is a great product. I love it!',
    customerName: '',
    submissionKey: VALID_SUBMISSION_KEY,
    website: '',
  };

  test('valid guest review passes validation', () => {
    const result = validateReviewInput(baseInput);
    expect(result.errors).toHaveLength(0);
    expect(result.data).not.toBeNull();
    expect(result.data?.productId).toBe(VALID_PRODUCT_ID);
    expect(result.data?.rating).toBe(5);
    expect(result.data?.content).toBe('This is a great product. I love it!');
    expect(result.data?.customerName).toBeNull();
  });

  test('valid review with customer name passes', () => {
    const result = validateReviewInput({ ...baseInput, customerName: 'Jane Doe' });
    expect(result.errors).toHaveLength(0);
    expect(result.data?.customerName).toBe('Jane Doe');
  });

  test('missing product ID is rejected', () => {
    const result = validateReviewInput({ ...baseInput, productId: '' });
    expect(result.errors).toContainEqual(
      expect.objectContaining({ field: 'productId', message: 'Product ID is required.' })
    );
  });

  test('invalid product ID format is rejected', () => {
    const result = validateReviewInput({ ...baseInput, productId: 'not-a-uuid' });
    expect(result.errors).toContainEqual(
      expect.objectContaining({ field: 'productId', message: 'Invalid product ID format.' })
    );
  });

  test('rating below 1 is rejected', () => {
    const result = validateReviewInput({ ...baseInput, rating: 0 });
    expect(result.errors).toContainEqual(
      expect.objectContaining({ field: 'rating', message: 'Rating must be an integer between 1 and 5.' })
    );
  });

  test('rating above 5 is rejected', () => {
    const result = validateReviewInput({ ...baseInput, rating: 6 });
    expect(result.errors).toContainEqual(
      expect.objectContaining({ field: 'rating', message: 'Rating must be an integer between 1 and 5.' })
    );
  });

  test('non-integer rating is rejected', () => {
    const result = validateReviewInput({ ...baseInput, rating: 3.5 });
    expect(result.errors).toContainEqual(
      expect.objectContaining({ field: 'rating', message: 'Rating must be an integer between 1 and 5.' })
    );
  });

  test('empty review content is rejected', () => {
    const result = validateReviewInput({ ...baseInput, content: '' });
    expect(result.errors).toContainEqual(
      expect.objectContaining({ field: 'content', message: 'Review content is required.' })
    );
  });

  test('content shorter than 10 characters is rejected', () => {
    const result = validateReviewInput({ ...baseInput, content: 'Too short' });
    expect(result.errors).toContainEqual(
      expect.objectContaining({ field: 'content', message: 'Review must be at least 10 characters.' })
    );
  });

  test('content longer than 2000 characters is rejected', () => {
    const result = validateReviewInput({ ...baseInput, content: 'a'.repeat(2001) });
    expect(result.errors).toContainEqual(
      expect.objectContaining({ field: 'content', message: 'Review must not exceed 2000 characters.' })
    );
  });

  test('content with fewer than 10 emoji code points is rejected', () => {
    const result = validateReviewInput({ ...baseInput, content: '🎉'.repeat(9) });
    expect(result.errors).toContainEqual(
      expect.objectContaining({ field: 'content', message: 'Review must be at least 10 characters.' })
    );
  });

  test('emoji content is counted correctly by code points', () => {
    const emojiContent = 'Great product! 🎉🎉🎉🎉🎉';
    const result = validateReviewInput({ ...baseInput, content: emojiContent });
    expect(result.errors).toEqual([]);
    expect(result.data?.content).toBe(emojiContent);
  });

  test('content with exactly 2000 code points passes', () => {
    const exactly2000 = 'x'.repeat(2000);
    const result = validateReviewInput({ ...baseInput, content: exactly2000 });
    expect(result.errors).toEqual([]);
    expect(result.data?.content).toBe(exactly2000);
  });

  test('content with control characters is rejected', () => {
    const result = validateReviewInput({ ...baseInput, content: 'Great product\x01 here.' });
    expect(result.errors).toContainEqual(
      expect.objectContaining({ field: 'content', message: 'Review contains invalid characters.' })
    );
  });

  test('customer name longer than 80 characters is rejected', () => {
    const result = validateReviewInput({ ...baseInput, customerName: 'a'.repeat(81) });
    expect(result.errors).toContainEqual(
      expect.objectContaining({ field: 'customerName', message: 'Name must be between 2 and 80 characters.' })
    );
  });

  test('one-character customer name is rejected', () => {
    const result = validateReviewInput({ ...baseInput, customerName: 'A' });
    expect(result.errors).toContainEqual(
      expect.objectContaining({ field: 'customerName', message: 'Name must be between 2 and 80 characters.' })
    );
  });

  test('customer name with 40 emoji code points passes', () => {
    const result = validateReviewInput({ ...baseInput, customerName: '😀'.repeat(40) });
    expect(result.errors).toEqual([]);
    expect(result.data?.customerName).toBe('😀'.repeat(40));
  });

  test('customer name with 81 emoji code points is rejected', () => {
    const result = validateReviewInput({ ...baseInput, customerName: '😀'.repeat(81) });
    expect(result.errors).toContainEqual(
      expect.objectContaining({ field: 'customerName', message: 'Name must be between 2 and 80 characters.' })
    );
  });

  test('customer name with control characters is rejected', () => {
    const result = validateReviewInput({ ...baseInput, customerName: 'John\x01Doe' });
    expect(result.errors).toContainEqual(
      expect.objectContaining({ field: 'customerName', message: 'Name contains invalid characters.' })
    );
  });

  test('empty customer name becomes null', () => {
    const result = validateReviewInput({ ...baseInput, customerName: '' });
    expect(result.errors).toEqual([]);
    expect(result.data?.customerName).toBeNull();
  });

  test('missing submission key is rejected', () => {
    const result = validateReviewInput({ ...baseInput, submissionKey: '' });
    expect(result.errors).toContainEqual(
      expect.objectContaining({ field: 'submissionKey', message: 'Submission key is required.' })
    );
  });

  test('low-entropy submission keys are rejected', () => {
    const result = validateReviewInput({ ...baseInput, submissionKey: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' });
    expect(result.errors).toContainEqual(
      expect.objectContaining({ field: 'submissionKey', message: 'Submission key must be a high-entropy value.' })
    );
  });

  test('UUID-shaped strings alone are rejected as submission keys', () => {
    const result = validateReviewInput({
      ...baseInput,
      submissionKey: '01234567-89aa-4012-8567-890123456789',
    });
    expect(result.errors).toContainEqual(
      expect.objectContaining({ field: 'submissionKey', message: 'Submission key must be a high-entropy value.' })
    );
  });

  test('populated honeypot is rejected', () => {
    const result = validateReviewInput({ ...baseInput, website: 'http://spam.com' });
    expect(result.errors).toContainEqual(
      expect.objectContaining({ field: 'website', message: 'Invalid submission.' })
    );
  });

  test('client-supplied userId is not part of validated output', () => {
    const inputWithUserId = { ...baseInput, userId: 'some-client-supplied-uuid' };
    const result = validateReviewInput(inputWithUserId);
    expect(result.errors).toEqual([]);
    expect(result.data).not.toHaveProperty('userId');
  });

  test('payload hash includes ordered image-content fingerprints', () => {
    const first = hashReviewPhoto(Buffer.from('first-photo'));
    const second = hashReviewPhoto(Buffer.from('second-photo'));
    const payload = {
      productId: VALID_PRODUCT_ID,
      userId: SERVER_USER_ID,
      customerName: null,
      rating: 5,
      content: 'This is a great product. I love it!',
      imageFingerprints: [first, second],
    };

    const original = computeReviewPayloadHash(payload);
    expect(original).toMatch(/^[0-9a-f]{64}$/);
    expect(computeReviewPayloadHash({
      ...payload,
      imageFingerprints: [second, first],
    })).not.toBe(original);
    expect(computeReviewPayloadHash({
      ...payload,
      imageFingerprints: [hashReviewPhoto(Buffer.from('changed-photo')), second],
    })).not.toBe(original);
  });

  test('rating exactly 1 passes', () => {
    const result = validateReviewInput({ ...baseInput, rating: 1 });
    expect(result.errors).toEqual([]);
    expect(result.data?.rating).toBe(1);
  });

  test('rating exactly 5 passes', () => {
    const result = validateReviewInput({ ...baseInput, rating: 5 });
    expect(result.errors).toEqual([]);
    expect(result.data?.rating).toBe(5);
  });

  test('whitespace-only content is rejected', () => {
    const result = validateReviewInput({ ...baseInput, content: '   \n\t   ' });
    expect(result.errors).toContainEqual(
      expect.objectContaining({ field: 'content', message: 'Review content is required.' })
    );
  });
});

test.describe('review pagination validation', () => {
  test('missing pagination uses documented defaults', () => {
    expect(parseReviewPagination(new URLSearchParams())).toEqual({ limit: 20, offset: 0 });
  });

  test('valid boundary values are accepted', () => {
    const params = new URLSearchParams({ limit: '1', offset: '10000' });
    expect(parseReviewPagination(params)).toEqual({ limit: 1, offset: 10000 });
  });

  test('decimal and non-numeric values are rejected', () => {
    expect(() => parseReviewPagination(new URLSearchParams({ limit: '1.5' }))).toThrow('Invalid limit parameter.');
    expect(() => parseReviewPagination(new URLSearchParams({ offset: 'abc' }))).toThrow('Invalid offset parameter.');
  });

  test('negative and excessively large values are rejected', () => {
    expect(() => parseReviewPagination(new URLSearchParams({ limit: '0' }))).toThrow('Invalid limit parameter.');
    expect(() => parseReviewPagination(new URLSearchParams({ limit: '21' }))).toThrow('Invalid limit parameter.');
    expect(() => parseReviewPagination(new URLSearchParams({ offset: '-1' }))).toThrow('Invalid offset parameter.');
    expect(() => parseReviewPagination(new URLSearchParams({ offset: '10001' }))).toThrow('Invalid offset parameter.');
    expect(() => parseReviewPagination(new URLSearchParams({ offset: '99999999999999999999' }))).toThrow('Invalid offset parameter.');
  });
});

test.describe('review multipart validation', () => {
  test('no photos, one photo and three photos are accepted', () => {
    expect(parseReviewPhotos(new FormData())).toHaveLength(0);

    const one = new FormData();
    one.append('photo0', makeFile('one.jpg'));
    expect(parseReviewPhotos(one)).toHaveLength(1);

    const three = new FormData();
    three.append('photo0', makeFile('one.jpg'));
    three.append('photo1', makeFile('two.png'));
    three.append('photo2', makeFile('three.webp'));
    expect(parseReviewPhotos(three)).toHaveLength(3);
  });

  test('unexpected photo field names are rejected', () => {
    const form = new FormData();
    form.append('photo3', makeFile('extra.jpg'));
    expect(() => parseReviewPhotos(form)).toThrow('Unexpected photo field.');
  });

  test('repeated photo fields cannot bypass the maximum', () => {
    const form = new FormData();
    form.append('photo0', makeFile('one.jpg'));
    form.append('photo0', makeFile('two.jpg'));
    form.append('photo0', makeFile('three.jpg'));
    form.append('photo0', makeFile('four.jpg'));
    expect(() => parseReviewPhotos(form)).toThrow('Maximum 3 photographs allowed per review.');
  });

  test('malformed photo field values are rejected', () => {
    const form = new FormData();
    form.set('photo0', 'not-a-file');
    expect(() => parseReviewPhotos(form)).toThrow('Invalid photo field.');
  });

  test('oversized requests are rejected without a content-length header', async () => {
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(2048));
        controller.close();
      },
    });
    const request = new Request('http://localhost/api/reviews', {
      method: 'POST',
      headers: { 'content-type': 'multipart/form-data; boundary=test' },
      body: body as any,
      duplex: 'half',
    } as RequestInit & { duplex?: string });

    await expect(parseBoundedMultipart(request, 1)).rejects.toBeInstanceOf(RequestTooLargeError);
  });

  test('declared oversized content-length is rejected', async () => {
    const request = new Request('http://localhost/api/reviews', {
      method: 'POST',
      headers: {
        'content-length': `${16 * 1024 * 1024}`,
        'content-type': 'multipart/form-data; boundary=test',
      },
      body: 'field=value',
    });

    await expect(parseBoundedMultipart(request)).rejects.toBeInstanceOf(RequestTooLargeError);
  });

  test('misleading small content-length does not bypass the stream limit', async () => {
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(2048));
        controller.enqueue(new Uint8Array(2048));
        controller.close();
      },
    });
    const request = new Request('http://localhost/api/reviews', {
      method: 'POST',
      headers: {
        'content-length': '2',
        'content-type': 'multipart/form-data; boundary=test',
      },
      body: body as any,
      duplex: 'half',
    } as RequestInit & { duplex?: string });

    await expect(parseBoundedMultipart(request, 3072)).rejects.toBeInstanceOf(RequestTooLargeError);
  });
});

test.describe('review rate limiting', () => {
  const originalSecret = process.env.REVIEW_RATE_LIMIT_SECRET;
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const originalKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  test.beforeEach(() => {
    process.env.REVIEW_RATE_LIMIT_SECRET = 'local-test-hmac-secret';
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'local-test-service-key';
  });

  test.afterEach(() => {
    if (originalSecret === undefined) delete process.env.REVIEW_RATE_LIMIT_SECRET;
    else process.env.REVIEW_RATE_LIMIT_SECRET = originalSecret;
    if (originalUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
    if (originalKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = originalKey;
  });

  const trustedRequest = () => new Request('http://localhost/api/reviews', {
    method: 'POST',
    headers: { 'x-nf-client-connection-ip': '203.0.113.10' },
  });

  test('limits preserve the documented Windows', () => {
    expect(RATE_LIMITS).toEqual([
      { windowMs: 15 * 60 * 1000, maxRequests: 5 },
      { windowMs: 24 * 60 * 60 * 1000, maxRequests: 20 },
    ]);
  });

  test('only the Netlify client IP header is trusted', () => {
    expect(getClientIdentifier(trustedRequest())).toBe('203.0.113.10');
    expect(() => getClientIdentifier(new Request('http://localhost', {
      headers: { 'x-forwarded-for': '198.51.100.1' },
    }))).toThrow('UNABLE_TO_IDENTIFY_CLIENT');
    expect(() => getClientIdentifier(new Request('http://localhost', {
      headers: { 'x-nf-client-connection-ip': 'not-an-ip' },
    }))).toThrow('UNABLE_TO_IDENTIFY_CLIENT');
  });

  test('missing HMAC secret fails before database calls', async () => {
    delete process.env.REVIEW_RATE_LIMIT_SECRET;
    let databaseCalls = 0;
    const database: RateLimitDatabase = {
      rpc: async () => {
        databaseCalls += 1;
        return { data: [], error: null };
      },
    };

    await expect(checkRateLimit(trustedRequest(), database)).rejects.toThrow('SERVICE_UNAVAILABLE');
    expect(databaseCalls).toBe(0);
  });

  test('database RPC errors fail closed', async () => {
    const database: RateLimitDatabase = {
      rpc: async () => ({ data: null, error: { message: 'internal database detail' } }),
    };

    await expect(checkRateLimit(trustedRequest(), database)).rejects.toThrow('RATE_LIMIT_DB_ERROR');
  });

  test('unidentifiable clients cannot silently receive unlimited submissions', async () => {
    let databaseCalls = 0;
    const database: RateLimitDatabase = {
      rpc: async () => {
        databaseCalls += 1;
        return { data: [], error: null };
      },
    };
    const request = new Request('http://localhost/api/reviews', {
      method: 'POST',
      headers: { 'x-forwarded-for': '198.51.100.1' },
    });

    await expect(checkRateLimit(request, database)).rejects.toThrow('UNABLE_TO_IDENTIFY_CLIENT');
    expect(databaseCalls).toBe(0);
  });

  test('exceeded 15-minute limit returns retry information', async () => {
    const resetTime = Date.now() + 900_000;
    const database: RateLimitDatabase = {
      rpc: async (functionName, args) => {
        expect(functionName).toBe('check_review_rate_limits');
        expect(args.p_client_ip_hash).toHaveLength(64);
        expect(args).toMatchObject({
          p_short_window_ms: 15 * 60 * 1000,
          p_short_window_max: 5,
          p_long_window_ms: 24 * 60 * 60 * 1000,
          p_long_window_max: 20,
        });
        return {
          data: [{
            allowed: false,
            remaining: 0,
            reset_time: new Date(resetTime).toISOString(),
            retry_after_seconds: 900,
          }],
          error: null,
        };
      },
    };

    const result = await checkRateLimit(trustedRequest(), database);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfter).toBe(900);
    expect(result.resetTime).toBe(resetTime);
  });

  test('exceeded daily limit returns retry information', async () => {
    const resetTime = Date.now() + 86_400_000;
    const database: RateLimitDatabase = {
      rpc: async () => ({
        data: [{
          allowed: false,
          remaining: 0,
          reset_time: new Date(resetTime).toISOString(),
          retry_after_seconds: 86_400,
        }],
        error: null,
      }),
    };

    const result = await checkRateLimit(trustedRequest(), database);
    expect(result.allowed).toBe(false);
    expect(result.retryAfter).toBe(86_400);
    expect(result.resetTime).toBe(resetTime);
  });

  test('simultaneously exceeded windows return the later blocking reset', async () => {
    const shortReset = Date.now() + 900_000;
    const longReset = Date.now() + 86_400_000;
    const database: RateLimitDatabase = {
      rpc: async () => ({
        data: [{
          allowed: false,
          remaining: 0,
          reset_time: new Date(longReset).toISOString(),
          retry_after_seconds: 86_400,
        }],
        error: null,
      }),
    };

    const result = await checkRateLimit(trustedRequest(), database);
    expect(result.allowed).toBe(false);
    expect(result.retryAfter).toBe(86_400);
    expect(result.resetTime).toBe(longReset);
    expect(result.resetTime).toBeGreaterThan(shortReset);
  });
});

test.describe('review GET API', () => {
  const fetchDeps = (overrides: Partial<ReviewFetchDependencies> = {}): ReviewFetchDependencies => ({
    hasServiceCredentials: () => true,
    fetchProductReviews: async () => ({
      reviews: [],
      totalCount: 0,
      summary: { averageRating: null, reviewCount: 0 },
    }),
    createSignedReviewPhotoUrl: async () => null,
    ...overrides,
  });

  test('invalid product UUID is rejected', async () => {
    const response = await handleReviewFetch(
      new Request(`http://localhost/api/reviews?productId=not-a-uuid`),
      fetchDeps()
    );
    expect(response.status).toBe(400);
  });

  test('invalid pagination receives a consistent 400 response', async () => {
    const response = await handleReviewFetch(
      new Request(`http://localhost/api/reviews?productId=${VALID_PRODUCT_ID}&offset=1.5`),
      fetchDeps()
    );
    const body = await response.json() as any;
    expect(response.status).toBe(400);
    expect(body.code).toBe('INVALID_PAGINATION');
  });

  test('private storage paths are not serialized', async () => {
    const privatePath = `${REVIEW_ID}/secret.webp`;
    const deps = fetchDeps({
      fetchProductReviews: async () => ({
        reviews: [{
          id: REVIEW_ID,
          productId: VALID_PRODUCT_ID,
          userId: null,
          customerName: null,
          rating: 5,
          content: 'This is a great product.',
          status: 'published',
          productNameSnapshot: 'Test',
          productSlugSnapshot: 'test',
          createdAt: '2026-11-24T00:00:00.000Z',
          updatedAt: '2026-11-24T00:00:00.000Z',
          images: [{
            id: '22222222-2222-4222-8222-222222222222',
            reviewId: REVIEW_ID,
            storagePath: privatePath,
            sortOrder: 0,
            createdAt: '2026-11-24T00:00:00.000Z',
          }],
        }],
        totalCount: 1,
        summary: { averageRating: 5, reviewCount: 1 },
      }),
      createSignedReviewPhotoUrl: async () => 'https://signed.example/photo',
    });

    const response = await handleReviewFetch(
      new Request(`http://localhost/api/reviews?productId=${VALID_PRODUCT_ID}`),
      deps
    );
    const body = await response.json() as any;
    const serialized = JSON.stringify(body);
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(serialized).not.toContain(privatePath);
    expect(serialized).not.toContain('storagePath');
    expect(body.data.reviews[0].userId).toBeUndefined();
    expect(body.data.reviews[0].images[0].signedUrl).toBe('https://signed.example/photo');
  });
});

interface SubmissionState {
  uploadedPaths: string[];
  cleanedPaths: string[];
  createCalls: Array<{ payload: any; imagePaths: string[]; sortOrders: number[] }>;
  signedPaths: string[];
  secretCalls: number;
  parseCalls: number;
  rateLimitCalls: number;
  uploadFailureAt: number | null;
  signFailure: boolean;
  createResult: CreateReviewResult | null;
  cleanupAttempts: number;
  cleanupFailuresBeforeSuccess: number;
}

function createSubmissionDeps(
  form: FormData,
  overrides: Partial<ReviewRouteDependencies> = {}
): { deps: ReviewRouteDependencies; state: SubmissionState } {
  const state: SubmissionState = {
    uploadedPaths: [],
    cleanedPaths: [],
    createCalls: [],
    signedPaths: [],
    secretCalls: 0,
    parseCalls: 0,
    rateLimitCalls: 0,
    uploadFailureAt: null,
    signFailure: false,
    createResult: null,
    cleanupAttempts: 0,
    cleanupFailuresBeforeSuccess: 0,
  };

  const deps: ReviewRouteDependencies = {
    isSubmissionEnabled: () => true,
    hasServiceCredentials: () => true,
    getReviewRateLimitSecret: () => {
      state.secretCalls += 1;
      return 'local-test-hmac-secret';
    },
    checkRateLimit: async () => {
      state.rateLimitCalls += 1;
      return { allowed: true, remaining: 4, resetTime: Date.now() + 900_000 };
    },
    validateReviewInput,
    checkProductVisibility: async () => ({
      exists: true,
      isPublic: true,
      name: 'Test Product',
      slug: 'test-product',
    }),
    parseBoundedFormData: async () => {
      state.parseCalls += 1;
      return form;
    },
    parseReviewPhotos,
    getAuthenticatedUserId: async () => SERVER_USER_ID,
    processReviewPhoto: async () => ({
      buffer: Buffer.from('webp'),
      mimeType: 'image/webp',
      extension: 'webp',
      width: 100,
      height: 100,
      size: 4,
    }),
    generateReviewPhotoPath: (reviewId, extension) => `${reviewId}/photo.${extension}`,
    uploadReviewPhoto: async (_buffer, _mimeType, storagePath) => {
      state.uploadedPaths.push(storagePath);
      if (state.uploadFailureAt === state.uploadedPaths.length) {
        throw new Error('upload failed');
      }
    },
    createProductReviewAtomic: async (payload, imagePaths, sortOrders) => {
      state.createCalls.push({ payload, imagePaths: imagePaths ?? [], sortOrders: sortOrders ?? [] });
      if (state.createResult) return state.createResult;
      return {
        reviewId: payload.reviewId,
        duplicate: false,
        errorCode: null,
        errorMessage: null,
        review: null,
      };
    },
    reconcileReviewSubmission: async () => 'not_committed',
    createSignedReviewPhotoUrl: async (storagePath) => {
      state.signedPaths.push(storagePath);
      if (state.signFailure) throw new Error('signing failed');
      return 'https://signed.example/photo';
    },
    fetchReviewImages: async () => [],
    cleanupReviewPhotos: async (storagePaths) => {
      state.cleanupAttempts += 1;
      if (state.cleanupAttempts <= state.cleanupFailuresBeforeSuccess) {
        throw new Error('cleanup failed');
      }
      state.cleanedPaths.push(...storagePaths);
    },
    hashSubmissionKey: () => 'a'.repeat(64),
    hashReviewPhoto,
    computeReviewPayloadHash,
    randomUUID: () => REVIEW_ID,
    ...overrides,
  };

  return { deps, state };
}

test.describe('review POST API orchestration', () => {
  const submissionRequest = () => new Request('http://localhost/api/reviews', { method: 'POST' });

  test('disabled submissions fail closed before credentials, parsing, rate limiting or writes', async () => {
    const { deps, state } = createSubmissionDeps(makeReviewForm({ includePhoto: true }), {
      isSubmissionEnabled: () => false,
    });

    const response = await handleReviewSubmission(submissionRequest(), deps);
    const body = await response.json() as any;

    expect(response.status).toBe(503);
    expect(body.code).toBe('REVIEWS_DISABLED');
    expect(state.secretCalls).toBe(0);
    expect(state.parseCalls).toBe(0);
    expect(state.rateLimitCalls).toBe(0);
    expect(state.uploadedPaths).toEqual([]);
    expect(state.createCalls).toHaveLength(0);
    expect(state.cleanupAttempts).toBe(0);
  });

  test('POST is disabled when REVIEW_SUBMISSIONS_ENABLED is absent', async () => {
    const original = process.env.REVIEW_SUBMISSIONS_ENABLED;
    delete process.env.REVIEW_SUBMISSIONS_ENABLED;

    try {
      const response = await POST(submissionRequest());
      const body = await response.json() as any;

      expect(response.status).toBe(503);
      expect(body.code).toBe('REVIEWS_DISABLED');
    } finally {
      if (original === undefined) {
        delete process.env.REVIEW_SUBMISSIONS_ENABLED;
      } else {
        process.env.REVIEW_SUBMISSIONS_ENABLED = original;
      }
    }
  });

  test('client review UI flag can be enabled outside development', () => {
    const env = process.env as Record<string, string | undefined>;
    const originalNodeEnv = env.NODE_ENV;
    const originalUiFlag = env.NEXT_PUBLIC_ENABLE_REVIEW_UI;
    env.NODE_ENV = 'production';
    env.NEXT_PUBLIC_ENABLE_REVIEW_UI = 'true';

    try {
      expect(isReviewUiEnabled()).toBe(true);
    } finally {
      if (originalNodeEnv === undefined) {
        delete env.NODE_ENV;
      } else {
        env.NODE_ENV = originalNodeEnv;
      }
      if (originalUiFlag === undefined) {
        delete env.NEXT_PUBLIC_ENABLE_REVIEW_UI;
      } else {
        env.NEXT_PUBLIC_ENABLE_REVIEW_UI = originalUiFlag;
      }
    }
  });

  test('successful submission returns 201 with one review UUID', async () => {
    const { deps, state } = createSubmissionDeps(makeReviewForm({ includePhoto: true }));

    const response = await handleReviewSubmission(submissionRequest(), deps);
    const body = await response.json() as any;

    expect(response.status).toBe(201);
    expect(body.duplicate).toBe(false);
    expect(body.data.review.id).toBe(REVIEW_ID);
    expect(state.createCalls).toHaveLength(1);
    expect(state.createCalls[0].payload.reviewId).toBe(REVIEW_ID);
    expect(state.createCalls[0].imagePaths).toEqual([`${REVIEW_ID}/photo.webp`]);
    expect(state.createCalls[0].payload.userId).toBe(SERVER_USER_ID);
    expect(state.createCalls[0].payload.payloadHash).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.stringify(body)).not.toContain(`${REVIEW_ID}/photo.webp`);
    expect(state.cleanedPaths).toEqual([]);
  });

  test('duplicate retry returns the existing review and cleans new photos', async () => {
    const { deps, state } = createSubmissionDeps(makeReviewForm({ includePhoto: true }));
    const existingId = '33333333-3333-4333-8333-333333333333';
    state.createResult = {
      reviewId: existingId,
      duplicate: true,
      errorCode: 'DUPLICATE_SUBMISSION',
      errorMessage: 'duplicate',
      review: {
        id: existingId,
        userId: SERVER_USER_ID,
        customerName: null,
        rating: 5,
        content: 'Original review content.',
        status: 'published',
        productNameSnapshot: 'Test Product',
        productSlugSnapshot: 'test-product',
        createdAt: '2026-11-24T00:00:00.000Z',
      },
    };
    deps.fetchReviewImages = async () => [{
      id: '44444444-4444-4444-8444-444444444444',
      reviewId: existingId,
      storagePath: `${existingId}/secret.webp`,
      sortOrder: 0,
      createdAt: '2026-11-24T00:00:00.000Z',
    }];

    const response = await handleReviewSubmission(submissionRequest(), deps);
    const body = await response.json() as any;

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(body.duplicate).toBe(true);
    expect(body.data.review.id).toBe(existingId);
    expect(body.data.review.userId).toBeUndefined();
    expect(body.data.review.images).toHaveLength(1);
    expect(body.data.review.images[0].signedUrl).toBe('https://signed.example/photo');
    expect(JSON.stringify(body)).not.toContain(`${existingId}/secret.webp`);
    expect(state.createCalls).toHaveLength(1);
    expect(state.cleanedPaths).toEqual([`${REVIEW_ID}/photo.webp`]);
  });

  test('database failure cleans newly uploaded files', async () => {
    const { deps, state } = createSubmissionDeps(makeReviewForm({ includePhoto: true }));
    state.createResult = {
      reviewId: '',
      duplicate: false,
      errorCode: 'DATABASE_ERROR',
      errorMessage: 'internal SQL detail',
      review: null,
    };

    const response = await handleReviewSubmission(submissionRequest(), deps);
    const body = await response.json() as any;

    expect(response.status).toBe(500);
    expect(JSON.stringify(body)).not.toContain('internal SQL detail');
    expect(state.cleanedPaths).toEqual([`${REVIEW_ID}/photo.webp`]);
  });

  test('photo upload failure prevents review insertion', async () => {
    const form = makeReviewForm({ includePhoto: true });
    form.append('photo1', makeFile('second.jpg'));
    const { deps, state } = createSubmissionDeps(form);
    state.uploadFailureAt = 2;

    const response = await handleReviewSubmission(submissionRequest(), deps);

    expect(response.status).toBe(500);
    expect(state.createCalls).toHaveLength(0);
    expect(state.cleanedPaths).toHaveLength(1);
  });

  test('signed URL failure does not turn a committed review into HTTP 500', async () => {
    const { deps, state } = createSubmissionDeps(makeReviewForm({ includePhoto: true }));
    state.signFailure = true;

    const response = await handleReviewSubmission(submissionRequest(), deps);
    const body = await response.json() as any;

    expect(response.status).toBe(201);
    expect(body.data.review.images[0].signedUrl).toBeNull();
    expect(state.cleanedPaths).toEqual([]);
  });

  test('hidden product cannot receive a review', async () => {
    const { deps, state } = createSubmissionDeps(makeReviewForm({ includePhoto: true }), {
      checkProductVisibility: async () => ({
        exists: true,
        isPublic: false,
        name: 'Hidden Product',
        slug: 'hidden-product',
      }),
    });

    const response = await handleReviewSubmission(submissionRequest(), deps);

    expect(response.status).toBe(400);
    expect(state.createCalls).toHaveLength(0);
    expect(state.uploadedPaths).toEqual([]);
  });

  test('missing HMAC secret returns SERVICE_UNAVAILABLE before rate limiting', async () => {
    const { deps, state } = createSubmissionDeps(makeReviewForm(), {
      getReviewRateLimitSecret: () => {
        throw new Error('SERVICE_UNAVAILABLE: REVIEW_RATE_LIMIT_SECRET is not configured.');
      },
    });

    const response = await handleReviewSubmission(submissionRequest(), deps);
    const body = await response.json() as any;

    expect(response.status).toBe(503);
    expect(body.code).toBe('SERVICE_UNAVAILABLE');
    expect(state.rateLimitCalls).toBe(0);
  });

  test('rate-limit database failure returns RATE_LIMIT_UNAVAILABLE', async () => {
    const { deps } = createSubmissionDeps(makeReviewForm(), {
      checkRateLimit: async () => {
        throw new Error('RATE_LIMIT_DB_ERROR: Rate limit service failed.');
      },
    });

    const response = await handleReviewSubmission(submissionRequest(), deps);
    const body = await response.json() as any;

    expect(response.status).toBe(503);
    expect(body.code).toBe('RATE_LIMIT_UNAVAILABLE');
  });

  test('rate-limited submissions receive retry headers', async () => {
    const { deps, state } = createSubmissionDeps(makeReviewForm(), {
      checkRateLimit: async () => ({
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + 60_000,
        retryAfter: 60,
      }),
    });

    const response = await handleReviewSubmission(submissionRequest(), deps);

    expect(response.status).toBe(429);
    expect(response.headers.get('retry-after')).toBe('60');
    expect(response.headers.get('x-ratelimit-remaining')).toBe('0');
    expect(response.headers.get('x-ratelimit-reset')).toMatch(/^\d+$/);
    expect(state.createCalls).toHaveLength(0);
  });

  test('invalid image errors return 400 rather than 500', async () => {
    const { deps, state } = createSubmissionDeps(makeReviewForm({ includePhoto: true }), {
      processReviewPhoto: async () => {
        throw new Error('The uploaded file is empty.');
      },
    });

    const response = await handleReviewSubmission(submissionRequest(), deps);
    const body = await response.json() as any;

    expect(response.status).toBe(400);
    expect(body.code).toBe('INVALID_PHOTO');
    expect(state.uploadedPaths).toEqual([]);
    expect(state.createCalls).toHaveLength(0);
  });

  test('duplicate submission without a recoverable review returns 409', async () => {
    const { deps } = createSubmissionDeps(makeReviewForm());
    deps.createProductReviewAtomic = async () => ({
      reviewId: '',
      duplicate: true,
      errorCode: 'DUPLICATE_SUBMISSION',
      errorMessage: 'Concurrent duplicate submission detected.',
      review: null,
    });

    const response = await handleReviewSubmission(submissionRequest(), deps);
    const body = await response.json() as any;

    expect(response.status).toBe(409);
    expect(body.code).toBe('DUPLICATE_SUBMISSION');
  });

  test('failed cleanup is retried without losing the response', async () => {
    const { deps, state } = createSubmissionDeps(makeReviewForm({ includePhoto: true }));
    state.createResult = {
      reviewId: '',
      duplicate: false,
      errorCode: 'DATABASE_ERROR',
      errorMessage: 'internal SQL detail',
      review: null,
    };
    state.cleanupFailuresBeforeSuccess = 1;

    const response = await handleReviewSubmission(submissionRequest(), deps);

    expect(response.status).toBe(500);
    expect(state.cleanupAttempts).toBe(2);
    expect(state.cleanedPaths).toEqual([`${REVIEW_ID}/photo.webp`]);
  });

  test('confirmed commit after an uncertain RPC response preserves photos', async () => {
    const { deps, state } = createSubmissionDeps(makeReviewForm({ includePhoto: true }));
    deps.createProductReviewAtomic = async () => {
      throw new ReviewSubmissionOutcomeUnknownError();
    };
    deps.reconcileReviewSubmission = async () => 'committed';

    const response = await handleReviewSubmission(submissionRequest(), deps);
    const body = await response.json() as any;

    expect(response.status).toBe(201);
    expect(body.data.review.id).toBe(REVIEW_ID);
    expect(state.cleanedPaths).toEqual([]);
    expect(state.cleanupAttempts).toBe(0);
  });

  test('confirmed rollback after an uncertain RPC response cleans photos', async () => {
    const { deps, state } = createSubmissionDeps(makeReviewForm({ includePhoto: true }));
    deps.createProductReviewAtomic = async () => {
      throw new ReviewSubmissionOutcomeUnknownError();
    };
    deps.reconcileReviewSubmission = async () => 'not_committed';

    const response = await handleReviewSubmission(submissionRequest(), deps);

    expect(response.status).toBe(500);
    expect(state.cleanedPaths).toEqual([`${REVIEW_ID}/photo.webp`]);
  });

  test('submission-key conflict after an uncertain RPC response cleans new photos', async () => {
    const { deps, state } = createSubmissionDeps(makeReviewForm({ includePhoto: true }));
    deps.createProductReviewAtomic = async () => {
      throw new ReviewSubmissionOutcomeUnknownError();
    };
    deps.reconcileReviewSubmission = async () => 'conflict';

    const response = await handleReviewSubmission(submissionRequest(), deps);
    const body = await response.json() as any;

    expect(response.status).toBe(409);
    expect(body.code).toBe('DUPLICATE_SUBMISSION');
    expect(state.cleanedPaths).toEqual([`${REVIEW_ID}/photo.webp`]);
  });

  test('unresolved submission outcome preserves photos and returns status unknown', async () => {
    const { deps, state } = createSubmissionDeps(makeReviewForm({ includePhoto: true }));
    deps.createProductReviewAtomic = async () => {
      throw new ReviewSubmissionOutcomeUnknownError();
    };
    deps.reconcileReviewSubmission = async () => 'uncertain';

    const response = await handleReviewSubmission(submissionRequest(), deps);
    const body = await response.json() as any;

    expect(response.status).toBe(503);
    expect(body.code).toBe('SUBMISSION_STATUS_UNKNOWN');
    expect(body.submissionId).toBe(REVIEW_ID);
    expect(state.cleanedPaths).toEqual([]);
    expect(state.cleanupAttempts).toBe(0);
  });

  test('submission key conflicts return 409 without review data', async () => {
    const { deps, state } = createSubmissionDeps(makeReviewForm());
    state.createResult = {
      reviewId: '',
      duplicate: false,
      errorCode: 'SUBMISSION_KEY_CONFLICT',
      errorMessage: 'key mismatch',
      review: null,
    };

    const response = await handleReviewSubmission(submissionRequest(), deps);
    const body = await response.json() as any;

    expect(response.status).toBe(409);
    expect(body.code).toBe('SUBMISSION_KEY_CONFLICT');
    expect(body.data).toBeUndefined();
  });
});

test.describe('review submission reconciliation', () => {
  const keyHash = 'a'.repeat(64);

  function fakeReconciliationDatabase(options: {
    key?: { review_id: string } | null;
    review?: { id: string } | null;
    keyError?: Error;
    reviewError?: Error;
  } = {}) {
    return {
      from: (table: string) => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => table === 'review_submission_keys'
              ? { data: options.key ?? null, error: options.keyError ?? null }
              : { data: options.review ?? null, error: options.reviewError ?? null },
          }),
        }),
      }),
    };
  }

  test('missing row after an ambiguous failure remains uncertain', async () => {
    const database = fakeReconciliationDatabase();

    await expect(reconcileReviewSubmission(REVIEW_ID, keyHash, database)).resolves.toBe('uncertain');
  });

  test('missing row with an explicit confirmed check is not committed', async () => {
    const database = fakeReconciliationDatabase();

    await expect(
      reconcileReviewSubmission(REVIEW_ID, keyHash, database, { ambiguous: false })
    ).resolves.toBe('not_committed');
  });

  test('key lookup errors remain uncertain', async () => {
    const database = fakeReconciliationDatabase({
      keyError: new Error('temporary database error'),
    });

    await expect(reconcileReviewSubmission(REVIEW_ID, keyHash, database)).resolves.toBe('uncertain');
  });

  test('matching submission key confirms commit', async () => {
    const database = fakeReconciliationDatabase({ key: { review_id: REVIEW_ID } });

    await expect(reconcileReviewSubmission(REVIEW_ID, keyHash, database)).resolves.toBe('committed');
  });

  test('submission key for another review is a conflict', async () => {
    const database = fakeReconciliationDatabase({
      key: { review_id: '22222222-2222-4222-8222-222222222222' },
    });

    await expect(reconcileReviewSubmission(REVIEW_ID, keyHash, database)).resolves.toBe('conflict');
  });

  test('review UUID confirms commit when the key row is not visible yet', async () => {
    const database = fakeReconciliationDatabase({ review: { id: REVIEW_ID } });

    await expect(reconcileReviewSubmission(REVIEW_ID, keyHash, database)).resolves.toBe('committed');
  });
});

test.describe('review image processing', () => {
  test('valid PNG input is converted to WebP without source metadata', async () => {
    const input = await sharp({
      create: { width: 100, height: 100, channels: 3, background: { r: 200, g: 100, b: 50 } },
    })
      .png()
      .toBuffer();

    const result = await processReviewPhoto(input, 'image/png');
    const metadata = await sharp(result.buffer).metadata();

    expect(result.mimeType).toBe('image/webp');
    expect(result.extension).toBe('webp');
    expect(metadata.format).toBe('webp');
    expect(metadata.exif).toBeFalsy();
    expect(metadata.iptc).toBeFalsy();
    expect(metadata.xmp).toBeFalsy();
  });

  test('malformed image data is rejected', async () => {
    await expect(processReviewPhoto(Buffer.from('not an image'), 'image/jpeg')).rejects.toThrow();
  });

  test('declared MIME type must match decoded format', async () => {
    const input = await sharp({
      create: { width: 100, height: 100, channels: 3, background: '#ffffff' },
    })
      .png()
      .toBuffer();

    await expect(processReviewPhoto(input, 'image/jpeg')).rejects.toThrow('Image contents do not match the declared type.');
  });

  test('orientation metadata is applied and EXIF is removed', async () => {
    const input = await sharp({
      create: { width: 100, height: 200, channels: 3, background: '#123456' },
    })
      .withMetadata({ orientation: 6 })
      .jpeg()
      .toBuffer();

    const result = await processReviewPhoto(input, 'image/jpeg');
    const metadata = await sharp(result.buffer).metadata();

    expect(result.width).toBe(200);
    expect(result.height).toBe(100);
    expect(metadata.exif).toBeFalsy();
  });

  test('large images are resized before output', async () => {
    const input = await sharp({
      create: { width: 2000, height: 1000, channels: 3, background: '#abcdef' },
    })
      .jpeg()
      .toBuffer();

    const result = await processReviewPhoto(input, 'image/jpeg');
    const metadata = await sharp(result.buffer).metadata();

    expect(result.width).toBeLessThanOrEqual(1600);
    expect(result.height).toBeLessThanOrEqual(1600);
    expect(metadata.format).toBe('webp');
  });
});
