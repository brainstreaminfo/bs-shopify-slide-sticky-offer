import { format } from 'date-fns';
import { authenticate } from "../shopify.server";

const updateObjectInArray = (array, { uid, image, formData, startDate, endDate }) => {
    array.forEach(obj => {
        if (obj.uid === uid) {
            if (formData.title !== undefined) obj.title = formData.title;
            if (formData.link !== undefined) obj.link = formData.link;
            if (formData.priority !== undefined) obj.priority = formData.priority;
            if (formData.width !== undefined) obj.width = formData.width;
            if (startDate !== undefined) obj.startDate = format(new Date(startDate), 'yyyy-MM-dd HH:mm:ss');
            if (endDate !== undefined) obj.endDate = format(new Date(endDate), 'yyyy-MM-dd HH:mm:ss');
            if (image && image?.id && image?.image?.url) {
                if (image.image.url !== undefined) obj.imageUrl = image.image.url;
                if (image.id !== undefined) obj.imageId = image.id;
            }
        }
    });
    return array;
};

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

            const { uid, image, formData, startDate, endDate, imageId } = await request.json();

            // Get existing banner data
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
                const bannerData = updateObjectInArray(existingBanners, { uid, image, formData, startDate, endDate })

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
                    return { success: false, message: "An error occurred while updating the offer banner." };
                }

                // Delete banner image if image changed
                if (image && imageId) {
                    await admin.graphql(
                        `#graphql
                        mutation fileDelete($input: [ID!]!) {
                            fileDelete(fileIds: $input) {
                                deletedFileIds
                            }
                        }`,
                        {
                            variables: {
                                "input": [imageId]
                            },
                        },
                    );
                }
                
                return { success: true, message: "Offer banner has been updated." };

            }  else {
                return { success: false, message: 'Something went wrong while updating the offer banner.' };
            }

        } else {
            return { success: false, message: 'Something went wrong while updating the offer banner.' };
        }
    
    } catch (error) {        
        return { success: false, message: "An error occurred while updating the offer banner." };
    }
}