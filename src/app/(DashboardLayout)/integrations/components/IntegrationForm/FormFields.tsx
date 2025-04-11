'use client';
import React from 'react';
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  IconButton,
  SelectChangeEvent,
  Typography
} from '@mui/material';
import { IconEye, IconEyeOff } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { IntegrationFormData } from '../IntegrationFormDialog';

interface FormFieldsProps {
  formData: IntegrationFormData;
  isEdit: boolean;
  showPassword: boolean;
  setShowPassword: React.Dispatch<React.SetStateAction<boolean>>;
  handleTextChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleSelectChange: (event: SelectChangeEvent) => void;
}

const FormFields: React.FC<FormFieldsProps> = ({
  formData,
  isEdit,
  showPassword,
  setShowPassword,
  handleTextChange,
  handleSelectChange
}) => {
  const { t } = useTranslation();

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label={t('integrations.form.fields.accountName')}
          name="accountName"
          value={formData.accountName}
          onChange={handleTextChange}
          variant="outlined"
          size="small"
          required
          InputLabelProps={{
            sx: { 
              mt: 0.2,
              ml: 1,
              "&.MuiInputLabel-shrink": {
                ml: 0
              }
            }
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderRadius: '8px',
              },
              '& input': {
                pl: 2,
                py: 1.5
              }
            }
          }}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <FormControl fullWidth size="small">
          <InputLabel id="region-label" sx={{ 
            mt: 0.2,
            ml: 1,
            "&.MuiInputLabel-shrink": {
              ml: 0
            }
          }}>{t('integrations.form.fields.region')}</InputLabel>
          <Select
            labelId="region-label"
            id="region"
            name="region"
            value={formData.region}
            label={t('integrations.form.fields.region')}
            onChange={handleSelectChange}
            required
            disabled={isEdit}
            sx={{
              borderRadius: '8px',
              '& .MuiSelect-select': {
                pl: 2,
                py: 1.5
              }
            }}
          >
            <MenuItem value="Romania">Romania</MenuItem>
            <MenuItem value="Bulgaria">Bulgaria</MenuItem>
            <MenuItem value="Hungary">Hungary</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label={t('integrations.form.fields.username')}
          name="username"
          value={formData.username}
          onChange={handleTextChange}
          variant="outlined"
          size="small"
          required
          disabled={isEdit}
          InputLabelProps={{
            sx: { 
              mt: 0.2,
              ml: 1,
              "&.MuiInputLabel-shrink": {
                ml: 0
              }
            }
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderRadius: '8px',
              },
              '& input': {
                pl: 2,
                py: 1.5
              }
            }
          }}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label={t('integrations.form.fields.password')}
          name="password"
          type={showPassword ? 'text' : 'password'}
          value={formData.password}
          onChange={handleTextChange}
          variant="outlined"
          size="small"
          required={!isEdit}
          placeholder={isEdit ? t('integrations.form.fields.passwordPlaceholder') : ""}
          helperText={isEdit ? t('integrations.form.fields.passwordHelp') : ""}
          FormHelperTextProps={{
            sx: { 
              mt: 0.5,
              mb: 0
            }
          }}
          InputProps={{
            endAdornment: (
              <IconButton
                aria-label="toggle password visibility"
                onClick={() => setShowPassword(!showPassword)}
                edge="end"
                size="small"
              >
                {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
              </IconButton>
            )
          }}
          InputLabelProps={{
            sx: { 
              mt: 0.2,
              ml: 1,
              "&.MuiInputLabel-shrink": {
                ml: 0
              }
            }
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderRadius: '8px',
              },
              '& input': {
                pl: 2,
                py: 1.5
              }
            }
          }}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <FormControl fullWidth size="small" sx={{ mt: isEdit ? -1 : 0 }}>
          <InputLabel id="account-type-label" sx={{ 
            mt: 0.2,
            ml: 1,
            "&.MuiInputLabel-shrink": {
              ml: 0
            }
          }}>{t('integrations.form.fields.accountType')}</InputLabel>
          <Select
            labelId="account-type-label"
            id="accountType"
            name="accountType"
            value={formData.accountType}
            label={t('integrations.form.fields.accountType')}
            onChange={handleSelectChange}
            required
            disabled={isEdit}
            sx={{
              borderRadius: '8px',
              '& .MuiSelect-select': {
                pl: 2,
                py: 1.5
              }
            }}
          >
            <MenuItem value="FBE">{t('integrations.form.fields.fbe')}</MenuItem>
            <MenuItem value="Non-FBE">{t('integrations.form.fields.nonFbe')}</MenuItem>
          </Select>
        </FormControl>
      </Grid>
    </Grid>
  );
};

export default FormFields; 