import {
    Page,
    Card,
    Layout,
    Button,
    IndexTable,
    BlockStack,
    InlineGrid,
    EmptyState,
    Pagination,
    SkeletonBodyText,
    useIndexResourceState
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
    const [bannersData, setBannersData] = useState([]);
    const [deleteBannerId, setDeleteBannerId] = useState("");
    const [loading, setLoading] = useState(true);
    const [isClient, setIsClient] = useState(true);
    const [isEnableAppLink, setIsEnableAppLink] = useState(false);

    const fetchBannerData = async () => {

        try {

            const fetchBanners = await fetch('/app/fetch/banners', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });

            const bannersResponse = await fetchBanners.json();

            if (bannersResponse.success) {
                setBannersData(bannersResponse.data);
            }

        } catch (error) {
            $.wnoty({
                type: 'error',
                message: 'An error occurred. Please refresh the page and try again.',
                autohideDelay: 3000,
            });

        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBannerData();
        setIsClient(false);
    }, []);

    // Pagination calculations
    const itemsPerPage = 10;
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = Math.ceil(bannersData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentData = bannersData.slice(startIndex, endIndex);

    const handlePreviousPage = () => {
        setCurrentPage(prev => Math.max(prev - 1, 1));
    };

    const handleNextPage = () => {
        setCurrentPage(prev => Math.min(prev + 1, totalPages));
    };

    // Table Resource
    const resourceName = {
        singular: 'banner',
        plural: 'banners',
    };

    const {selectedResources} = useIndexResourceState(currentData);

    const rowMarkup = currentData.map(
        ({uid, title, priority, startDate, endDate, width}, index,) => (
            <IndexTable.Row
                id={uid}
                key={uid}
                selected={selectedResources.includes(uid)}
                position={index}
            >
                <IndexTable.Cell>{title}</IndexTable.Cell>
                <IndexTable.Cell>{priority}</IndexTable.Cell>
                <IndexTable.Cell>{format(new Date(startDate), 'MMMM d, yyyy h:mm aa')}</IndexTable.Cell>
                <IndexTable.Cell>{format(new Date(endDate), 'MMMM d, yyyy h:mm aa')}</IndexTable.Cell>
                <IndexTable.Cell>{width}</IndexTable.Cell>
                <IndexTable.Cell>
                    <div>
                        <span style={{ paddingRight: "5px" }}>
                            <Button icon={EditIcon} onClick={() => navigate(`/app/edit/banner?uid=${uid}`)} accessibilityLabel="Edit banner" />
                        </span>
                        <Button icon={DeleteIcon} onClick={() => showModal(uid)} accessibilityLabel="Edit banner" />
                    </div>
                </IndexTable.Cell>
            </IndexTable.Row>
        ),
    );

    const skeletonRowMarkup = [...Array(5)].map((_, index) => (
        <IndexTable.Row id={`skeleton-${index}`} key={`skeleton-${index}`} position={index}>
            <IndexTable.Cell><div style={{ height: "18px", paddingTop: "5px" }}><SkeletonBodyText lines={1} /></div></IndexTable.Cell>
            <IndexTable.Cell><div style={{ height: "18px", paddingTop: "5px" }}><SkeletonBodyText lines={1} /></div></IndexTable.Cell>
            <IndexTable.Cell><div style={{ height: "18px", paddingTop: "5px" }}><SkeletonBodyText lines={1} /></div></IndexTable.Cell>
        </IndexTable.Row>
    ));

    const emptyStateMarkup = (
        <EmptyState
            heading="Create offer banner"
            image="https://cdn.shopify.com/shopifycloud/web/assets/v1/vite/client/en/assets/empty-state-media-DnFQWaULcLdk.svg"
        >
            <p>Create an offer banner to showcase special offers to your customers.</p>
        </EmptyState>
    );

    // Show Delete Modal
    const showModal = (id) => {
        document.getElementById('confirm-modal').show();
        setDeleteBannerId(id);
    };

    // Delete Banner
    const deleteBanner = async() => {

        const button = document.getElementById('delete-banner-btn');
        button.disabled = true;

        try {

            const deleteBanner = await fetch('/app/delete/banner', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    uid: deleteBannerId,
                }),
            });

            const deleteResponse = await deleteBanner.json();

            if (deleteResponse.success) {
                setDeleteBannerId("");
                fetchBannerData();
                $.wnoty({
                    type: 'success',
                    message: deleteResponse.message,
                    autohideDelay: 3000,
                });

            } else {
                $.wnoty({
                    type: 'error',
                    message: deleteResponse.message,
                    autohideDelay: 3000,
                });
            }

        } catch (error) {
            $.wnoty({
                type: 'error',
                message: 'Something went wrong while deleting the offer banner.',
                autohideDelay: 3000,
            });

        } finally {
            document.getElementById('confirm-modal').hide();
            button.disabled = false;
        }
    };

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
                        <p style={{ fontSize: "14px", fontWeight: "bold" }}>Welcome to BS SlideIn Sticky Offer Banner!</p>
                        <p style={{ marginTop: "10px" }}>
                            SlideIn Sticky Offer Banner App adds a sleek, customizable banner that sticks to the side of your store. It slides in and out, showcasing promotions, discounts, or announcements without disrupting your content. Boost customer engagement and drive conversions effortlessly!
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

            </Layout>

            <div style={{ marginTop: "15px" }}>

                <Card roundedAbove="sm">

                    <BlockStack gap="200">

                        <InlineGrid columns="1fr auto">
                            <div style={{ fontSize: "17px", fontWeight: "bold" }}>
                                Offer Banners
                            </div>
                            <Button
                                onClick={() => navigate('/app/create/banner')}
                                accessibilityLabel="Create Banner"
                                icon={PlusIcon}
                                variant="primary"
                                size="slim"
                            >
                                Create Banner
                            </Button>
                        </InlineGrid>
                      
                        <div style={{ margin: "5px -15px -15px -15px" }}>

                        {!isClient && (

                            <>
                                {loading ? (

                                    <IndexTable
                                        resourceName={resourceName}
                                        itemCount={5}
                                        headings={[]}
                                        selectable={false}
                                    >
                                        {skeletonRowMarkup}
                                    </IndexTable>

                                ) : (

                                    <>
                                        <IndexTable
                                            resourceName={resourceName}
                                            itemCount={currentData.length}
                                            emptyState={emptyStateMarkup}
                                            headings={[
                                                {title: 'Title'},
                                                {title: 'Priority'},
                                                {title: 'Start Date'},
                                                {title: 'End Date'},
                                                {title: 'Width'},
                                                {title: 'Action'}
                                            ]}
                                            selectable={false}
                                        >
                                            {rowMarkup}
                                        </IndexTable>

                                        {totalPages > 1 && (
                                            <div style={{ padding: "16px", display: "flex", justifyContent: "center" }}>
                                                <Pagination
                                                    label={`Page ${currentPage} of ${totalPages}`}
                                                    hasPrevious={currentPage > 1}
                                                    onPrevious={handlePreviousPage}
                                                    hasNext={currentPage < totalPages}
                                                    onNext={handleNextPage}
                                                />
                                            </div>
                                        )}
                                    </>
                                )}
                            </>
                        )}

                        </div>

                    </BlockStack>

                </Card>
                
            </div>

            <ui-modal id="confirm-modal" variant="small">
                <ui-title-bar title="Delete Offer Banner">
                <button variant="primary" id='delete-banner-btn' onClick={() => deleteBanner()} >Yes, Delete it</button>
                <button onClick={() => document.getElementById('confirm-modal').hide()}>Cancel</button>
                </ui-title-bar>
                <p style={{ padding: '16px 12px', fontSize: '15px' }}>Are you sure you want to delete?</p>
            </ui-modal>

        </Page>
    );
}