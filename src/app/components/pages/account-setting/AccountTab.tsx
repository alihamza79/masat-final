import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import React, { useEffect, useState } from 'react';
import { IconAlertCircle } from '@tabler/icons-react';

// components
import CustomFormLabel from '../../forms/theme-elements/CustomFormLabel';
import CustomSelect from '../../forms/theme-elements/CustomSelect';
import CustomTextField from '../../forms/theme-elements/CustomTextField';
import BlankCard from '../../shared/BlankCard';

// services
import { useSession } from 'next-auth/react';

// images
import { Stack } from '@mui/system';

// countries list
const countries = [
  { value: 'US', label: 'United States' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'ES', label: 'Spain' },
  { value: 'IT', label: 'Italy' },
  { value: 'RO', label: 'Romania' },
  { value: 'BG', label: 'Bulgaria' },
];

// Define props interface
interface AccountTabProps {
  userData: any;
  companyData: any;
  onDataUpdate: (data: any) => void;
  sessionUpdate: any;
}

const AccountTab = ({ userData: initialUserData, companyData: initialCompanyData, onDataUpdate, sessionUpdate }: AccountTabProps) => {
  const { data: session } = useSession();
  
  // User and company state - initialized from props
  const [userData, setUserData] = useState({
    name: initialUserData?.name || '',
    email: initialUserData?.email || '',
    phone: initialUserData?.phone || '',
    image: initialUserData?.image || ''
  });
  
  const [companyData, setCompanyData] = useState({
    name: initialCompanyData?.name || '',
    taxId: initialCompanyData?.taxId || '',
    registrationNumber: initialCompanyData?.registrationNumber || '',
    address: initialCompanyData?.address || '',
    town: initialCompanyData?.town || '',
    country: initialCompanyData?.country || '',
    taxRate: initialCompanyData?.taxRate || 0,
    isVatPayer: initialCompanyData?.isVatPayer || false
  });
  
  const [phoneNumber, setPhoneNumber] = useState(initialUserData?.phone || '');
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [hasTaxSettingsOnly, setHasTaxSettingsOnly] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});
  
  // Auto-hide success message after 3 seconds
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (message.type === 'success') {
      timeoutId = setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
    }
    
    // Cleanup timeout on component unmount or when message changes
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [message]);
  
  // Update local state when props change
  useEffect(() => {
    if (initialUserData) {
      setUserData({
        name: initialUserData.name || '',
        email: initialUserData.email || '',
        phone: initialUserData.phone || '',
        image: initialUserData.image || ''
      });
    }
    
    if (initialCompanyData) {
      setCompanyData({
        name: initialCompanyData.name || '',
        taxId: initialCompanyData.taxId || '',
        registrationNumber: initialCompanyData.registrationNumber || '',
        address: initialCompanyData.address || '',
        town: initialCompanyData.town || '',
        country: initialCompanyData.country || '',
        taxRate: initialCompanyData.taxRate || 0,
        isVatPayer: initialCompanyData.isVatPayer || false
      });
    }
  }, [initialUserData, initialCompanyData]);
  
  // Update the phone number in userData when it changes
  useEffect(() => {
    if (phoneNumber !== userData.phone) {
      setUserData(prev => ({
        ...prev,
        phone: phoneNumber
      }));
    }
  }, [phoneNumber]);
  
  // Handle profile image change
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      
      // Validate file size (max 800KB)
      if (file.size > 800 * 1024) {
        setMessage({ type: 'error', text: 'Image size must be less than 800KB' });
        return;
      }
      
      // Validate file type
      if (!file.type.match(/image\/(jpeg|jpg|png|gif)/i)) {
        setMessage({ type: 'error', text: 'Only JPG, PNG, and GIF images are allowed' });
        return;
      }
      
      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Reset image selection
  const handleResetImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };
  
  // Handle user data change
  const handleUserDataChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setUserData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle company data change
  const handleCompanyDataChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = event.target;
    setCompanyData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  // Handle country selection
  const handleCountryChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setCompanyData(prev => ({ ...prev, country: event.target.value as string }));
  };
  
  // Save profile and company data
  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      setMessage({ type: '', text: '' });
      setFieldErrors({});
      
      // Prepare form data
      const updateData: any = {
        name: userData.name,
        phone: userData.phone
      };
      
      // Check if user is trying to set tax settings without company details
      const hasTaxSettingsOnlyCheck = 
        (companyData.taxRate > 0 || companyData.isVatPayer === true) && 
        !companyData.name &&
        !companyData.taxId &&
        !companyData.registrationNumber &&
        !companyData.address &&
        !companyData.town &&
        !companyData.country;
      
      // Update state for UI indicators
      setHasTaxSettingsOnly(hasTaxSettingsOnlyCheck);
      
      if (hasTaxSettingsOnlyCheck) {
        setMessage({ 
          type: 'error', 
          text: 'Please fill in company details to save tax settings. At minimum, a company name is required.' 
        });
        setLoading(false);
        return;
      }
      
      // Check if any company identifying info is filled
      const hasCompanyName = !!companyData.name;
      
      // If company name is filled, all other required fields must be filled too
      if (hasCompanyName) {
        // Required company fields (all company fields are required if name is filled)
        const requiredCompanyFields = [
          { field: 'taxId', label: 'Tax ID' },
          { field: 'registrationNumber', label: 'Registration Number' },
          { field: 'address', label: 'Address' },
          { field: 'town', label: 'Town/City' },
          { field: 'country', label: 'Country' }
        ];
        
        const missingFields = requiredCompanyFields.filter(
          field => !companyData[field.field as keyof typeof companyData]
        );
        
        // Create errors object for field highlighting
        const errors: Record<string, boolean> = {};
        missingFields.forEach(field => {
          errors[field.field] = true;
        });
        
        if (missingFields.length > 0) {
          const missingFieldNames = missingFields.map(f => f.label).join(', ');
          setFieldErrors(errors);
          setMessage({ 
            type: 'error', 
            text: `All company details are required. Missing: ${missingFieldNames}.` 
          });
          setLoading(false);
          return;
        }
        
        // Include all company data since all required fields are filled
        updateData.company = {
          ...companyData,
          taxRate: Number(companyData.taxRate)
        };
      } else {
        // No company data provided, which is fine - continue without company data
      }
      
      // Add profile image if selected
      if (selectedImage && imagePreview) {
        updateData.profileImage = imagePreview;
      }
      
      console.log('Full update data being sent:', updateData);
      
      // Notify parent about the update instead of making a direct API call
      // The parent will handle updating the data cache
      onDataUpdate(updateData);
      
      setMessage({ type: 'success', text: 'Profile updated successfully' });
      
      // Reset selected image state since it's been saved
      setSelectedImage(null);
      setImagePreview(null);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setMessage({ 
        type: 'error', 
        text: error.message || 'Failed to update profile' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Log when userData changes
  useEffect(() => {
    console.log("userData updated:", userData);
  }, [userData]);

  return (
    <Grid container spacing={3}>
      {/* Only keep success message at the top */}
      {message.text && message.type === 'success' && (
        <Grid item xs={12}>
          <Alert severity="success">{message.text}</Alert>
        </Grid>
      )}
      
      {/* Profile Image Section */}
      <Grid item xs={12}>
        <BlankCard>
          <CardContent>
            <Grid container spacing={3} alignItems="flex-start">
              <Grid item xs={12} md={4} lg={3} sx={{ textAlign: { xs: 'center', md: 'center' } }}>
                <Avatar
                  src={imagePreview || (userData.image ? 
                    userData.image.startsWith('http') ? 
                      userData.image : 
                      `/api/image?path=${encodeURIComponent(userData.image)}` 
                    : "/images/profile/user-1.jpg")}
                  alt={userData.name || "User"}
                  sx={{ width: 150, height: 150, margin: '0 auto' }}
                />
                <Stack direction="row" justifyContent="center" spacing={2} mt={2}>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    component="label"
                    disabled={loading}
                    size="small"
                  >
                    Upload
                    <input 
                      hidden 
                      accept="image/*" 
                      type="file" 
                      onChange={handleImageChange}
                    />
                  </Button>
                  {selectedImage && (
                    <Button 
                      variant="outlined" 
                      color="error" 
                      onClick={handleResetImage}
                      disabled={loading}
                      size="small"
                    >
                      Reset
                    </Button>
                  )}
                </Stack>
                <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
                  JPG, GIF or PNG. Max 800K
                </Typography>
              </Grid>
              
              {/* Personal Information */}
              <Grid item xs={12} md={8} lg={9}>
                <Typography variant="h5" mb={1}>
                  Personal Information
                </Typography>
                <Divider sx={{ mb: 3 }} />
                
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <CustomFormLabel
                      sx={{ mt: 0 }}
                      htmlFor="text-name"
                    >
                      Full Name
                    </CustomFormLabel>
                    <CustomTextField
                      id="text-name"
                      name="name"
                      value={userData.name}
                      onChange={handleUserDataChange}
                      variant="outlined"
                      fullWidth
                      disabled={loading}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <CustomFormLabel
                      sx={{ mt: 0 }}
                      htmlFor="text-phone"
                    >
                      Phone
                    </CustomFormLabel>
                    <CustomTextField
                      id="text-phone"
                      name="phone"
                      value={userData.phone}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const value = e.target.value;
                        setUserData(prev => ({ ...prev, phone: value }));
                      }}
                      variant="outlined"
                      fullWidth
                      disabled={loading}
                      placeholder="Enter phone number"
                    />
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </CardContent>
        </BlankCard>
      </Grid>
      
      {/* Company Details */}
      <Grid item xs={12}>
        <BlankCard>
          <CardContent>
            <Typography variant="h5" mb={1}>
              Company Details
              {hasTaxSettingsOnly && (
                <Typography 
                  component="span" 
                  color="error" 
                  sx={{ 
                    fontSize: '0.875rem',
                    fontWeight: 'normal',
                    ml: 2,
                    display: 'inline-flex',
                    alignItems: 'center'
                  }}
                >
                  <IconAlertCircle size={16} style={{ marginRight: '4px' }} />
                  Please provide company information to save tax settings
                </Typography>
              )}
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <CustomFormLabel
                  sx={{ mt: 0 }}
                  htmlFor="company-name"
                >
                  Company Name
                </CustomFormLabel>
                <CustomTextField
                  id="company-name"
                  name="name"
                  value={companyData.name}
                  onChange={handleCompanyDataChange}
                  variant="outlined"
                  fullWidth
                  disabled={loading}
                  // Highlight field with error if tax settings are being saved without company name
                  error={hasTaxSettingsOnly}
                  helperText={hasTaxSettingsOnly ? "Required field" : ""}
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <CustomFormLabel
                  sx={{ mt: 0 }}
                  htmlFor="tax-id"
                >
                  Tax ID
                </CustomFormLabel>
                <CustomTextField
                  id="tax-id"
                  name="taxId"
                  value={companyData.taxId}
                  onChange={handleCompanyDataChange}
                  variant="outlined"
                  fullWidth
                  disabled={loading}
                  error={fieldErrors.taxId}
                  helperText={fieldErrors.taxId ? "Required field" : ""}
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <CustomFormLabel
                  sx={{ mt: 0 }}
                  htmlFor="registration-number"
                >
                  Registration Number
                </CustomFormLabel>
                <CustomTextField
                  id="registration-number"
                  name="registrationNumber"
                  value={companyData.registrationNumber}
                  onChange={handleCompanyDataChange}
                  variant="outlined"
                  fullWidth
                  disabled={loading}
                  error={fieldErrors.registrationNumber}
                  helperText={fieldErrors.registrationNumber ? "Required field" : ""}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <CustomFormLabel
                  sx={{ mt: { xs: 2, md: 0 } }}
                  htmlFor="address"
                >
                  Address
                </CustomFormLabel>
                <CustomTextField
                  id="address"
                  name="address"
                  value={companyData.address}
                  onChange={handleCompanyDataChange}
                  variant="outlined"
                  fullWidth
                  disabled={loading}
                  error={fieldErrors.address}
                  helperText={fieldErrors.address ? "Required field" : ""}
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <CustomFormLabel
                  sx={{ mt: { xs: 2, md: 0 } }}
                  htmlFor="town"
                >
                  Town/City
                </CustomFormLabel>
                <CustomTextField
                  id="town"
                  name="town"
                  value={companyData.town}
                  onChange={handleCompanyDataChange}
                  variant="outlined"
                  fullWidth
                  disabled={loading}
                  error={fieldErrors.town}
                  helperText={fieldErrors.town ? "Required field" : ""}
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <CustomFormLabel
                  sx={{ mt: { xs: 2, md: 0 } }}
                  htmlFor="country"
                >
                  Country
                </CustomFormLabel>
                <CustomSelect
                  fullWidth
                  id="country"
                  name="country"
                  variant="outlined"
                  value={companyData.country}
                  onChange={handleCountryChange}
                  disabled={loading}
                  error={fieldErrors.country}
                >
                  <MenuItem value="">Select Country</MenuItem>
                  {countries.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </CustomSelect>
                {fieldErrors.country && (
                  <Typography variant="caption" color="error">
                    Required field
                  </Typography>
                )}
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <CustomFormLabel
                  sx={{ mt: 2 }}
                  htmlFor="tax-rate"
                >
                  Tax Rate
                </CustomFormLabel>
                <CustomSelect
                  id="tax-rate"
                  name="taxRate"
                  value={companyData.taxRate}
                  onChange={(e: React.ChangeEvent<{ value: unknown }>) => {
                    const value = e.target.value;
                    setCompanyData(prev => ({
                      ...prev,
                      taxRate: Number(value)
                    }));
                  }}
                  variant="outlined"
                  fullWidth
                  disabled={loading}
                >
                  <MenuItem value={1}>1%</MenuItem>
                  <MenuItem value={3}>3%</MenuItem>
                  <MenuItem value={16}>16%</MenuItem>
                </CustomSelect>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Box pt={4.5}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={companyData.isVatPayer}
                        onChange={handleCompanyDataChange}
                        name="isVatPayer"
                        color="primary"
                        disabled={loading}
                      />
                    }
                    label="VAT Payer"
                  />
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </BlankCard>
      </Grid>
      
      {/* Save Changes Button */}
      <Grid item xs={12}>
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={2} 
          sx={{ 
            justifyContent: 'flex-end',
            alignItems: { xs: 'stretch', sm: 'center' } 
          }} 
          mt={1}
        >
          <Button 
            size="large" 
            variant="contained" 
            color="primary" 
            onClick={handleSaveProfile}
            disabled={loading}
            sx={{ 
              minWidth: '150px',
              alignSelf: { xs: 'stretch', sm: 'auto' }
            }}
          >
            {loading ? <CircularProgress size={24} /> : 'Save Changes'}
          </Button>
        </Stack>
      </Grid>
    </Grid>
  );
};

export default AccountTab;
