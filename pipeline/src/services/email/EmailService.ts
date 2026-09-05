import nodemailer from 'nodemailer';
import { Order } from "../../definitions/entities/Order";

interface EmailParameters {
  order: Order;
  receipt: Buffer;
}

interface CancellationEmailParameters {
  order: Order;
}

const { SMTP_HOST, SMTP_PORT } = process.env;

export class EmailService {
  private static getBody(order: Order): string {
    return `Dear ${order.details?.customer.name},
      Thank you for your purchase! Please find your receipt attached.
      
      Best regards,
      Your Company`;
  }

  private static getCancellationBody(order: Order): string {
    const items = order.details?.items
      .map((item) => `  - ${item.name} x${item.quantity} @ $${item.price.toFixed(2)}`)
      .join("\n") ?? "  No items found";

    return `Dear ${order.details?.customer.name},

      Your order has been successfully cancelled. Here is a summary of the cancelled order:

      Order ID:   ${order.orderId}
      Reference:  ${order.referenceId}
      Amount:     $${order.amount.toFixed(2)}

      Items:
${items}

      If you have any questions, please don't hesitate to reach out.

      Best regards,
      Your Company`;
  }

  public static async sendEmail({ order, receipt }: EmailParameters): Promise<void> {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: false,
    });

    const mailOptions = {
      from: '"Your Company" <no-reply@yourcompany.com>',
      to: order.details?.customer.email,
      subject: `Receipt for Order ${order.orderId}`,
      text: this.getBody(order),
      attachments: [
        {
          filename: `receipt_${order.orderId}.pdf`,
          content: receipt,
          contentType: 'application/pdf',
        },
      ],
    };

    await transporter.sendMail(mailOptions);
  }

  public static async sendCancellationEmail({ order }: CancellationEmailParameters): Promise<void> {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: false,
    });

    const mailOptions = {
      from: '"Your Company" <no-reply@yourcompany.com>',
      to: order.details?.customer.email,
      subject: `Your Order ${order.orderId} Has Been Cancelled`,
      text: this.getCancellationBody(order),
    };

    await transporter.sendMail(mailOptions);
  }
}
