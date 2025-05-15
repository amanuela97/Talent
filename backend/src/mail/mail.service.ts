import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

interface BookingRequestData {
  talentName: string;
  clientName: string;
  eventType: string;
  eventDate: string;
  eventTime: string;
  duration: number;
  location: string;
  totalPrice: number;
}

interface BookingConfirmationData {
  clientName: string;
  talentName: string;
  serviceName: string;
  eventType: string;
  eventDate: string;
  eventTime: string;
  duration: number;
  location: string;
  totalPrice: number;
}

interface BookingStatusUpdateData {
  clientName: string;
  talentName: string;
  serviceName: string;
  eventType: string;
  eventDate: string;
  eventTime?: string;
  duration?: number;
  location?: string;
}

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    // Configure email transport using existing env variables
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.get<string>('MAIL_USER'),
        pass: this.configService.get<string>('MAIL_PASS'),
      },
    });
  }

  async sendVerificationEmail(
    email: string,
    name: string,
    verificationLink: string,
  ): Promise<void> {
    const fromEmail = this.configService.get<string>('MAIL_USER');

    await this.transporter.sendMail({
      from: `"Talent Platform" <${fromEmail}>`,
      to: email,
      subject: 'Verify Your Email Address',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f8f8; padding: 20px; text-align: center;">
            <h1 style="color: #ff5e00;">Talent Platform</h1>
          </div>
          <div style="padding: 20px; border: 1px solid #e0e0e0; border-top: none;">
            <h2>Hello ${name},</h2>
            <p>Thank you for registering as a talent on our platform!</p>
            <p>Please verify your email address by clicking the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationLink}" style="background-color: #ff5e00; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                Verify Email Address
              </a>
            </div>
            <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #0066cc;">${verificationLink}</p>
            <p>This link will expire in 24 hours.</p>
            <p>If you didn't create this account, please ignore this email.</p>
            <p>Best regards,<br>The Talent Platform Team</p>
          </div>
          <div style="background-color: #f8f8f8; padding: 15px; text-align: center; font-size: 12px; color: #777;">
            <p>&copy; ${new Date().getFullYear()} Talent Platform. All rights reserved.</p>
          </div>
        </div>
      `,
    });
  }

  async sendPasswordResetEmail(
    email: string,
    name: string,
    resetUrl: string,
  ): Promise<void> {
    const mailOptions = {
      from: this.configService.get<string>('MAIL_USER'),
      to: email,
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset</h2>
          <p>Hello ${name},</p>
          <p>You requested a password reset. Click the button below to set a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #4CAF50; color: white; padding: 14px 20px; 
                      text-align: center; text-decoration: none; display: inline-block; 
                      border-radius: 4px; font-weight: bold;">
              Reset Password
            </a>
          </div>
          <p>If you didn't request this, please ignore this email and your password will remain unchanged.</p>
          <p>Note: This link will expire in 15 minutes.</p>
          <p>Best regards,<br/>The Talent Team</p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Failed to send reset email:', error);
      throw new Error('Failed to send password reset email');
    }
  }

  async sendTalentApprovalEmail(email: string, name: string): Promise<void> {
    const fromEmail = this.configService.get<string>('MAIL_USER');
    const dashboardUrl =
      this.configService.get<string>('FRONTEND_URL') + '/dashboard';

    await this.transporter.sendMail({
      from: `"Talent Platform" <${fromEmail}>`,
      to: email,
      subject: 'Congratulations! Your Talent Profile Has Been Approved',
      html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f8f8; padding: 20px; text-align: center;">
          <h1 style="color: #ff5e00;">Talent Platform</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #e0e0e0; border-top: none;">
          <h2>Great news, ${name}!</h2>
          <p>We're excited to inform you that your talent profile has been <strong style="color: #4CAF50;">approved</strong>!</p>
          <p>You can now access your talent dashboard, manage your profile, and start receiving booking requests from clients.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${dashboardUrl}" style="background-color: #ff5e00; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Go to Your Dashboard
            </a>
          </div>
          <p>Here's what you can do next:</p>
          <ul style="padding-left: 20px; line-height: 1.6;">
            <li>Complete and polish your profile with additional details</li>
            <li>Upload more portfolio items to showcase your work</li>
            <li>Set your availability to start receiving bookings</li>
            <li>Share your profile with your network to get your first clients</li>
          </ul>
          <p>If you have any questions or need assistance, our support team is always ready to help.</p>
          <p>Best regards,<br>The Talent Platform Team</p>
        </div>
        <div style="background-color: #f8f8f8; padding: 15px; text-align: center; font-size: 12px; color: #777;">
          <p>&copy; ${new Date().getFullYear()} Talent Platform. All rights reserved.</p>
        </div>
      </div>
    `,
    });
  }

  async sendTalentRejectionEmail(
    email: string,
    name: string,
    rejectionReason: string,
  ): Promise<void> {
    const fromEmail = this.configService.get<string>('MAIL_USER');
    const joinUrl = this.configService.get<string>('FRONTEND_URL') + '/join';

    await this.transporter.sendMail({
      from: `"Talent Platform" <${fromEmail}>`,
      to: email,
      subject: 'Update on Your Talent Application',
      html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f8f8; padding: 20px; text-align: center;">
          <h1 style="color: #ff5e00;">Talent Platform</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #e0e0e0; border-top: none;">
          <h2>Hello ${name},</h2>
          <p>Thank you for your application to join our platform as a talent.</p>
          <p>After careful review, we regret to inform you that your application has not been approved at this time.</p>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #ff5e00; margin: 20px 0;">
            <p style="margin: 0; font-style: italic;">Feedback from our team:</p>
            <p style="margin-top: 10px;">${rejectionReason || 'Your application did not meet our current requirements.'}</p>
          </div>
          
          <p>We encourage you to update your application and try again. Here are some suggestions:</p>
          <ul style="padding-left: 20px; line-height: 1.6;">
            <li>Make sure all information is complete and accurate</li>
            <li>Provide more details about your skills and experience</li>
            <li>Include high-quality portfolio items if applicable</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${joinUrl}" style="background-color: #ff5e00; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Update Your Application
            </a>
          </div>
          
          <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
          <p>Best regards,<br>The Talent Platform Team</p>
        </div>
        <div style="background-color: #f8f8f8; padding: 15px; text-align: center; font-size: 12px; color: #777;">
          <p>&copy; ${new Date().getFullYear()} Talent Platform. All rights reserved.</p>
        </div>
      </div>
    `,
    });
  }

  /**
   * Send booking request notification to talent
   */
  async sendBookingRequestToTalent(
    email: string,
    data: BookingRequestData,
  ): Promise<void> {
    const fromEmail = this.configService.get<string>('MAIL_USER');

    await this.transporter.sendMail({
      from: `"Talent Platform" <${fromEmail}>`,
      to: email,
      subject: 'New Booking Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f8f8; padding: 20px; text-align: center;">
            <h1 style="color: #ff5e00;">Talent Platform</h1>
          </div>
          <div style="padding: 20px; border: 1px solid #e0e0e0; border-top: none;">
            <h2>Hello ${data.talentName},</h2>
            <p>You have received a new booking request from ${data.clientName}.</p>
            
            <div style="background-color: #f9f9f9; border-left: 4px solid #ff5e00; padding: 15px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Booking Details:</h3>
              <p><strong>Event Type:</strong> ${data.eventType}</p>
              <p><strong>Date:</strong> ${data.eventDate}</p>
              <p><strong>Time:</strong> ${data.eventTime}</p>
              <p><strong>Duration:</strong> ${data.duration ?? 0} hour${(data.duration ?? 0) > 1 ? 's' : ''}</p>
              <p><strong>Location:</strong> ${data.location}</p>
              <p><strong>Total Price:</strong> $${data.totalPrice.toFixed(2)}</p>
            </div>
            
            <p>Please log in to your dashboard to accept or decline this request.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${this.configService.get<string>('FRONTEND_URL')}/dashboard/bookings" style="background-color: #ff5e00; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                View Booking Request
              </a>
            </div>
            
            <p>Best regards,<br>The Talent Platform Team</p>
          </div>
          <div style="background-color: #f8f8f8; padding: 15px; text-align: center; font-size: 12px; color: #777;">
            <p>&copy; ${new Date().getFullYear()} Talent Platform. All rights reserved.</p>
          </div>
        </div>
      `,
    });
  }

  /**
   * Send booking confirmation to client
   */
  async sendBookingConfirmationToClient(
    email: string,
    data: BookingConfirmationData,
  ): Promise<void> {
    const fromEmail = this.configService.get<string>('MAIL_USER');

    await this.transporter.sendMail({
      from: `"Talent Platform" <${fromEmail}>`,
      to: email,
      subject: 'Booking Request Confirmation',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f8f8; padding: 20px; text-align: center;">
            <h1 style="color: #ff5e00;">Talent Platform</h1>
          </div>
          <div style="padding: 20px; border: 1px solid #e0e0e0; border-top: none;">
            <h2>Hello ${data.clientName},</h2>
            <p>Thank you for your booking request with ${data.talentName} (${data.serviceName}).</p>
            
            <div style="background-color: #f9f9f9; border-left: 4px solid #ff5e00; padding: 15px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Booking Details:</h3>
              <p><strong>Event Type:</strong> ${data.eventType}</p>
              <p><strong>Date:</strong> ${data.eventDate}</p>
              <p><strong>Time:</strong> ${data.eventTime}</p>
              <p><strong>Duration:</strong> ${data.duration ?? 0} hour${(data.duration ?? 0) > 1 ? 's' : ''}</p>
              <p><strong>Location:</strong> ${data.location}</p>
              <p><strong>Total Price:</strong> $${data.totalPrice.toFixed(2)}</p>
            </div>
            
            <p>Your booking request has been sent to ${data.talentName} for approval. We will notify you when they respond to your request.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${this.configService.get<string>('FRONTEND_URL')}/bookings" style="background-color: #ff5e00; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                View Your Bookings
              </a>
            </div>
            
            <p>Best regards,<br>The Talent Platform Team</p>
          </div>
          <div style="background-color: #f8f8f8; padding: 15px; text-align: center; font-size: 12px; color: #777;">
            <p>&copy; ${new Date().getFullYear()} Talent Platform. All rights reserved.</p>
          </div>
        </div>
      `,
    });
  }

  /**
   * Send booking accepted notification to client
   */
  async sendBookingAcceptedToClient(
    email: string,
    data: BookingStatusUpdateData,
  ): Promise<void> {
    const fromEmail = this.configService.get<string>('MAIL_USER');

    await this.transporter.sendMail({
      from: `"Talent Platform" <${fromEmail}>`,
      to: email,
      subject: 'Your Booking Has Been Accepted',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f8f8; padding: 20px; text-align: center;">
            <h1 style="color: #ff5e00;">Talent Platform</h1>
          </div>
          <div style="padding: 20px; border: 1px solid #e0e0e0; border-top: none;">
            <h2>Good news, ${data.clientName}!</h2>
            <p>${data.talentName} has accepted your booking request.</p>
            
            <div style="background-color: #f9f9f9; border-left: 4px solid #4CAF50; padding: 15px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #4CAF50;">Booking Confirmed:</h3>
              <p><strong>Event Type:</strong> ${data.eventType}</p>
              <p><strong>Date:</strong> ${data.eventDate}</p>
              <p><strong>Time:</strong> ${data.eventTime}</p>
              <p><strong>Duration:</strong> ${data.duration ?? 0} hour${(data.duration ?? 0) > 1 ? 's' : ''}</p>
              <p><strong>Location:</strong> ${data.location}</p>
            </div>
            
            <p>You can contact ${data.talentName} directly through our messaging system if you have any questions or need to discuss details.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${this.configService.get<string>('FRONTEND_URL')}/bookings" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                View Your Bookings
              </a>
            </div>
            
            <p>Best regards,<br>The Talent Platform Team</p>
          </div>
          <div style="background-color: #f8f8f8; padding: 15px; text-align: center; font-size: 12px; color: #777;">
            <p>&copy; ${new Date().getFullYear()} Talent Platform. All rights reserved.</p>
          </div>
        </div>
      `,
    });
  }

  /**
   * Send booking rejected notification to client
   */
  async sendBookingRejectedToClient(
    email: string,
    data: BookingStatusUpdateData,
  ): Promise<void> {
    const fromEmail = this.configService.get<string>('MAIL_USER');

    await this.transporter.sendMail({
      from: `"Talent Platform" <${fromEmail}>`,
      to: email,
      subject: 'Booking Request Update',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f8f8; padding: 20px; text-align: center;">
            <h1 style="color: #ff5e00;">Talent Platform</h1>
          </div>
          <div style="padding: 20px; border: 1px solid #e0e0e0; border-top: none;">
            <h2>Hello ${data.clientName},</h2>
            <p>We're sorry to inform you that ${data.talentName} is unable to accept your booking request for the following event:</p>
            
            <div style="background-color: #f9f9f9; border-left: 4px solid #777; padding: 15px; margin: 20px 0;">
              <p><strong>Event Type:</strong> ${data.eventType}</p>
              <p><strong>Date:</strong> ${data.eventDate}</p>
            </div>
            
            <p>This could be due to a scheduling conflict or other commitments. We encourage you to browse other talents or select a different date.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${this.configService.get<string>('FRONTEND_URL')}/talents" style="background-color: #ff5e00; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
                Explore Other Talents
              </a>
            </div>
            
            <p>Best regards,<br>The Talent Platform Team</p>
          </div>
          <div style="background-color: #f8f8f8; padding: 15px; text-align: center; font-size: 12px; color: #777;">
            <p>&copy; ${new Date().getFullYear()} Talent Platform. All rights reserved.</p>
          </div>
        </div>
      `,
    });
  }
}
