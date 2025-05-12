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
import { useTranslation } from 'react-i18next';

// components
import CustomFormLabel from '../../forms/theme-elements/CustomFormLabel';
import CustomSelect from '../../forms/theme-elements/CustomSelect';
import CustomTextField from '../../forms/theme-elements/CustomTextField';
import BlankCard from '../../shared/BlankCard';

// services
import { useSession } from 'next-auth/react';

// images
import { Stack } from '@mui/system';

// country codes
const countryCodes = ['US', 'GB', 'DE', 'FR', 'ES', 'IT', 'RO', 'BG'];

// Tax rate options
const taxRateOptions = [1, 3, 16];

// Define props interface
interface AccountTabProps {
  userData: any;
  companyData: any;
  onDataUpdate: (data: any) => void;
  sessionUpdate: any;
}

const AccountTab = ({ userData: initialUserData, companyData: initialCompanyData, onDataUpdate, sessionUpdate }: AccountTabProps) => {
  const { data: session } = useSession();
  const { t } = useTranslation();
  
  // Get translated country names
  const countries = countryCodes.map(code => ({
    value: code,
    label: t(`accountSettings.account.countries.${code}`)
  }));
  
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
  const [imageUploading, setImageUploading] = useState(false);
  const [hasImageChanged, setHasImageChanged] = useState(false);
  
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
      setImageUploading(true);
      
      // Validate file size (max 800KB)
      if (file.size > 800 * 1024) {
        setMessage({ type: 'error', text: t('accountSettings.account.errors.imageTooLarge') });
        setImageUploading(false);
        return;
      }
      
      // Validate file type
      if (!file.type.match(/image\/(jpeg|jpg|png|gif)/i)) {
        setMessage({ type: 'error', text: t('accountSettings.account.errors.invalidImage') });
        setImageUploading(false);
        return;
      }
      
      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setHasImageChanged(true);
        setImageUploading(false);
      };
      reader.onerror = () => {
        setMessage({ type: 'error', text: t('accountSettings.account.errors.imageUploadFailed') });
        setImageUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Reset image selection
  const handleResetImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setHasImageChanged(false);
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
          text: t('accountSettings.account.provideName')
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
          { field: 'taxId', label: t('accountSettings.account.taxId') },
          { field: 'registrationNumber', label: t('accountSettings.account.regNumber') },
          { field: 'address', label: t('accountSettings.account.address') },
          { field: 'town', label: t('accountSettings.account.town') },
          { field: 'country', label: t('accountSettings.account.country') }
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
            text: t('accountSettings.account.companyDetailsRequired', { fields: missingFieldNames })
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
      
      // Notify parent about the update
      await onDataUpdate(updateData);
      
      // Show success message
      setMessage({ type: 'success', text: t('accountSettings.account.saveSuccess') });
      
      // If image was changed, wait longer and show loading state
      if (hasImageChanged) {
        setMessage({ 
          type: 'success', 
          text: t('accountSettings.account.saveSuccess') + ' - ' + t('accountSettings.account.refreshing') 
        });
        
        // Wait for 3 seconds before reload to ensure image is processed
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Force a hard reload
        window.location.href = window.location.href;
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setMessage({ type: 'error', text: String(error) });
      setLoading(false);
    }
  };
  
  return (
    <Grid container spacing={3}>
      {message.text && message.type === 'error' && (
        <Grid item xs={12}>
          <Alert severity="error">{message.text}</Alert>
        </Grid>
      )}
      {message.text && message.type === 'success' && (
        <Grid item xs={12}>
          <Alert severity="success">{message.text}</Alert>
        </Grid>
      )}
      
      {/* Personal Information */}
      <Grid item xs={12}>
        <BlankCard>
          <CardContent>
            <Grid container spacing={3} alignItems="flex-start">
              <Grid item xs={12} md={4} lg={3} sx={{ textAlign: { xs: 'center', md: 'center' } }}>
                <Box position="relative" sx={{ width: 150, height: 150, margin: '0 auto' }}>
                  <Avatar
                    src={imagePreview || (userData.image ? 
                      userData.image.startsWith('http') ? 
                        userData.image : 
                        `/api/image?path=${encodeURIComponent(userData.image)}` 
                      : "/images/profile/user-1.jpg")}
                    alt={userData.name || "User"}
                    sx={{ width: '100%', height: '100%' }}
                  />
                  {imageUploading && (
                    <Box
                      position="absolute"
                      top={0}
                      left={0}
                      right={0}
                      bottom={0}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      bgcolor="rgba(0, 0, 0, 0.5)"
                      borderRadius="50%"
                    >
                      <CircularProgress sx={{ color: 'white' }} />
                    </Box>
                  )}
                </Box>
                <Stack direction="row" justifyContent="center" spacing={2} mt={2}>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    component="label"
                    disabled={loading || imageUploading}
                    size="small"
                  >
                    {t('accountSettings.account.upload')}
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
                      disabled={loading || imageUploading}
                      size="small"
                    >
                      {t('accountSettings.account.reset')}
                    </Button>
                  )}
                </Stack>
                <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
                  {t('accountSettings.account.imageRestrictions')}
                </Typography>
              </Grid>
              
              {/* Personal Information */}
              <Grid item xs={12} md={8} lg={9}>
                <Typography variant="h5" mb={1}>
                  {t('accountSettings.account.personalInfo')}
                </Typography>
                <Divider sx={{ mb: 3 }} />
                
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <CustomFormLabel
                      sx={{ mt: { xs: 2, md: 0 } }}
                      htmlFor="name"
                    >
                      {t('accountSettings.account.name')}
                    </CustomFormLabel>
                    <CustomTextField
                      id="name"
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
                      sx={{ mt: { xs: 2, md: 0 } }}
                      htmlFor="email"
                    >
                      {t('accountSettings.account.email')}
                    </CustomFormLabel>
                    <CustomTextField
                      id="email"
                      name="email"
                      value={userData.email}
                      variant="outlined"
                      fullWidth
                      disabled={true}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <CustomFormLabel
                      sx={{ mt: { xs: 2, md: 0 } }}
                      htmlFor="phone"
                    >
                      {t('accountSettings.account.phone')}
                    </CustomFormLabel>
                    <CustomTextField
                      id="phone"
                      name="phone"
                      value={phoneNumber}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        // Only allow numeric input
                        const numericValue = e.target.value.replace(/[^0-9]/g, '');
                        setPhoneNumber(numericValue);
                      }}
                      variant="outlined"
                      fullWidth
                      disabled={loading}
                      type="tel"
                      inputProps={{
                        inputMode: 'numeric',
                        pattern: '[0-9]*'
                      }}
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
              {t('accountSettings.account.companyDetails')}
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
                  {t('accountSettings.account.provideTaxSettings')}
                </Typography>
              )}
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <CustomFormLabel
                  sx={{ mt: { xs: 2, md: 0 } }}
                  htmlFor="company-name"
                >
                  {t('accountSettings.account.name')}
                </CustomFormLabel>
                <CustomTextField
                  id="company-name"
                  name="name"
                  value={companyData.name}
                  onChange={handleCompanyDataChange}
                  variant="outlined"
                  fullWidth
                  disabled={loading}
                />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <CustomFormLabel
                  sx={{ mt: { xs: 2, md: 0 } }}
                  htmlFor="registration-number"
                >
                  {t('accountSettings.account.regNumber')}
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
                  helperText={fieldErrors.registrationNumber ? t('accountSettings.account.requiredField') : ""}
                />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <CustomFormLabel
                  sx={{ mt: { xs: 2, md: 0 } }}
                  htmlFor="tax-rate"
                >
                  {t('accountSettings.account.taxRate')}
                </CustomFormLabel>
                <CustomSelect
                  id="tax-rate"
                  name="taxRate"
                  value={companyData.taxRate || ''}
                  onChange={handleCompanyDataChange}
                  variant="outlined"
                  fullWidth
                  disabled={loading}
                >
                  <MenuItem value="">{t('accountSettings.account.selectTaxRate')}</MenuItem>
                  {taxRateOptions.map((rate) => (
                    <MenuItem key={rate} value={rate}>
                      {rate}%
                    </MenuItem>
                  ))}
                </CustomSelect>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <CustomFormLabel
                  sx={{ mt: { xs: 2, md: 0 } }}
                  htmlFor="tax-id"
                >
                  {t('accountSettings.account.taxId')}
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
                  helperText={fieldErrors.taxId ? t('accountSettings.account.requiredField') : ""}
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={6}>
                <CustomFormLabel
                  sx={{ mt: { xs: 2, md: 0 } }}
                  htmlFor="address"
                >
                  {t('accountSettings.account.address')}
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
                  helperText={fieldErrors.address ? t('accountSettings.account.requiredField') : ""}
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <CustomFormLabel
                  sx={{ mt: { xs: 2, md: 0 } }}
                  htmlFor="town"
                >
                  {t('accountSettings.account.town')}
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
                  helperText={fieldErrors.town ? t('accountSettings.account.requiredField') : ""}
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <CustomFormLabel
                  sx={{ mt: { xs: 2, md: 0 } }}
                  htmlFor="country"
                >
                  {t('accountSettings.account.country')}
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
                  <MenuItem value="">{t('accountSettings.account.selectCountry')}</MenuItem>
                  {countries.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </CustomSelect>
                {fieldErrors.country && (
                  <Typography variant="caption" color="error">
                    {t('accountSettings.account.requiredField')}
                  </Typography>
                )}
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ pt: { xs: 0, md: 4 } }}>
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
                    label={t('accountSettings.account.isVatPayer')}
                  />
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </BlankCard>
      </Grid>
      
      {/* Save button */}
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
            {loading ? <CircularProgress size={24} /> : t('accountSettings.account.saveChanges')}
          </Button>
        </Stack>
      </Grid>
    </Grid>
  );
};

export default AccountTab;
