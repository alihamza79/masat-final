'use client';

import { useState } from 'react';
import { Box, Button, Container, Typography, Paper, CircularProgress, TextField, InputAdornment, Grid, Chip, Card, CardMedia, CardContent, Divider, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, DialogContentText } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ListIcon from '@mui/icons-material/List';
import SearchIcon from '@mui/icons-material/Search';
import FolderIcon from '@mui/icons-material/Folder';
import DeleteIcon from '@mui/icons-material/Delete';

export default function TestUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [s3Status, setS3Status] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  // State for listing images
  const [listingImages, setListingImages] = useState(false);
  const [imagesList, setImagesList] = useState<any>(null);
  const [prefixFilter, setPrefixFilter] = useState('');
  const [maxResults, setMaxResults] = useState('20');
  
  // State for deleting images
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [deleteResult, setDeleteResult] = useState<any>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0];
      setFile(selectedFile);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch('/api/upload-test', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      setUploadResult(result);
      
      // If successful, clear the form and refresh the images list
      if (result.success) {
        setFile(null);
        setPreview(null);
        
        // Refresh the images list with the appropriate prefix
        if (result.s3Key) {
          const folderPath = result.s3Key.split('/')[0];
          setPrefixFilter(folderPath + '/');
          listImages(folderPath + '/');
        }
      }
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadResult({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      setUploading(false);
    }
  };

  const checkS3Connection = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-s3');
      const data = await response.json();
      setS3Status(data);
    } catch (error) {
      setS3Status({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      setLoading(false);
    }
  };
  
  const listImages = async (prefixOverride?: string) => {
    setListingImages(true);
    try {
      const prefix = prefixOverride !== undefined ? prefixOverride : prefixFilter;
      const max = parseInt(maxResults, 10) || 20;
      
      const response = await fetch(`/api/list-images?prefix=${encodeURIComponent(prefix)}&maxResults=${max}`);
      const data = await response.json();
      setImagesList(data);
    } catch (error) {
      setImagesList({ 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      });
    } finally {
      setListingImages(false);
    }
  };
  
  const handlePrefixChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPrefixFilter(event.target.value);
  };
  
  const handleMaxResultsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow positive integers
    const value = event.target.value.replace(/[^0-9]/g, '');
    setMaxResults(value);
  };
  
  const handleListSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    listImages();
  };
  
  // Handle image deletion
  const handleDeleteImage = async (key: string) => {
    setDeletingKey(key);
    setConfirmDeleteOpen(true);
  };
  
  const confirmDelete = async () => {
    if (!deletingKey) return;
    
    try {
      const response = await fetch('/api/delete-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key: deletingKey }),
      });
      
      const result = await response.json();
      setDeleteResult(result);
      
      // If successful, refresh the images list
      if (result.success) {
        listImages();
      }
    } catch (error) {
      console.error('Delete failed:', error);
      setDeleteResult({ 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      });
    } finally {
      setDeletingKey(null);
      setConfirmDeleteOpen(false);
    }
  };
  
  const cancelDelete = () => {
    setDeletingKey(null);
    setConfirmDeleteOpen(false);
  };
  
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        S3 Integration Test
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          1. Check S3 Connection
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={checkS3Connection}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          Test S3 Connection
        </Button>
        
        {s3Status && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, overflow: 'auto' }}>
            <Typography variant="subtitle2">Connection Result:</Typography>
            <pre style={{ margin: 0 }}>{JSON.stringify(s3Status, null, 2)}</pre>
          </Box>
        )}
      </Paper>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          2. Test Image Upload
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-start' }}>
          <Button
            variant="contained"
            component="label"
            startIcon={<CloudUploadIcon />}
          >
            Select Image
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={handleFileChange}
            />
          </Button>
          
          {preview && (
            <Box sx={{ mt: 2, border: '1px solid #ccc', borderRadius: 1, p: 1, maxWidth: '100%' }}>
              <Typography variant="subtitle2" gutterBottom>
                Selected Image:
              </Typography>
              <img 
                src={preview} 
                alt="Preview" 
                style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }} 
              />
            </Box>
          )}
          
          <Button
            variant="contained"
            color="secondary"
            onClick={handleUpload}
            disabled={!file || uploading}
            startIcon={uploading ? <CircularProgress size={20} /> : null}
          >
            {uploading ? 'Uploading...' : 'Upload to S3'}
          </Button>
          
          {uploadResult && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, overflow: 'auto', width: '100%' }}>
              <Typography variant="subtitle2">Upload Result:</Typography>
              <pre style={{ margin: 0 }}>{JSON.stringify(uploadResult, null, 2)}</pre>
            </Box>
          )}
        </Box>
      </Paper>
      
      {deleteResult && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Delete Result
          </Typography>
          <Box sx={{ p: 2, bgcolor: deleteResult.success ? 'success.light' : 'error.light', borderRadius: 1 }}>
            <Typography variant="subtitle2" color={deleteResult.success ? 'success.dark' : 'error.dark'}>
              {deleteResult.success ? 'File Deleted Successfully' : 'Delete Failed'}
            </Typography>
            <pre style={{ margin: 0 }}>{JSON.stringify(deleteResult, null, 2)}</pre>
          </Box>
        </Paper>
      )}
      
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          3. List Images in S3
        </Typography>
        
        <Box component="form" onSubmit={handleListSubmit} sx={{ mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Folder/Prefix"
                value={prefixFilter}
                onChange={handlePrefixChange}
                placeholder="Leave empty for all objects"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <FolderIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                helperText="Filter by folder path (e.g., 'test-uploads/')"
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Max Results"
                value={maxResults}
                onChange={handleMaxResultsChange}
                placeholder="20"
                type="text"
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                onClick={() => listImages()}
                disabled={listingImages}
                startIcon={listingImages ? <CircularProgress size={20} /> : <ListIcon />}
                sx={{ height: '56px' }}
                type="submit"
              >
                List Images
              </Button>
            </Grid>
          </Grid>
        </Box>
        
        {imagesList && (
          <Box sx={{ mt: 2 }}>
            {imagesList.success ? (
              <>
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle1">
                    Found {imagesList.totalCount} image(s) {prefixFilter && `in "${prefixFilter}"`}
                  </Typography>
                  <Chip 
                    label={`Bucket: ${imagesList.bucket}`}
                    color="primary"
                    variant="outlined"
                    size="small"
                  />
                </Box>
                
                <Divider sx={{ mb: 2 }} />
                
                {imagesList.images.length === 0 ? (
                  <Typography sx={{ py: 2, textAlign: 'center', color: 'text.secondary' }}>
                    No images found in this location
                  </Typography>
                ) : (
                  <Grid container spacing={2}>
                    {imagesList.images.map((image: any, index: number) => (
                      <Grid item xs={12} sm={6} md={4} key={index}>
                        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                          {image.key.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                            <CardMedia
                              component="img"
                              height="140"
                              image={image.url}
                              alt={image.key}
                              sx={{ objectFit: 'cover' }}
                            />
                          ) : (
                            <Box 
                              sx={{ 
                                height: 140, 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                bgcolor: 'primary.light' 
                              }}
                            >
                              <Typography color="white" variant="body2">Non-image file</Typography>
                            </Box>
                          )}
                          <CardContent sx={{ flexGrow: 1 }}>
                            <Typography variant="body2" noWrap title={image.key}>
                              {image.key.split('/').pop()}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" component="div">
                              Size: {formatBytes(image.size)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" component="div">
                              Modified: {formatDate(image.lastModified)}
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                              <Button 
                                size="small"
                                href={image.url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                View
                              </Button>
                              <IconButton 
                                size="small" 
                                color="error"
                                onClick={() => handleDeleteImage(image.key)}
                                aria-label="delete"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
                
                {imagesList.isTruncated && (
                  <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <Chip 
                      label="More results available" 
                      color="warning" 
                      size="small"
                    />
                  </Box>
                )}
              </>
            ) : (
              <Box sx={{ p: 2, bgcolor: 'error.light', borderRadius: 1, color: 'error.dark' }}>
                <Typography variant="subtitle2">Error Listing Images:</Typography>
                <pre style={{ margin: 0 }}>{JSON.stringify(imagesList, null, 2)}</pre>
              </Box>
            )}
          </Box>
        )}
      </Paper>
      
      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDeleteOpen}
        onClose={cancelDelete}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          Confirm Deletion
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete this file?<br />
            <strong>{deletingKey}</strong><br /><br />
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDelete}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
} 