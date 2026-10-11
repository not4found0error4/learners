import { Resend } from 'resend';

export type OrderEmailCartItem = {
  title?: string;
  price: number;
  quantity: number;
};

const FROM_ADDRESS = 'Learners Bookstore <onboarding@resend.dev>';
export const ADMIN_EMAIL = 'learnerspublications@gmail.com';

export type ContactEnquiryEmail = {
  name: string;
  email: string;
  phone: string;
  organization: string;
  enquiryType: string;
  subject: string;
  message: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatCurrency(amount: number) {
  return `₹${amount.toFixed(2)}`;
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  options: { replyTo?: string } = {},
) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured.');
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject,
    html,
    ...(options.replyTo ? { replyTo: options.replyTo } : {}),
  });

  if (error) {
    throw new Error(error.message);
  }
}

export function buildContactEnquiryEmail(enquiry: ContactEnquiryEmail) {
  const details = [
    ['Name', enquiry.name],
    ['Email', enquiry.email],
    ['Phone', enquiry.phone],
    ['School / organisation', enquiry.organization],
    ['Enquiry type', enquiry.enquiryType],
    ['Subject', enquiry.subject],
  ]
    .filter(([, value]) => value)
    .map(
      ([label, value]) =>
        `<p><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</p>`,
    )
    .join('');

  return `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#1f2937;">
      <h1>New contact enquiry</h1>
      ${details}
      <h2>Message</h2>
      <p style="white-space:pre-wrap;">${escapeHtml(enquiry.message)}</p>
    </div>`;
}

export function buildOrderConfirmationEmail(
  customerName: string,
  orderId: string,
  cartItems: OrderEmailCartItem[],
  totalAmount: number,
  address: string,
) {
  const itemRows = cartItems
    .map(
      (item) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;">${escapeHtml(item.title || 'Book')}</td>
          <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;text-align:center;">${item.quantity}</td>
          <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;text-align:right;">${formatCurrency(item.price * item.quantity)}</td>
        </tr>`,
    )
    .join('');

  return `
    <div style="margin:0 auto;padding:24px;max-width:600px;color:#1f2937;font-family:Arial,sans-serif;line-height:1.5;">
      <h1 style="margin:0 0 16px;font-size:24px;">Thank you for your order, ${escapeHtml(customerName)}!</h1>
      <p style="margin:0 0 20px;">We have received your payment and saved your order.</p>
      <p style="margin:0 0 20px;"><strong>Order ID:</strong> ${escapeHtml(orderId)}</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead>
          <tr>
            <th style="padding:10px 0;text-align:left;border-bottom:2px solid #1f2937;">Book</th>
            <th style="padding:10px 0;text-align:center;border-bottom:2px solid #1f2937;">Qty</th>
            <th style="padding:10px 0;text-align:right;border-bottom:2px solid #1f2937;">Price</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>
      <p style="margin:20px 0;"><strong>Total:</strong> ${formatCurrency(totalAmount)}</p>
      <div style="padding:16px;background:#f3f4f6;">
        <strong>Shipping address</strong>
        <p style="margin:8px 0 0;white-space:pre-line;">${escapeHtml(address)}</p>
      </div>
    </div>`;
}

export function buildAdminOrderNotificationEmail(
  customerName: string,
  orderId: string,
  cartItems: OrderEmailCartItem[],
  totalAmount: number,
) {
  const itemList = cartItems
    .map(
      (item) => `<li>${escapeHtml(item.title || 'Book')} x ${item.quantity} (${formatCurrency(item.price * item.quantity)})</li>`,
    )
    .join('');

  return `
    <div style="font-family:Arial,sans-serif;line-height:1.5;">
      <h2>New Learners Bookstore order</h2>
      <p><strong>Order ID:</strong> ${escapeHtml(orderId)}</p>
      <p><strong>Customer:</strong> ${escapeHtml(customerName)}</p>
      <p><strong>Total:</strong> ${formatCurrency(totalAmount)}</p>
      <p><strong>Items:</strong></p>
      <ul>${itemList}</ul>
    </div>`;
}
