import { Injectable, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService implements OnModuleInit {

  onModuleInit() {
    const serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS!);

    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      });
    }

    console.log('✅ Firebase initialized'); 
  }

  async sendPush({
    tittle,
    message,
    deviceToken,
    status,
    type,
    data,
  }: any) {

    if (!deviceToken) {
      console.error('❌ No FCM token provided');
      return;
    }

    try {
      await admin.messaging().send({
        token: deviceToken,
        notification: {
          title: tittle,
          body: message,
        },
        data: {
          type: type || 'notification',
          message,
          status: status || '',
          provider: JSON.stringify(data || {}),
        },
      });

      console.log('✅ Push sent successfully!');
    } catch (error) {
      console.error('❌ Error sending push:', error);
    }
  }

  async sendPushToAll(
    title: string,
    message: string,
    topic: string,
    type?: string,
  ) {
    try {
      await admin.messaging().send({
        topic,
        notification: {
          title,
          body: message,
        },
        data: {
          type: type || 'notification_all',
        },
      });

      console.log('✅ Push broadcasted!');
    } catch (error) {
      console.error('❌ Error sending push to all:', error);
    }
  }

  async subscribeToTopic(deviceToken: string, topic: string) {
    try {
      await admin.messaging().subscribeToTopic(deviceToken, topic);
      console.log(`✅ Subscribed to ${topic}`);
    } catch (error) {
      console.error('❌ Error subscribing:', error);
    }
  }
}