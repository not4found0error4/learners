import { ADMIN_EMAIL, buildContactEnquiryEmail, sendEmail } from '@/lib/email';

const ENQUIRY_TYPES = [
  'General enquiry',
  'School or institutional order',
  'Distributor enquiry',
  'Catalogue request',
  'Order support',
];

type ContactEnquiry = {
  name: string;
  email: string;
  phone: string;
  organization: string;
  enquiryType: string;
  subject: string;
  message: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readField(body: Record<string, unknown>, field: string, maxLength: number) {
  const value = body[field];

  if (value === undefined) {
    return '';
  }

  if (typeof value !== 'string') {
    throw new Error(`${field} must be text.`);
  }

  const trimmedValue = value.trim();
  if (trimmedValue.length > maxLength) {
    throw new Error(`${field} must be ${maxLength} characters or fewer.`);
  }

  return trimmedValue;
}

function validateEnquiry(value: unknown): ContactEnquiry {
  if (!isRecord(value)) {
    throw new Error('Please submit a valid contact form.');
  }

  const enquiry = {
    name: readField(value, 'name', 200),
    email: readField(value, 'email', 254),
    phone: readField(value, 'phone', 50),
    organization: readField(value, 'organization', 200),
    enquiryType: readField(value, 'enquiryType', 100),
    subject: readField(value, 'subject', 200),
    message: readField(value, 'message', 10000),
  };

  if (!enquiry.name || !enquiry.email || !enquiry.message) {
    throw new Error('Your name, email, and message are required.');
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(enquiry.email)) {
    throw new Error('Please enter a valid email address.');
  }

  if (enquiry.enquiryType && !ENQUIRY_TYPES.includes(enquiry.enquiryType)) {
    throw new Error('Please choose a valid enquiry type.');
  }

  return enquiry;
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Please submit a valid contact form.' }, { status: 400 });
  }

  let enquiry: ContactEnquiry;
  try {
    enquiry = validateEnquiry(body);
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Please check the contact form fields.',
      },
      { status: 400 },
    );
  }

  try {
    await sendEmail(
      ADMIN_EMAIL,
      'New contact enquiry',
      buildContactEnquiryEmail(enquiry),
      { replyTo: enquiry.email },
    );
  } catch (error) {
    console.error('[contact] Failed to send enquiry email:', error);
    return Response.json(
      { error: "We couldn't send your message just now. Please try again." },
      { status: 500 },
    );
  }

  return Response.json({ success: true });
}
