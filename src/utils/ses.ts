import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

// Initialize SES client
const sesClient = new SESClient({
  region: process.env.AWS_REGION || 'eu-central-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

// Function to generate a random 6-digit OTP
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Function to send OTP via email
export async function sendOTPEmail(
  to: string,
  otp: string
): Promise<boolean> {
  try {
    const params = {
      Source: 'contact@shiftcrowd.eu',
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Subject: {
          Data: 'Your Verification Code for Masat',
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: `
              <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #4361ee;">Masat</h1>
                  </div>
                  <div style="background-color: #f9f9f9; border-radius: 5px; padding: 20px; margin-bottom: 20px;">
                    <h2 style="margin-top: 0; color: #333;">Verification Code</h2>
                    <p>You're receiving this email because you requested to set a password for your Masat account.</p>
                    <p>Your verification code is:</p>
                    <div style="background-color: #e0e0e0; padding: 10px; border-radius: 5px; font-size: 24px; font-weight: bold; text-align: center; letter-spacing: 5px; margin: 20px 0;">
                      ${otp}
                    </div>
                    <p>This code will expire in 15 minutes.</p>
                    <p>If you didn't request this code, you can safely ignore this email.</p>
                  </div>
                  <div style="color: #777; font-size: 12px; text-align: center;">
                    <p>&copy; ${new Date().getFullYear()} Masat. All rights reserved.</p>
                  </div>
                </body>
              </html>
            `,
            Charset: 'UTF-8',
          },
          Text: {
            Data: `Your verification code for Masat is: ${otp}. This code will expire in 15 minutes.`,
            Charset: 'UTF-8',
          },
        },
      },
    };

    await sesClient.send(new SendEmailCommand(params));
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
} 