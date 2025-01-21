import { authenticate } from "../shopify.server";

// Add timeout delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Retry mechanism for getFileRequest
const retryRequest = async (requestFunction, retries = 3, delayTime = 1000) => {

    let attempt = 0;
    let lastError;

    while (attempt < retries) {
        try {
            const response = await requestFunction();
            return response;
        } catch (error) {
            attempt++;
            lastError = error;
            if (attempt < retries) {
                await delay(delayTime);
            }
        }
    }

    throw lastError;
};

export const action = async ({ request }) => {    

    try {
        
        const { admin } = await authenticate.admin(request);
        
        if (!admin) {
            return { success: false, message: 'Unauthenticated request.' };
        }

        // Get the file data from the request
        const formData = await request.formData();
        const file = formData.get('file');
        const imageId = formData.get('imageId');

        if (!file || !(file instanceof File)) {
            return { success: false, message: 'Image not found.' };
        }

        // First, get the staged upload URL from Shopify
        const imgRequest = await admin.graphql(
            `#graphql
            mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
                stagedUploadsCreate(input: $input) {
                    stagedTargets {
                        url
                        resourceUrl
                        parameters {
                            name
                            value
                        }
                    }
                }
            }`,
            {
                variables: {
                    "input": [
                        {
                            "filename": file.name,
                            "mimeType": file.type,
                            "httpMethod": "POST",
                            "resource": "FILE"
                        }
                    ]
                },
            },
        );
        
        const imgResponse = await imgRequest.json();

        if (imgResponse?.data?.stagedUploadsCreate?.stagedTargets[0]) {

            try {

                const { url, parameters, resourceUrl } = imgResponse.data.stagedUploadsCreate.stagedTargets[0];                
                const s3FormData = new FormData();
                
                parameters.forEach(param => {
                    s3FormData.append(param.name, param.value);
                });
                
                s3FormData.append('file', file);

                const s3UploadRequest = await fetch(url, {
                    method: 'POST',
                    body: s3FormData,
                });

                if (!s3UploadRequest.ok) {
                    return { success: false, message: 'Failed to upload Image.' };
                }

                // Create file on shopify
                const fileRequest = await admin.graphql(
                    `#graphql
                    mutation fileCreate($files: [FileCreateInput!]!) {
                        fileCreate(files: $files) {
                            files {
                                id
                                fileStatus
                                alt
                                createdAt
                                preview {
                                    image {
                                        url
                                    }
                                }
                            }
                        }
                    }`,
                    {
                        variables: {
                            "files": [{
                                "alt": "Image",
                                "contentType": "IMAGE",
                                "originalSource": resourceUrl
                            }]
                        },
                    },
                );

                const fileResponse = await fileRequest.json();

                if (fileResponse?.data?.fileCreate?.files[0]?.id) {

                    try {

                        await delay(1000);

                        // Fetch the file details
                        const getFileRequest = async () => {

                            const getFileRequest = await admin.graphql( 
                                `#graphql
                                query {
                                    node(id: "${fileResponse.data.fileCreate.files[0].id}") {
                                        id
                                        ... on MediaImage {
                                            image {
                                                url
                                            }
                                        }
                                    }
                                }`
                            );

                            return await getFileRequest.json();
                        };

                        // Delete old image
                        const deleteOldImg = async () => {

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
                        };

                        const getFileResponse = await getFileRequest();

                        if (getFileResponse?.data?.node?.image?.url) {
                            if (imageId) { await deleteOldImg(); }
                            return { success: true, data: getFileResponse.data.node, message: 'Image uploaded.' };

                        } else {
                            const retryResponse = await retryRequest(getFileRequest, 3, 1000);
                            if (retryResponse?.data?.node?.image?.url) {
                                if (imageId) { await deleteOldImg(); }
                                return { success: true, data: retryResponse.data.node, message: 'Image uploaded after retry.'};
                            } else {
                                return { success: false, message: 'Failed to upload the image.' };
                            }
                        }

                    } catch (error) {
                        return { success: false, message: 'An error occurred while uploading the image.' };
                    }

                } else {
                    return { success: false, message: 'Failed to upload the image.' };
                }

            } catch (error) {                
                return { success: false, message: 'An error occurred while uploading the image.' };
            }

        } else {
            return { success: false, message: 'Failed to upload the image.' };
        }
        
    } catch (error) {        
        return { success: false, message: 'An error occurred while uploading the image.' };
    }
};