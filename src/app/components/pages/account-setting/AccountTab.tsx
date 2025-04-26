import React, { useState, useEffect } from 'react';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Divider from '@mui/material/Divider';

// components
import BlankCard from '../../shared/BlankCard';
import CustomTextField from '../../forms/theme-elements/CustomTextField';
import CustomFormLabel from '../../forms/theme-elements/CustomFormLabel';
import CustomSelect from '../../forms/theme-elements/CustomSelect';

// services
import axios from 'axios';
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

const AccountTab = () => {
  const { data: session, update } = useSession();
  
  // User and company state
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    phone: '',
    image: ''
  });
  
  const [companyData, setCompanyData] = useState({
    name: '',
    taxId: '',
    registrationNumber: '',
    address: '',
    town: '',
    country: '',
    taxRate: 0,
    isVatPayer: false
  });
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Load user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/user/profile');
        
        if (response.data.success) {
          const { user, company } = response.data.data;
          
          // Set user data
          setUserData({
            name: user.name || '',
            email: user.email || '',
            phone: user.phone || '',
            image: user.image || ''
          });
          
          // Set company data if exists
          if (company) {
            setCompanyData({
              name: company.name || '',
              taxId: company.taxId || '',
              registrationNumber: company.registrationNumber || '',
              address: company.address || '',
              town: company.town || '',
              country: company.country || '',
              taxRate: company.taxRate || 0,
              isVatPayer: company.isVatPayer || false
            });
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setMessage({ type: 'error', text: 'Failed to load user data' });
      } finally {
        setLoading(false);
      }
    };
    
    if (session?.user) {
      fetchUserData();
    }
  }, [session]);
  
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
      
      // Prepare form data
      const updateData: any = {
        name: userData.name,
        phone: userData.phone
      };
      
      // Add company data if any field is filled
      if (
        companyData.name ||
        companyData.taxId ||
        companyData.registrationNumber ||
        companyData.address ||
        companyData.town ||
        companyData.country
      ) {
        updateData.company = companyData;
      }
      
      // Add profile image if selected
      if (selectedImage && imagePreview) {
        updateData.profileImage = imagePreview;
      }
      
      // Send update request
      const response = await axios.put('/api/user/profile', updateData);
      
      if (response.data.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully' });
        
        // Update session with new user data
        if (session) {
          await update({
            ...session,
            user: {
              ...session.user,
              name: userData.name,
              image: response.data.data.user.image
            }
          });
        }
      } else {
        setMessage({ type: 'error', text: response.data.error || 'Failed to update profile' });
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Failed to update profile' 
      });
    } finally {
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
                      onChange={handleUserDataChange}
                      variant="outlined"
                      fullWidth
                      disabled={loading}
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
                >
                  <MenuItem value="">Select Country</MenuItem>
                  {countries.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </CustomSelect>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <CustomFormLabel
                  sx={{ mt: 2 }}
                  htmlFor="tax-rate"
                >
                  Tax Rate (%)
                </CustomFormLabel>
                <CustomTextField
                  id="tax-rate"
                  name="taxRate"
                  value={companyData.taxRate}
                  onChange={handleCompanyDataChange}
                  variant="outlined"
                  fullWidth
                  type="number"
                  disabled={loading}
                />
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
        <Stack direction="row" spacing={2} sx={{ justifyContent: 'end' }} mt={1}>
          <Button 
            size="large" 
            variant="contained" 
            color="primary" 
            onClick={handleSaveProfile}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Save Changes'}
          </Button>
          <Button 
            size="large" 
            variant="text" 
            color="error"
            disabled={loading}
          >
            Cancel
          </Button>
        </Stack>
      </Grid>
    </Grid>
  );
};

export default AccountTab;
