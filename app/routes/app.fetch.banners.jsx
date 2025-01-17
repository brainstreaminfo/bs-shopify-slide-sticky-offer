import { authenticate } from "../shopify.server";

export const action = async ({ request }) => {    

    const { admin } = await authenticate.admin(request);
    
    if (!admin) {
        return { success: false, message: 'Unauthenticated request.' };
    }
        
    try {

        // Get current app installation id
        const appInstallIdquery = await admin.graphql(
            `#graphql
            query {
                currentAppInstallation {
                    id
                }
            }`,
        );

        const appInstallIdResponse = await appInstallIdquery.json();
        const appInstallationId = appInstallIdResponse?.data?.currentAppInstallation?.id;

        if (appInstallationId) {
           
            // Get banners
            const findMetaquery = await admin.graphql(
                `#graphql
                query AppInstallationMetafields($ownerId: ID!) {
                    appInstallation(id: $ownerId) {
                        metafields(first: 1) {
                            edges {
                                node {
                                    id
                                    namespace
                                    key
                                    value
                                }
                            }
                        }
                    }
                }`,
                {
                  variables: {
                    "namespace": "slide-in-sticky-offer-banner",
                    "key": "bs-slideIn-banner-OV27PT",
                    "ownerId": appInstallationId
                  },
                },
            );

            let bannerData = [];
            const findMetaResponse = await findMetaquery.json();

            if (findMetaResponse?.data?.appInstallation?.metafields?.edges[0]?.node?.value) {
                bannerData = findMetaResponse.data.appInstallation.metafields.edges[0].node.value;
                bannerData = JSON.parse(bannerData);
            }

            return { success: true, data: bannerData, message: "Banners data." };

        } else {
            return { success: false, message: 'Something went wrong while fetching the offer banner.' };
        }
    
    } catch (error) {
        return { success: false, message: "An error occurred while fetching the offer banner." };
    }
}