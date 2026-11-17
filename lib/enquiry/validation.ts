export const ENQUIRY_EMAIL_PATTERN =
  /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

export interface EnquiryIdentityInput {
  name?: string | null;
  phone?: string | null;
  email?: string | null;
}

export interface EnquiryIdentityErrors {
  name?: string;
  phone?: string;
  email?: string;
}

export interface ValidatedEnquiryIdentity {
  name: string;
  phone: string;
  email: string | null;
  errors: EnquiryIdentityErrors;
  isValid: boolean;
}

/**
 * Shared customer identity rules for every enquiry entry point.
 *
 * Name and mobile number are mandatory. Email is optional and is normalised to
 * null when it is blank so the API and database never store a fake address.
 */
export function validateEnquiryIdentity(
  input: EnquiryIdentityInput
): ValidatedEnquiryIdentity {
  const name = (input.name ?? '').trim();
  const phone = (input.phone ?? '').trim();
  const email = (input.email ?? '').trim();
  const errors: EnquiryIdentityErrors = {};

  if (name.length < 2 || name.length > 100) {
    errors.name = 'Please enter your name (2 to 100 characters).';
  }

  const phoneDigits = phone.replace(/\D/g, '');
  if (phone.length === 0) {
    errors.phone = 'Please enter your mobile number.';
  } else if (phone.length > 30) {
    errors.phone = 'Mobile number exceeds the maximum length.';
  } else if (/[^+\d\s().-]/.test(phone)) {
    errors.phone = 'Please enter a valid mobile number.';
  } else if (phoneDigits.length < 7 || phoneDigits.length > 15) {
    errors.phone = 'Please enter a valid mobile number with 7 to 15 digits.';
  }

  if (email.length > 0) {
    if (email.length > 255 || !ENQUIRY_EMAIL_PATTERN.test(email)) {
      errors.email = 'Please enter a valid email address or leave it blank.';
    }
  }

  return {
    name,
    phone,
    email: email.length > 0 ? email : null,
    errors,
    isValid: Object.keys(errors).length === 0,
  };
}
