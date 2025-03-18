import {
    Page,
    Card,
    Badge,
    Layout,
    Button,
    Pagination,
    BlockStack,
    EmptyState,
    IndexTable,
    SkeletonBodyText,
    useIndexResourceState
} from "@shopify/polaris";
import { format } from 'date-fns';
import {useState, useEffect} from 'react';
import { useNavigate } from 'react-router-dom';
import { authenticate } from "../shopify.server";
import { PlusIcon, EditIcon, DeleteIcon } from '@shopify/polaris-icons';

export const loader = async ({ request }) => {
    await authenticate.admin(request);
    return null;
}

export default function Offers() {

    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [isClient, setIsClient] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [bannersData, setBannersData] = useState([]);
    const [deleteBannerId, setDeleteBannerId] = useState("");

    // Fetch banner
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
                message: 'Error occurred. Please refresh and try again.',
                autohideDelay: 3000,
            });

        } finally {
            setLoading(false);
        }
    };

    // Only runs on component mount
    useEffect(() => {
        fetchBannerData();
        setIsClient(true);
    }, []);

    // Pagination calculations
    const itemsPerPage = 15;
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = Math.ceil(bannersData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentData = bannersData.slice(startIndex, endIndex);

    const formatToLongDateTime = (date) => {
        return new Date(date).toLocaleString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
    }

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
        ({uid, title, status, startDate, endDate, width}, index,) => (
            <IndexTable.Row
                id={uid}
                key={uid}
                selected={selectedResources.includes(uid)}
                position={index}
            >
                <IndexTable.Cell>{title}</IndexTable.Cell>
                <IndexTable.Cell>{formatToLongDateTime(startDate)}</IndexTable.Cell>
                <IndexTable.Cell>{formatToLongDateTime(endDate)}</IndexTable.Cell>
                <IndexTable.Cell>{width}</IndexTable.Cell>
                <IndexTable.Cell>
                    {status === 1 ? (
                        <Badge tone="success">Active</Badge>
                    ) : (
                        <Badge tone="critical">Inactive</Badge>
                    )}
                </IndexTable.Cell>
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

    const skeletonRowMarkup = [...Array(6)].map((_, index) => (
        <IndexTable.Row id={`skeleton-${index}`} key={`skeleton-${index}`} position={index}>
            <IndexTable.Cell><div style={{ height: "18px", paddingTop: "5px" }}><SkeletonBodyText lines={1} /></div></IndexTable.Cell>
            <IndexTable.Cell><div style={{ height: "18px", paddingTop: "5px" }}><SkeletonBodyText lines={1} /></div></IndexTable.Cell>
            <IndexTable.Cell><div style={{ height: "18px", paddingTop: "5px" }}><SkeletonBodyText lines={1} /></div></IndexTable.Cell>
        </IndexTable.Row>
    ));

    const emptyStateMarkup = (
        <EmptyState
            heading="Add your banners"
            image="/build/client/images/empty.svg"
        >
            <p>Create an banner to showcase special offers to your customers.</p>
        </EmptyState>
    );

    // Show Delete Modal
    const showModal = (id) => {
        document.getElementById('confirm-modal').show();
        setDeleteBannerId(id);
    };

    // Delete Banner
    const deleteBanner = async() => {

        try {

            setIsDeleting(true);

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

                const remainingItems = bannersData.length - 1;
                if (remainingItems > 0 && startIndex >= remainingItems) {
                    setCurrentPage(prev => Math.max(prev - 1, 1));
                }

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
                message: 'Failed to delete banner.',
                autohideDelay: 3000,
            });

        } finally {
            setIsDeleting(false);
            document.getElementById('confirm-modal').hide();
        }
    };

    return (
        <Page 
            backAction={{content: 'home', url: '/app'}}
            title="Banners"
            primaryAction={
                <Button variant="primary" onClick={() => navigate('/app/create/banner')} icon={PlusIcon}>Add Banner</Button>
            }
            fullWidth
        >
            <BlockStack gap="500">
                <Layout>
                    <Layout.Section>
                        <Card>
                            <div style={{ margin: "-15px" }}>
                                {isClient && (
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
                                                        {title: 'Start Date'},
                                                        {title: 'End Date'},
                                                        {title: 'Width'},
                                                        {title: 'Status'},
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
                        </Card>
                    </Layout.Section>
                </Layout>
            </BlockStack>

            <ui-modal id="confirm-modal" variant="small">
                <ui-title-bar title="Are you sure?">
                <button variant="primary" id='delete-banner-btn' onClick={() => deleteBanner()} disabled={isDeleting}>{isDeleting ? 'Deleting...' : 'Yes, Delete it'}</button>
                <button onClick={() => document.getElementById('confirm-modal').hide()} disabled={isDeleting}>Cancel</button>
                </ui-title-bar>
                <p style={{ padding: '16px 12px', fontSize: '15px' }}>You want to delete banner?</p>
            </ui-modal>

        </Page>
    );
}