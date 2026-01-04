import Mailjet from "node-mailjet";

const apiKey = process.env.MAILJET_API_KEY || "";
const secretKey = process.env.MAILJET_SECRET_KEY || "";

console.log('Testing Mailjet API...');
console.log('API Key:', apiKey ? `SET (${apiKey.substring(0, 8)}...)` : 'NOT SET');
console.log('Secret Key:', secretKey ? `SET (${secretKey.substring(0, 8)}...)` : 'NOT SET');

if (!apiKey || !secretKey) {
  console.error('❌ Mailjet credentials not set!');
  process.exit(1);
}

const mailjet = Mailjet.apiConnect(apiKey, secretKey);

async function testEmail() {
  try {
    const result = await mailjet
      .post('send', { version: 'v3.1' })
      .request({
        Messages: [
          {
            From: {
              Email: 'noreply@familyplate.ai',
              Name: 'FamilyPlate'
            },
            To: [
              {
                Email: 'test@example.com',
                Name: 'Test User'
              }
            ],
            Subject: 'Test Email from FamilyPlate',
            TextPart: 'This is a test email',
            HTMLPart: '<h1>Test Email</h1><p>This is a test email from FamilyPlate.</p>'
          }
        ]
      });

    console.log('✅ Email sent successfully!');
    console.log('Status:', result.response.status);
    console.log('Response:', JSON.stringify(result.body, null, 2));
  } catch (err: any) {
    console.error('❌ Error sending email:');
    console.error('Status:', err.statusCode);
    console.error('Message:', err.message);
    if (err.response?.body) {
      console.error('Error details:', JSON.stringify(err.response.body, null, 2));
    }
    process.exit(1);
  }
}

testEmail();
