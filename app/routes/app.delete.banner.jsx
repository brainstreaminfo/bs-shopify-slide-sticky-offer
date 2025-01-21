import { authenticate } from "../shopify.server";

export const action = async ({ request }) => {    
        
    try {

        const { admin } = await authenticate.admin(request);
            
        if (!admin) {
            return { success: false, message: 'Unauthenticated request.' };
        }

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

            const { uid } = await request.json();

            // Get existing banners
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

            const findMetaResponse = await findMetaquery.json();

            if (findMetaResponse?.data?.appInstallation?.metafields?.edges[0]?.node?.value) {

                let existingBanners = findMetaResponse.data.appInstallation.metafields.edges[0].node.value;
                existingBanners = JSON.parse(existingBanners);
                const imageIdToRemove = existingBanners.find(item => item.uid === uid)?.imageId;
                let bannerData = existingBanners.filter(item => item.uid !== uid);
           
                if (bannerData.length === 0) {
                    bannerData = [];
                }

                // Delete banner image
                try {
                    
                    await admin.graphql(
                        `#graphql
                        mutation fileDelete($input: [ID!]!) {
                            fileDelete(fileIds: $input) {
                                deletedFileIds
                            }
                        }`,
                        {
                            variables: {
                                "input": [imageIdToRemove]
                            },
                        },
                    );
                    
                } catch (error) {
                    return { success: false, message: 'Failed to delete the offer banner.' };
                }

                // Update banner data
                const createMetaquery = await admin.graphql(
                    `#graphql
                    mutation CreateAppDataMetafield($metafieldsSetInput: [MetafieldsSetInput!]!) {
                        metafieldsSet(metafields: $metafieldsSetInput) {
                            metafields {
                                id
                                namespace
                                key
                                value
                            }
                            userErrors {
                                field
                                message
                            }
                        }
                    }`,
                    {
                        variables: {
                            metafieldsSetInput: [
                                {
                                    namespace: "slide-in-sticky-offer-banner",
                                    key: "bs-slideIn-banner-OV27PT",
                                    type: "json",
                                    ownerId: appInstallationId,
                                    value: JSON.stringify(bannerData),
                                }
                            ]
                        }
                    }
                );

                const createMetaResponse = await createMetaquery.json();
                    
                if (createMetaResponse?.data?.metafieldsSet?.metafields?.userErrors?.length) {                
                    return { success: false, message: "An error occurred while deleting the offer banner." };
                }

                return { success: true, message: "Offer banner deleted." };

            } else {
                return { success: false, message: 'Failed to delete the offer banner..' };
            }

        } else {
            return { success: false, message: 'Failed to delete the offer banner..' };
        }
    
    } catch (error) {        
        return { success: false, message: "An error occurred while deleting the offer banner." };
    }
}