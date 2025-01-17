import { authenticate } from "../shopify.server";

export const action = async ({ request }) => {    

    try {

        // Authenticate Admin
        const { admin } = await authenticate.admin(request);

        if (!admin) {
            return { success: false, message: 'Unauthenticated request.' };
        }

        // GraphQL Query to Fetch Shop Details
        const shopQuery = `
            query {
                shop {
                    id
                    primaryDomain {
                        url
                    }
                }
            }
        `;

        const req = await admin.graphql(shopQuery);

        if (req.ok) {

            const shopDataResponse = await req.json();
            const shopDetails = shopDataResponse?.data?.shop;

            if (shopDetails) {

                const shopDomain = shopDetails?.primaryDomain?.url;
                const uuid = process.env.SHOPIFY_BS_SLIDEIN_STICKY_OFFER_BANNER_ID
                
                if (shopDomain && uuid) {
                    const link = `${shopDomain}/admin/themes/current/editor?context=apps&template=index&activateAppId=${uuid}/offer-banner`;
                    return { success: true, link: link, message: "Enable app link." };
                } else {
                    return { success: false, message: "Something went wrong while creating the link." };
                }

            } else {
                return { success: false, message: "Something went wrong while creating the link." };
            }

        } else {
            return { success: false, message: "Something went wrong while creating the link." };
        }
       
    } catch (error) {
        return { success: false, message: "Something went wrong while creating the link." };
    }
}