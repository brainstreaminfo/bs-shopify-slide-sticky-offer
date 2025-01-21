import {
    Box,
    Page,
    Icon,
    Card,
    Button,
    Layout,
    DropZone,
    Thumbnail,
    TextField,
    BlockStack,
    ButtonGroup,
    SkeletonPage,
    SkeletonBodyText,
    SkeletonDisplayText
} from '@shopify/polaris';
import DatePicker from "react-datepicker";
import { useLocation } from 'react-router-dom';
import { authenticate } from "../shopify.server";
import "react-datepicker/dist/react-datepicker.css";
import { useState, useEffect, useCallback } from 'react';
import { NoteIcon, AlertCircleIcon, XIcon } from '@shopify/polaris-icons';

export const loader = async ({ request }) => {
    await authenticate.admin(request);
    return null;
};

export default function EditBanner() {

    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const uid = queryParams.get('uid');
    const [loading, setLoading] = useState(true);
    const [isSaveLoading, setIsSaveLoading] = useState(false);
    const [bannerData, setBannerData] = useState([]);
    const [imageUrl, setImageUrl] = useState("");
    const [imageId, setImageId] = useState("");
    const [isImageCahnged, setIsImageCahnged] = useState(false);
    const [statusIndex, setStatusIndex] = useState(0);

    const handleStatusClick = useCallback(
        (index) => {
            if (statusIndex === index) return;
            setStatusIndex(index);
        },
        [statusIndex],
    );

    const fetchBannerData = async (uid) => {

        try {

            const response = await fetch('/app/fetch/banners', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
    
            if (!response.ok) {
                $.wnoty({
                    type: 'error',
                    message: 'Banner details not found!',
                    autohideDelay: 3000,
                });
                return
            }
    
            const bannersResponse = await response.json();
    
            if (!bannersResponse.success) {
                $.wnoty({
                    type: 'error',
                    message: 'Banner details not found. Please refresh the page.',
                    autohideDelay: 3000,
                });
                return
            }
    
            const banner = bannersResponse.data.find(item => item.uid === uid);
    
            if (!banner) {
                $.wnoty({
                    type: 'error',
                    message: 'Banner details not found!',
                    autohideDelay: 3000,
                });
                return
            }

            setBannerData(banner);
            setTimeout(() => { setLoading(false); }, 1000);

        } catch (error) {
            $.wnoty({
                type: 'error',
                message: 'Banner details not found!',
                autohideDelay: 3000,
            });
        }
    };
    
    useEffect(() => {
        if (uid) {
            fetchBannerData(uid);
        }
    }, [uid]);

    const [formValues, setFormValues] = useState({
        title: "",
        link: "",
        width: 576,
    });

    const [formErrors, setFormErrors] = useState({
        title: "",
        link: "",
        image: "",
        width: ""
    });

    const handleChange = (event, name) => {
        setFormValues(prevValues => ({
            ...prevValues,
            [name]: event
        }));

        if (formErrors[name]) {
            setFormErrors(prevErrors => ({
                ...prevErrors,
                [name]: "",
            }));
        }
    };

    // Start Date
    const [startDate, setStartDate] = useState(new Date());
    const handleStartDateChange = (date) => {
        const formattedDate = new Date(date);
        setStartDate(formattedDate);        
    };

    // End Date
    const [endDate, setEndDate] = useState(() => new Date(Date.now() + 86400000));
    const handleEndDateChange = (date) => {
        const formattedDate = new Date(date);
        setEndDate(formattedDate);        
    };

    useEffect(() => {
        if (bannerData) {
            setFormValues({
                uid: bannerData.uid,
                title: bannerData.title,
                link: bannerData.link,
                width: bannerData.width,
            });
            setStartDate(bannerData.startDate ? new Date(bannerData.startDate.replace(' ', 'T')) : new Date())
            setEndDate(bannerData.endDate ? new Date(bannerData.endDate.replace(' ', 'T')) : new Date())
            setImageUrl(bannerData.imageUrl)
            setImageId(bannerData.imageId)
            setStatusIndex(bannerData.status)
        }
    }, [bannerData]);

    // Image
    const imageParts = imageUrl ? imageUrl.split('/').pop().split('?')[0] : "";
    const [imageName] = imageParts ? imageParts.split('.') : ["", ""];
    const [file, setFile] = useState("");
    const handleDropZoneDrop = useCallback(
        (_dropFiles, acceptedFiles, _rejectedFiles) => {
            setImageUrl("");
            setFile(acceptedFiles[0]);
            setIsImageCahnged(true);
        },
        [],
    );

    const validImageTypes = ['image/jpg', 'image/jpeg', 'image/png'];
    const fileUpload = !file && !imageUrl && (
        <DropZone.FileUpload actionHint="Accepts .jpg, .jpeg, and .png" />
    );
        
    const uploadedFile = (file || imageUrl) && (
        <BlockStack>
            <div style={{ display: "flex", padding: "18px", alignItems: "center" }}>
                <Thumbnail
                    size="large"
                    alt={file ? file.name : "Uploaded Image"}
                    source={
                        file
                            ? validImageTypes.includes(file.type)
                                ? window.URL.createObjectURL(file)
                                : NoteIcon
                        : imageUrl
                    }
                />
                <div style={{ marginLeft: "10px", flexGrow: 1 }}>
                    {file ? file.name : imageName}
                </div>
                <Button
                    onClick={(event) => {
                        event.stopPropagation();
                        setFile("");
                        setImageUrl("");
                    }}
                    variant="plain"
                >
                    <Icon source={XIcon} tone="base" />
                </Button>
            </div>
        </BlockStack>
    );

    // Form Validation
    const validateForm = () => {

        const errors = {
            title: formValues.title && formValues.title.trim() !== "" ? "" : "Title is required.",
            link: formValues.link && formValues.link.trim() !== "" ? "" : "Link is required.",
        };
        
        if (!formValues.width) {
            errors.width = "Banner width is required.";
        } else if (formValues.width > 876) {
            errors.width = "Banner Width must be less than 876px.";
        }  else {
            errors.width = "";
        }

        if (!file && !imageUrl) {
            errors.image = "Image is required.";
        } else if (file) {
            const { type, size } = file;
            if (!validImageTypes.includes(type)) {
                errors.image = "Invalid image type. Only .jpg, .jpeg, and .png are allowed.";
            } else if (size > 8 * 1024 * 1024) {
                errors.image = "Image size must be less than 8 MB.";
            }
        }
        
        setFormErrors(errors);
        return !Object.values(errors).some(Boolean);
    };

    // Edit Offer Banner
    const handleUpdate = async () => {

        if (!validateForm()) return;

        try {

            setIsSaveLoading(true);
            let imageResponse = {};
        
            // Upload image
            if (isImageCahnged) {

                const formData = new FormData();
                formData.append('file', file);
                formData.append('imageId', imageId);

                const uploadImage = await fetch('/app/image/upload', {
                    method: 'POST',
                    body: formData,
                });
        
                imageResponse = await uploadImage.json();
        
                if (!imageResponse.success) {
                    $.wnoty({ type: 'error', message: imageResponse.message, autohideDelay: 3000 });
                    setIsSaveLoading(false);
                    return;
                }
        
                setIsImageCahnged(false);

                if (imageResponse && imageResponse?.data?.id) {
                    setImageId(imageResponse.data.id);
                }
            }
        
            const updateBanner = await fetch('/app/update/banner', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    uid: uid,
                    image: imageResponse?.data || "",
                    formData: formValues,
                    startDate: startDate,
                    endDate: endDate,
                    status: statusIndex
                    // imageId: imageId,
                }),
            });
        
            const updateResponse = await updateBanner.json();
        
            if (!updateResponse.success) {
                $.wnoty({ type: 'error', message: updateResponse.message, autohideDelay: 3000 });
                setIsSaveLoading(false);
                return;
            }
        
            $.wnoty({
                type: 'success',
                message: updateResponse.message,
                autohideDelay: 3000,
            });
        
        } catch (error) {
            $.wnoty({
                type: 'error',
                message: 'Something went wrong while updating the offer banner. Please try again.',
                autohideDelay: 3000,
            });

        } finally {
            setIsSaveLoading(false);
        }        
    };

    return loading ? (

        <SkeletonPage title="Update Offer Banner" backAction={false} primaryAction>
            <Layout>
                <Layout.Section>
                    <Card roundedAbove="sm">
                        <Box paddingBlockStart="600" paddingBlockEnd="100" paddingInline="400">
                            <div style={{ height: "15px" }}></div>
                            <SkeletonDisplayText size="small" />
                            <div style={{ height: "15px" }}></div>
                            <SkeletonBodyText lines={3} />

                            <div style={{ height: "15px" }}></div>
                            <SkeletonDisplayText size="small" />
                            <div style={{ height: "15px" }}></div>
                            <SkeletonBodyText lines={3} />

                            <div style={{ height: "15px" }}></div>
                            <SkeletonDisplayText size="small" />
                            <div style={{ height: "15px" }}></div>
                            <SkeletonBodyText lines={3} />

                            <div style={{ height: "15px" }}></div>
                            <SkeletonDisplayText size="small" />
                            <div style={{ height: "15px" }}></div>
                            <SkeletonBodyText lines={3} />

                            <div style={{ height: "15px" }}></div>
                            <SkeletonDisplayText size="small" />
                            <div style={{ height: "15px" }}></div>
                            <SkeletonBodyText lines={3} />
                        </Box>
                    </Card>
                </Layout.Section>
            </Layout>
        </SkeletonPage>

    ) : (

        <Page 
            title="Update Offer Banner"
            backAction={{content: 'home', url: '/app'}}
            primaryAction={
                <Button 
                    loading={isSaveLoading}
                    onClick={handleUpdate}
                    accessibilityLabel="Update" 
                    variant="primary" 
                    disabled={isSaveLoading} 
                >
                    Update
                </Button>
            }
        >

            <BlockStack gap="500">

                <Layout>

                    <Layout.Section>

                        <Card roundedAbove="sm">

                            <Box paddingBlockStart="600" paddingBlockEnd="100" paddingInline="400">

                                <BlockStack>

                                    <TextField
                                        label="Title"
                                        name="title"
                                        value={formValues.title}
                                        onChange={(e) => handleChange(e, "title")}
                                        placeholder="Title as offer name"
                                        autoComplete="off"
                                        error={formErrors.title}
                                    />

                                    <div style={{ height: "15px" }}></div>

                                    <DropZone label="Image" allowMultiple={false} onDrop={handleDropZoneDrop}>
                                        {uploadedFile}
                                        {fileUpload}
                                    </DropZone>
                                    {formErrors.image && (
                                        <div className="imgError">
                                            <Icon source={AlertCircleIcon} color="critical" />
                                            <span color="critical" variant="bodySm" style={{ marginLeft: '8px' }}>
                                                {formErrors.image}
                                            </span>
                                        </div>
                                    )}
                                    <p style={{ fontSize: "12px", color: "gray" }}>
                                        For the best user experience, use a 576x280 px image for a 576 px banner width. If you adjust the width, scale the image height proportionally to keep the aspect ratio.
                                    </p>
                                   
                                    <div style={{ height: "15px" }}></div>
                                    
                                    <TextField
                                        label="Link"
                                        name="link"
                                        value={formValues.link}
                                        onChange={(e) => handleChange(e, "link")}
                                        placeholder="https://"
                                        autoComplete="off"
                                        error={formErrors.link}
                                    />

                                    <div style={{ height: "15px" }}></div>

                                    <label style={{ marginBottom: "4px" }}>Start Date & Time (UTC)</label>
                                    <DatePicker
                                        selected={startDate}
                                        onChange={handleStartDateChange}
                                        showTimeSelect
                                        timeFormat="HH:mm"
                                        timeIntervals={15}
                                        dateFormat="MMMM d, yyyy h:mm aa"
                                        timeCaption="Time"
                                    />

                                    <div style={{ height: "15px" }}></div>

                                    <label style={{ marginBottom: "4px" }}>End Date & Time (UTC)</label>
                                    <DatePicker
                                        selected={endDate}
                                        onChange={handleEndDateChange}
                                        showTimeSelect
                                        timeFormat="HH:mm"
                                        timeIntervals={15}
                                        dateFormat="MMMM d, yyyy h:mm aa"
                                        timeCaption="Time"
                                    />

                                    <div style={{ height: "15px" }}></div>

                                    <TextField
                                        label="Banner Width (px)"
                                        name="width"
                                        type="number"
                                        value={formValues.width}
                                        onChange={(e) => handleChange(e, "width")}
                                        placeholder="576"
                                        error={formErrors.width}
                                        max="876"
                                    />

                                    <div style={{ height: "15px" }}></div>

                                    <div>
                                        <label htmlFor="end-date-picker">Status</label>
                                        <div style={{ marginTop: "4px" }}>
                                            <ButtonGroup variant="segmented">
                                                <Button
                                                    pressed={statusIndex === 1}
                                                    onClick={() => handleStatusClick(1)}
                                                >
                                                    Active
                                                </Button>
                                                <Button
                                                    pressed={statusIndex === 0}
                                                    onClick={() => handleStatusClick(0)}
                                                >
                                                    Inactive
                                                </Button>
                                            </ButtonGroup>
                                            <p style={{ fontSize: "12px", color: "gray", marginTop: "4px" }}>
                                                If you set this offer banner status as active, all other offer banners status will automatically be set to inactive.
                                            </p>
                                        </div>
                                    </div>

                                </BlockStack>

                            </Box>

                        </Card>
                        
                    </Layout.Section>

                </Layout>

            </BlockStack>

        </Page>
    );
}