import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
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

            const { image, formData, startDate, endDate, status } = await request.json();

            let bannerData = [{
                uid: uuidv4(),
                title: formData.title,
                imageId: image.id,
                imageUrl: image.image.url,
                link: formData.link,
                startDate: format(new Date(startDate), 'yyyy-MM-dd HH:mm:ss'),
                endDate: format(new Date(endDate), 'yyyy-MM-dd HH:mm:ss'),
                width: formData.width,
                status: status
            }]

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

            // Merge existing and new banner data
            if (findMetaResponse?.data?.appInstallation?.metafields?.edges[0]?.node?.value) {
                let existingBanners = findMetaResponse.data.appInstallation.metafields.edges[0].node.value;
                existingBanners = JSON.parse(existingBanners);
                if (status == 1) {
                    existingBanners.forEach(banner => {
                        banner.status = 0;
                    });
                }
                existingBanners.push(...bannerData);
                bannerData = existingBanners;
            }

            // Upsert banner data
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
                return { success: false, message: "An error occurred while creating the offer banner." };
            }

            return { success: true, message: "Offer banner created." };

        } else {
            return { success: false, message: 'Failed to create the offer banner.' };
        }
    
    } catch (error) {
        return { success: false, message: "An error occurred while creating the offer banner." };
    }
}