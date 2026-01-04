#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise(resolve => rl.question(query, resolve));

const loadEnv = () => {
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = {};
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          envVars[key.trim()] = valueParts.join('=').trim();
        }
      }
    });
    Object.assign(process.env, envVars);
  }
};

const formatPhoneNumber = (phone) => {
  return phone.replace(/\D/g, '');
};

const sendWhatsApp = async (accessToken, phoneNumberId, to, messageText) => {
  const phoneNumber = formatPhoneNumber(to);
  
  if (!phoneNumber || phoneNumber.length < 10) {
    throw new Error('Invalid phone number');
  }
  
  const url = `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`;
  
  const requestBody = {
    messaging_product: 'whatsapp',
    to: phoneNumber,
    type: 'text',
    text: {
      body: messageText.substring(0, 4096)
    }
  };
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });
  
  const responseText = await response.text();
  
  if (!response.ok) {
    let errorData;
    try {
      errorData = JSON.parse(responseText);
      const errorCode = errorData?.error?.code;
      const errorMessage = errorData?.error?.message || '';
      
      if (errorCode === 190) {
        throw new Error(`Token expired (190): ${errorMessage}`);
      }
      
      throw new Error(`WhatsApp API Error (${errorCode}): ${errorMessage}`);
    } catch (e) {
      if (e.message.includes('Token expired') || e.message.includes('WhatsApp API Error')) {
        throw e;
      }
      throw new Error(`Request failed: ${responseText}`);
    }
  }

  let result;
  try {
    result = JSON.parse(responseText);
  } catch (e) {
    throw new Error(`Invalid response: ${responseText}`);
  }
  
  if (result.error) {
    throw new Error(`WhatsApp Error: ${JSON.stringify(result.error)}`);
  }

  if (result.messages && result.messages[0] && result.messages[0].id) {
    return { success: true, messageId: result.messages[0].id };
  }

  throw new Error(`Unexpected response: ${JSON.stringify(result)}`);
};

const main = async () => {
  try {
    loadEnv();
    
    const accessToken = process.env.EXPO_PUBLIC_WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.EXPO_PUBLIC_WHATSAPP_PHONE_NUMBER_ID;
    const iosPhone = process.env.EXPO_PUBLIC_WHATSAPP_ALERT_PHONE_IOS;
    const androidPhone = process.env.EXPO_PUBLIC_WHATSAPP_ALERT_PHONE_ANDROID;
    
    if (!accessToken) {
      console.error('Error: EXPO_PUBLIC_WHATSAPP_ACCESS_TOKEN not set in .env');
      process.exit(1);
    }
    
    if (!phoneNumberId) {
      console.error('Error: EXPO_PUBLIC_WHATSAPP_PHONE_NUMBER_ID not set in .env');
      process.exit(1);
    }
    
    if (!iosPhone || !androidPhone) {
      console.error('Error: Both EXPO_PUBLIC_WHATSAPP_ALERT_PHONE_IOS and EXPO_PUBLIC_WHATSAPP_ALERT_PHONE_ANDROID must be set in .env');
      process.exit(1);
    }
    
    const eventType = process.argv[2] || 'panic';
    const validEventTypes = ['panic', 'check_in_missed', 'alert'];
    const selectedEventType = validEventTypes.includes(eventType) ? eventType : 'panic';
    
    const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    const alertTypeText = selectedEventType === 'panic' 
      ? '🚨 PANIC ALERT' 
      : selectedEventType === 'check_in_missed' 
        ? '⏰ MISSED CHECK-IN' 
        : '⚠️ SAFETY ALERT';
    
    let messageText = `${alertTypeText}\n\n`;
    messageText += `User: Test User\n`;
    messageText += `Time: ${timestamp}\n\n`;
    messageText += `Location: 12.971598, 77.594566\n`;
    messageText += `Map: https://www.google.com/maps?q=12.971598,77.594566\n`;
    messageText += `Battery: 85% (Test Device)\n`;
    
    console.log('\n🧪 Testing both iOS and Android phone numbers from .env\n');
    
    console.log('📱 Testing iOS phone number...');
    console.log(`Phone Number ID: ${phoneNumberId}`);
    console.log(`To (iOS): ${iosPhone}`);
    console.log(`Message: ${messageText.substring(0, 100)}${messageText.length > 100 ? '...' : ''}\n`);
    
    try {
      const iosResult = await sendWhatsApp(accessToken, phoneNumberId, iosPhone, messageText);
      console.log('✅ iOS Success!');
      console.log(`Message ID: ${iosResult.messageId}\n`);
    } catch (error) {
      console.error('❌ iOS Error:', error.message);
      console.log('');
    }
    
    console.log('📱 Testing Android phone number...');
    console.log(`Phone Number ID: ${phoneNumberId}`);
    console.log(`To (Android): ${androidPhone}`);
    console.log(`Message: ${messageText.substring(0, 100)}${messageText.length > 100 ? '...' : ''}\n`);
    
    try {
      const androidResult = await sendWhatsApp(accessToken, phoneNumberId, androidPhone, messageText);
      console.log('✅ Android Success!');
      console.log(`Message ID: ${androidResult.messageId}\n`);
    } catch (error) {
      console.error('❌ Android Error:', error.message);
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('Token expired')) {
      console.error('\n💡 Token has expired. Update EXPO_PUBLIC_WHATSAPP_ACCESS_TOKEN in .env');
    }
    process.exit(1);
  } finally {
    rl.close();
  }
};

main();

