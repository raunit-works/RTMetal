export type VariantUploadState = 'uploading' | 'error';

export interface VariantUploadGateEntry {
  fileName: string;
  status: VariantUploadState;
  message?: string;
}

export interface VariantUploadGateDraft {
  finishName: string;
  uploads: readonly VariantUploadGateEntry[];
}

function finishLabel(draft: VariantUploadGateDraft): string {
  return draft.finishName.trim() || 'Unnamed finish';
}

/**
 * Returns a blocking message when saving must wait for an image upload to
 * finish or when a failed upload still needs the administrator's attention.
 */
export function getVariantUploadBlocker(
  drafts: readonly VariantUploadGateDraft[]
): string | null {
  let uploading = 0;
  let failed = 0;
  let firstError: string | null = null;

  drafts.forEach((draft) => {
    draft.uploads.forEach((upload) => {
      if (upload.status === 'uploading') {
        uploading += 1;
        return;
      }
      failed += 1;
      if (!firstError) {
        const detail = upload.message?.trim()
          ? ` ${upload.message.trim()}`
          : '';
        firstError = `${finishLabel(draft)}: "${upload.fileName}" failed to upload.${detail}`;
      }
    });
  });

  if (uploading > 0) {
    return `Wait for ${uploading} finish image${
      uploading === 1 ? '' : 's'
    } to finish uploading before saving.`;
  }

  if (failed > 0) {
    return `${firstError} Fix the upload with Retry or remove it, then save again.`;
  }

  return null;
}
