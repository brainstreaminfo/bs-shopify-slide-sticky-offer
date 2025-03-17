import {
    Text,
    Page,
    Card,
    Layout,
    Button,
    BlockStack,
} from '@shopify/polaris';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authenticate } from "../shopify.server";
import { PlusIcon, EditIcon, DeleteIcon } from '@shopify/polaris-icons';

export const loader = async ({ request }) => {
    await authenticate.admin(request);
    return null;
};

export default function Index() {

    const navigate = useNavigate();
    const [isEnableAppLink, setIsEnableAppLink] = useState(false);
   
    // Enable App Link
    const enableAppLink = async() => {

        try {

            setIsEnableAppLink(true);

            const linkReq = await fetch('/app/enable/app/link', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });

            const linkRes = await linkReq.json();
            
            if (linkRes.success && linkRes.link) {
                window.open(linkRes.link, '_blank');
            }

            setIsEnableAppLink(false);

        } catch (error) {
            console.log(error);
        }
    }

    return (

        <Page title="Dashboard">

            <Layout>

                <Layout.Section>
                     <Card sectioned>
                        <p style={{ fontSize: "14px", fontWeight: "bold" }}>Welcome to BS Slide-In Sticky Banner!</p>
                        <p style={{ marginTop: "10px" }}>
                            BS Slide-In Sticky Banner App adds a sleek, customizable banner that sticks to the side of your store. It slides in and out, showcasing promotions, discounts, or announcements without disrupting your content. Boost customer engagement and drive conversions effortlessly!
                        </p>
                    </Card>
                </Layout.Section>

                <Layout.Section variant="oneThird">
                    <Card sectioned>
                        <p style={{ fontSize: "14px", fontWeight: "bold" }}>Application State</p>
                        <p style={{ marginTop: "8px" }}>Enable the app on your published theme.</p>
                        <p style={{  marginTop: "15px" }}>
                            <Button 
                                variant="primary"
                                onClick={() => enableAppLink()}
                                loading={isEnableAppLink}
                            >
                                Enable App
                            </Button>
                        </p>
                    </Card>
                </Layout.Section>

                <Layout.Section>
                    <Card>
                        <BlockStack gap="200">
                            <Text as="h2" variant="headingMd">
                                Setup guide
                            </Text>

                            <div style={{ background: "rgba(247, 247, 247, 1)", padding: "15px 25px", borderRadius: "10px", marginTop: "5px" }}>
                                <p style={{ fontWeight: "bold" , marginBottom: "4px" }}>Add your banners</p>
                                <p style={{ fontSize: "13px", marginBottom: "14px" }}>Write a title, add an image, include a link, set the start and end dates, set the banner width and set the status for the banner.</p>
                                <Button variant="secondary" onClick={() => navigate('/app/create/banner')}>Add banner</Button>
                            </div>

                            <div style={{ background: "rgba(247, 247, 247, 1)", padding: "15px 25px", borderRadius: "10px", marginTop: "5px", }}>
                                <p style={{ fontWeight: "bold" , marginBottom: "4px" }}>Enable app</p>
                                <p style={{ fontSize: "13px" }}>Click the top-right "Enable App" button to enable the app on your published theme.</p>
                            </div>

                        </BlockStack>
                    </Card>
                </Layout.Section>

            </Layout>

        </Page>
    );
}