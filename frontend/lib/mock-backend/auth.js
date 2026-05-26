export const MOCK_FORGOT_PASSWORD_RESPONSE = {
  sent: true,
};

export const AUTH_ERRORS = {
  INVALID_EMAIL: {
    code: 'INVALID_EMAIL',
    message: 'Enter a valid email address.',
  },
  MISSING_PASSWORD: {
    code: 'MISSING_PASSWORD',
    message: 'Enter your passphrase.',
  },
  INVALID_CREDENTIALS: {
    code: 'INVALID_CREDENTIALS',
    message: 'Email or passphrase is incorrect.',
  },
  WEAK_PASSWORD: {
    code: 'WEAK_PASSWORD',
    message: 'Passphrase must be at least 8 characters.',
  },
  MISSING_NAME: {
    code: 'MISSING_NAME',
    message: 'Enter the name the stars should call you.',
  },
  MISSING_BIRTH_DATE: {
    code: 'MISSING_BIRTH_DATE',
    message: 'Enter your date of birth.',
  },
  TERMS_REQUIRED: {
    code: 'TERMS_REQUIRED',
    message: 'Accept the terms to continue.',
  },
};
