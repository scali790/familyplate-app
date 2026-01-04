import axios from "axios";

const apiKey = process.env.MAILJET_API_KEY || "";
const secretKey = process.env.MAILJET_SECRET_KEY || "";

console.log('Checking Mailjet sender verification status...\n');

if (!apiKey || !secretKey) {
  console.error('❌ Mailjet credentials not set!');
  process.exit(1);
}

const auth = Buffer.from(`${apiKey}:${secretKey}`).toString("base64");

async function checkSenders() {
  try {
    const response = await axios.get("https://api.mailjet.com/v3/REST/sender", {
      headers: {
        "Authorization": `Basic ${auth}`,
      },
    });

    console.log('✅ Successfully connected to Mailjet API\n');
    
    const senders = response.data.Data || [];
    
    if (senders.length === 0) {
      console.log('⚠️  No sender addresses found in your Mailjet account');
      console.log('\nYou need to add and verify noreply@familyplate.ai as a sender:');
      console.log('1. Go to https://app.mailjet.com/account/sender');
      console.log('2. Click "Add a Sender Address"');
      console.log('3. Enter: noreply@familyplate.ai');
      console.log('4. Verify the email address by clicking the link sent to your domain admin');
    } else {
      console.log(`Found ${senders.length} sender address(es):\n`);
      
      senders.forEach((sender: any) => {
        const email = sender.Email || sender.EmailAddress;
        const status = sender.Status;
        const isActive = sender.IsDefaultSender;
        
        console.log(`📧 ${email}`);
        console.log(`   Status: ${status}`);
        console.log(`   Default: ${isActive ? 'Yes' : 'No'}`);
        
        if (email === 'noreply@familyplate.ai') {
          if (status === 'Active') {
            console.log('   ✅ VERIFIED - Ready to send emails!');
          } else {
            console.log(`   ⚠️  NOT VERIFIED - Status: ${status}`);
            console.log('   You must verify this sender before sending emails');
          }
        }
        console.log('');
      });
      
      const familyPlateSender = senders.find((s: any) => 
        (s.Email || s.EmailAddress) === 'noreply@familyplate.ai'
      );
      
      if (!familyPlateSender) {
        console.log('❌ noreply@familyplate.ai is NOT in your sender list!');
        console.log('\nYou need to add it:');
        console.log('1. Go to https://app.mailjet.com/account/sender');
        console.log('2. Click "Add a Sender Address"');
        console.log('3. Enter: noreply@familyplate.ai');
        console.log('4. Verify the email address');
      }
    }
  } catch (error: any) {
    console.error('❌ Error checking senders:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
}

checkSenders();
