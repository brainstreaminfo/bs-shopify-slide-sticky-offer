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
    SkeletonPage,
    SkeletonBodyText,
    SkeletonDisplayText
} from '@shopify/polaris';
import DatePicker from "react-datepicker";
import { authenticate } from "../shopify.server";
import "react-datepicker/dist/react-datepicker.css";
import { useState, useEffect, useCallback } from 'react';
import { NoteIcon, AlertCircleIcon, XIcon } from '@shopify/polaris-icons';

export const loader = async ({ request }) => {
    await authenticate.admin(request);
    return null;
};

export default function CreateBanner() {

    const [loading, setLoading] = useState(true);
    const [isSaveLoading, setIsSaveLoading] = useState(false);

    useEffect(() => {
        setTimeout(() => { setLoading(false); }, 200);
    }, []);

    const [formValues, setFormValues] = useState({
        title: "",
        link: "",
        priority: 1,
        width: 576,
    });

    const [formErrors, setFormErrors] = useState({
        title: "",
        link: "",
        image: "",
        width: "",
        priority: ""
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

    // Image
    const [file, setFile] = useState("");
    const handleDropZoneDrop = useCallback(
        (_dropFiles, acceptedFiles, _rejectedFiles) =>
          setFile(acceptedFiles[0]),
        [],
    );

    const validImageTypes = ['image/jpg', 'image/jpeg', 'image/png'];
    const fileUpload = !file && (
        <DropZone.FileUpload actionHint="Accepts .jpg, .jpeg, and .png" />
    );

    const uploadedFile = file && (

        <BlockStack>

            <div style={{ display: "flex", padding: "18px", alignItems: "center" }}>

                <Thumbnail
                    size="large"
                    alt={file.name}
                    source={
                        validImageTypes.includes(file.type)
                            ? window.URL.createObjectURL(file)
                            : NoteIcon
                    }
                />

                <div style={{ marginLeft: "10px", flexGrow: 1 }}>
                    {file.name}{' '}
                </div>

                <Button
                    onClick={(event) => {
                        event.stopPropagation();
                        setFile("");
                    }}
                    variant="plain"
                >
                    <Icon source={XIcon} tone="base"/>
                </Button>

            </div>

        </BlockStack>
    );
    
    // Form Validation
    const validateForm = () => {

        const errors = {
            title: formValues.title && formValues.title.trim() !== "" ? "" : "Title is required.",
            link: formValues.link && formValues.link.trim() !== "" ? "" : "Link is required.",
            width: formValues.width ? "" : "Banner width is required.",
            priority: formValues.priority ? "" : "Priority is required."
        };
        
        if (!file) {
            errors.image = "Image is required.";
        } else if (!validImageTypes.includes(file.type)) {
            errors.image = "Invalid image type. Only .jpg, .jpeg, and .png are allowed.";
        }  else if (file.size > 15 * 1024 * 1024) {  // 15 MB = 15 * 1024 * 1024 bytes
            errors.image = "Image size must be less than 15 MB.";
        }
        
        setFormErrors(errors);
        return !Object.values(errors).some(Boolean);
    };

    // Save Offer Banner
    const handleSave = async () => {

        if (!validateForm()) return;
    
        try {

            setIsSaveLoading(true);
    
            // Upload image
            const formData = new FormData();
            formData.append('file', file);
    
            const uploadImage = await fetch('/app/image/upload', {
                method: 'POST',
                body: formData,
            });
    
            const imageResponse = await uploadImage.json();
    
            if (!imageResponse.success) {
                $.wnoty({
                    type: 'error',
                    message: imageResponse.message || 'Image upload failed.',
                    autohideDelay: 3000,
                });
                setIsSaveLoading(false);
                return;
            }
    
            // Save banner
            const saveBanner = await fetch('/app/save/banner', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    image: imageResponse.data,
                    formData: formValues,
                    startDate: startDate,
                    endDate: endDate,
                }),
            });
    
            const saveResponse = await saveBanner.json();
    
            if (!saveResponse.success) {
                $.wnoty({
                    type: 'error',
                    message: saveResponse.message || 'Banner save failed.',
                    autohideDelay: 3000,
                });
                setIsSaveLoading(false);
                return;
            }
    
            setFormValues({
                title: "",
                link: "",
                priority: 1,
                width: 576,
            });
            setStartDate(new Date());
            setEndDate(new Date(Date.now() + 86400000));
            setFile("");

            $.wnoty({
                type: 'success',
                message: saveResponse.message,
                autohideDelay: 3000,
            });
    
        } catch (error) {
            $.wnoty({
                type: 'error',
                message: 'Something went wrong while creating the offer banner. Please try again.',
                autohideDelay: 3000,
            });

        } finally {
            setIsSaveLoading(false);
        }
    };

    return loading ? (

        <SkeletonPage title="Create Offer Banner" primaryAction>
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
            title="Create Offer Banner"
            backAction={{content: 'home', url: '/app'}}
            primaryAction={
                <Button 
                    loading={isSaveLoading}
                    onClick={handleSave}
                    accessibilityLabel="Save" 
                    variant="primary" 
                    disabled={isSaveLoading} 
                >
                    Save
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
                                    <p style={{ fontSize: "12px", color: "gray" }}>
                                        For the best user experience, use a 576x280 px image for a 576 px banner width. If you adjust the width, scale the image height proportionally to keep the aspect ratio.
                                    </p>
                                    {formErrors.image && (
                                        <div className="imgError">
                                            <Icon source={AlertCircleIcon} color="critical" />
                                            <span color="critical" variant="bodySm" style={{ marginLeft: '8px' }}>
                                                {formErrors.image}
                                            </span>
                                        </div>
                                    )}

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
                                    
                                    <TextField
                                        label="Priority (1 Highest)"
                                        name="priority"
                                        type="number"
                                        value={formValues.priority}
                                        onChange={(e) => handleChange(e, "priority")}
                                        error={formErrors.priority}
                                    />

                                    <div style={{ height: "15px" }}></div>

                                    <label>Start Date & Time (UTC)</label>
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

                                    <label>End Date & Time (UTC)</label>
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
                                    />

                                    <div style={{ height: "15px" }}></div>

                                </BlockStack>

                            </Box>

                        </Card>
                        
                    </Layout.Section>

                </Layout>

            </BlockStack>

        </Page>
    );
}