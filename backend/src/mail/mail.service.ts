import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

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
}
