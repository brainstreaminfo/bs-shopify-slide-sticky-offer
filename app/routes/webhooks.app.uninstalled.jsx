import db from "../db.server";
import nodemailer from "nodemailer";
import { authenticate } from "../shopify.server";

// Email configuration
let transporter = nodemailer.createTransport({
  host: 'smtppro.zoho.com',
  port: 587,
  secure: false, // true for 465 (SSL), false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const sendUninstallEmail = async (store) => {

  try {
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: `${store.email}`,
      subject: `Uninstalled BS Slide-In Sticky Banner? We'd Appreciate Your Feedback`,
      html: `
        <div style="max-width: 700px; margin: auto; border: 1px solid #e3e3e3; border-radius: 10px; padding: 20px; font-family: Arial, sans-serif; padding: 0px">

          <div style="height: 7px; background: #f37022; border-top-left-radius: 10px; border-top-right-radius: 10px;"></div>

          <div style="padding: 15px 20px;">

            <h3>Hi ${store.name},</h3>
            
            <p>We noticed you recently uninstalled the <strong>BS Slide-In Sticky Banner</strong> app. We're always striving to improve, and your feedback is incredibly valuable to us.</p>

            <p style="margin-bottom: 2px;">Would you mind sharing why you uninstalled the app?</p>
            <a href="https://docs.google.com/forms/d/e/1FAIpQLSeGolIHP-eZOZlEJqCxr3R96mchBwOJl_Ad4ckW4KidLifdrA/viewform" target="_blank">Share Your Feedback</a>
            
            <p>Whether it was missing features, performance issues, or simply a change in needs — we’d love to hear from you.</p>
            <p>Thanks again for trying BS Slide-In Sticky Banner, and we hope to serve you better in the future.</p>

            <p style="margin-bottom: 0px;">Best regards.</p>
            <p style="margin-top: 0px;">The BS Slide-In Sticky Banner Team</p>

          </div>

        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Uninstall email sent for shop: ${store.domain}`);

  } catch (error) {
    console.error('Error sending uninstall email:', error);
  }
};

export const action = async ({ request }) => {

  try {

    const { payload, shop, session } = await authenticate.webhook(request);

    if (session) {
      await db.session.deleteMany({ where: { shop } });
    }

    if (!payload) {
      return new Response('Empty payload found!', { status: 400 });
    }

    await sendUninstallEmail(payload);

    return new Response();

  } catch (error) {
    return new Response('Internal server error.', { status: 500 });
  }
};