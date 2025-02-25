import { authenticate } from "../shopify.server";

export const action = async ({ request }) => {

  const { payload, session, topic, shop } = await authenticate.webhook(request);

  console.log('Webhook topic:', topic);

  if (topic == "CUSTOMERS_DATA_REQUEST") {
    console.log('Webhook payload:', JSON.stringify(payload, null, 2));
    return new Response();

  } else if (topic == "CUSTOMERS_REDACT") {
    console.log('Webhook payload:', JSON.stringify(payload, null, 2));
    return new Response();    

  } else if (topic == "SHOP_REDACT") {
    console.log('Webhook payload:', JSON.stringify(payload, null, 2));
    return new Response();
  }

  return new Response('Topic not found!', { status: 404 });
};