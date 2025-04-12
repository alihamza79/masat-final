import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

// Initialize SES client
const sesClient = new SESClient({
  region: process.env.AWS_REGION || 'eu-central-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

// Log SES configuration for debugging
console.log('SES Client Configuration:', {
  region: process.env.AWS_REGION || 'eu-central-1',
  hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
  hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
  environment: process.env.NODE_ENV
});

// Function to generate a random 6-digit OTP
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Function to send OTP via email
export async function sendOTPEmail(
  to: string,
  otp: string,
  purpose: 'registration' | 'set-password' | 'reset-password' = 'registration'
): Promise<boolean> {
  try {
    console.log(`Attempting to send ${purpose} OTP email to:`, to);
    
    // Determine subject and message based on purpose
    let subject = 'Your Verification Code for Masat';
    let heading = 'Verification Code';
    let message = 'You\'re receiving this email because you requested a verification code.';
    
    if (purpose === 'registration') {
      subject = 'Verify Your Email for Masat';
      heading = 'Email Verification';
      message = 'You\'re receiving this email because you registered for a Masat account. Please verify your email to complete your registration.';
    } else if (purpose === 'set-password') {
      subject = 'Set Password for Your Masat Account';
      heading = 'Password Setup';
      message = 'You\'re receiving this email because you requested to set a password for your Masat account.';
    } else if (purpose === 'reset-password') {
      subject = 'Reset Your Masat Password';
      heading = 'Password Reset';
      message = 'You\'re receiving this email because you requested to reset your password for your Masat account.';
    }

    // Use environment variable for Source email if available
    const sourceEmail = process.env.SES_SOURCE_EMAIL || 'contact@shiftcrowd.eu';
    console.log('Using source email:', sourceEmail);

    const params = {
      Source: sourceEmail,
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Subject: {
          Data: subject,
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
                    <h2 style="margin-top: 0; color: #333;">${heading}</h2>
                    <p>${message}</p>
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

    console.log('Sending email with params:', {
      source: params.Source,
      destination: params.Destination.ToAddresses,
      subject: params.Message.Subject.Data
    });

    try {
      console.log('Calling SES SendEmailCommand...');
      await sesClient.send(new SendEmailCommand(params));
      console.log('Email sent successfully');
      return true;
    } catch (sesError) {
      console.error('SES SendEmailCommand error details:', {
        message: (sesError as Error).message,
        stack: (sesError as Error).stack,
        errorType: sesError.constructor.name,
        code: (sesError as any).code,
        requestId: (sesError as any).$metadata?.requestId
      });
      throw sesError; // Re-throw to be caught by outer catch
    }
  } catch (error) {
    console.error('Error sending email:', error);
    console.error('Error details:', {
      message: (error as Error).message,
      stack: (error as Error).stack,
      errorType: error.constructor.name
    });
    return false;
  }
} 